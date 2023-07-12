import { Inject, Injectable } from '@angular/core'
import {
  Directory,
  Encoding,
  FileInfo,
  FilesystemPlugin,
  ReaddirResult,
  ReadFileOptions,
  ReadFileResult,
  WriteFileOptions,
  WriteFileResult
} from '@capacitor/filesystem'
import { ZipPlugin } from '../../capacitor-plugins/definitions'

import { FILESYSTEM_PLUGIN, ZIP_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { ImageService } from '../image/image.service'
import { UriService } from '../uri/uri.service'

interface Metadata {
  mediaType?: string
  isBinary?: boolean
}

const MANIFEST_FILENAME = 'manifest.json'
const SIGNATURE_FILENAME = 'module.sig'

const ISOLATED_MODULES_PATH = '__airgap_protocol_modules__'
const ISOLATED_SYMBOLS_PATH = '__symbols__'

@Injectable({
  providedIn: 'root'
})
export class FilesystemService {
  constructor(
    private readonly uriService: UriService,
    private readonly imageService: ImageService,
    @Inject(FILESYSTEM_PLUGIN) private readonly filesystem: FilesystemPlugin,
    @Inject(ZIP_PLUGIN) private readonly zip: ZipPlugin
  ) {}

  public async readLazyImage(path: string): Promise<string | undefined> {
    try {
      const { dir, filename } = this.splitPath(path)
      const filesInDir = await this.filesInDir(dir)

      if (filesInDir.has(filename)) {
        const data: string = await this.readDataFile({ path }).then((result: ReadFileResult) => result.data)

        const metadata: Metadata | undefined = filesInDir.has(this.getMetadataFilePath(filename))
          ? await this.readImageMetadata(path)
          : undefined

        return this.uriService.data(data, metadata.mediaType, metadata.isBinary)
      } else if (filesInDir.has(this.getLinkFilePath(filename))) {
        return this.downloadRemoteImage(path)
      } else {
        return undefined
      }
    } catch (error) {
      return undefined
    }
  }

  public async writeLazyImage(path: string, uri: string): Promise<void> {
    const dataEntry = this.createLazyDataEntry(path, uri)
    await this.saveImageData(dataEntry.path, dataEntry.data, dataEntry.encoding, dataEntry.metadata)
  }

  private async downloadRemoteImage(path: string): Promise<string | undefined> {
    const uri: string = await this.readDataFile({
      path: this.getLinkFilePath(path),
      encoding: Encoding.UTF8
    }).then((result: ReadFileResult) => result.data)

    const base64 = await this.imageService.fetch(uri)
    if (!base64) {
      return undefined
    }

    const splitData = this.uriService.splitDataUri(base64)

    await this.saveImageData(path, splitData.data, Encoding.UTF8, { mediaType: splitData.mediaType, isBinary: splitData.isBinary })

    return base64
  }

  private createLazyDataEntry(path: string, uri: string): { path: string; data: string; encoding?: Encoding; metadata?: Metadata } {
    const uriType = this.uriService.resolveUriType(uri)
    // eslint-disable-next-line default-case
    switch (uriType) {
      case 'remote':
      case 'unsupported':
        return {
          path: this.getLinkFilePath(path),
          data: uri,
          encoding: Encoding.UTF8
        }
      case 'data':
        const splitData = this.uriService.splitDataUri(uri)

        return {
          path,
          data: splitData.data,
          encoding: Encoding.UTF8,
          metadata: splitData.mediaType ? { mediaType: splitData.mediaType, isBinary: splitData.isBinary } : undefined
        }
    }
  }

  public async readIsolatedSymbol(name: string): Promise<string | undefined> {
    try {
      const dir: string = `${ISOLATED_MODULES_PATH}/${ISOLATED_SYMBOLS_PATH}`
      const path: string = `${dir}/${name}`

      const { data }: ReadFileResult = await this.readDataFile({ path })

      const metadata: Metadata = await this.readImageMetadata(path)

      return this.uriService.data(data, metadata.mediaType, metadata.isBinary)
    } catch (error) {
      return undefined
    }
  }

  public async createTempProtocolModule(name: string, path: string): Promise<{ path: string; directory: Directory }> {
    const tempDir = await this.createTempProtocolModuleDir(name)

    try {
      await this.zip.unzip({
        from: path,
        to: tempDir.path,
        toDirectory: tempDir.directory
      })

      return {
        path: tempDir.path,
        directory: tempDir.directory
      }
    } catch (error) {
      await this.removeTempProtocolModule(tempDir.path, tempDir.directory).catch(() => {
        /* no action */
      })
      throw error
    }
  }

  public async removeTempProtocolModule(path: string, directory: Directory): Promise<void> {
    return this.filesystem.rmdir({
      path,
      directory,
      recursive: true
    })
  }

  public async findProtocolModuleRoot(path: string, directory: Directory): Promise<string | undefined> {
    const { type } = await this.filesystem.stat({ path, directory })
    if (type === 'directory') {
      const root = await this.findProtocolModuleRootInDir(path, directory)

      return root?.replace(`${path}/`, '')
    } else {
      return undefined
    }
  }

  private async findProtocolModuleRootInDir(path: string, directory: Directory): Promise<string | undefined> {
    const { files }: ReaddirResult = await this.filesystem.readdir({ path, directory })
    const hasManifest = files.find((file: FileInfo) => file.type === 'file' && file.name === MANIFEST_FILENAME)
    if (hasManifest) {
      return path
    }

    for (const file of files) {
      if (file.type === 'directory') {
        const root: string | undefined = await this.findProtocolModuleRootInDir(`${path}/${file.name}`, directory)
        if (root !== undefined) {
          return root
        }
      }
    }

    return undefined
  }

  public async installProtocolModule(
    identifier: string,
    files: string[],
    symbols: Record<string, string>,
    currentLocation: {
      path: string
      root: string
      directory: Directory
    }
  ): Promise<void> {
    const newPath: string = `${ISOLATED_MODULES_PATH}/${identifier}`
    const newDirectory: Directory = Directory.Data

    try {
      for (const file of [MANIFEST_FILENAME, SIGNATURE_FILENAME, ...files]) {
        const lastSegmentIndex: number = file.lastIndexOf('/')
        const parent = file.substring(0, lastSegmentIndex).replace(/^\/+/, '')

        await this.filesystem
          .mkdir({
            path: `${newPath}/${parent}`,
            directory: newDirectory,
            recursive: true
          })
          .catch(() => {
            /* no action */
          })

        await this.filesystem.copy({
          from: `${currentLocation.path}/${currentLocation.root}/${file}`,
          directory: currentLocation.directory,
          to: `${newPath}/${file}`,
          toDirectory: newDirectory
        })

        const symbolsDir: string = `${ISOLATED_MODULES_PATH}/${ISOLATED_SYMBOLS_PATH}`
        await this.filesystem
          .mkdir({
            path: symbolsDir,
            directory: newDirectory,
            recursive: true
          })
          .catch(() => {
            /* no action */
          })

        await Promise.all(
          Object.entries(symbols).map(async ([symbol, uri]: [string, string]) => {
            const path: string = `${symbolsDir}/${symbol.toLowerCase()}`

            if (uri.startsWith('file://')) {
              const resPath: string = uri.replace(/^file:\/\//, '')
              const extension: string = uri.split('.').slice(-1)[0].toLocaleLowerCase()

              await this.filesystem.copy({
                from: `${currentLocation.path}/${currentLocation.root}/${resPath}`,
                directory: currentLocation.directory,
                to: path,
                toDirectory: newDirectory
              })

              await this.saveImageMetadata(path, {
                mediaType: `image/${extension === 'svg' ? 'svg+xml' : extension}`,
                isBinary: true
              })
            } else if (uri.startsWith('data:image')) {
              const splitData = this.uriService.splitDataUri(uri)
              await this.saveImageData(path, splitData.data, Encoding.UTF8, {
                mediaType: splitData.mediaType,
                isBinary: splitData.isBinary
              })
            }
          })
        )
      }
    } catch (error) {
      await this.removeTempProtocolModule(newPath, newDirectory).catch(() => {
        /* no action */
      })
      throw error
    } finally {
      await this.removeTempProtocolModule(currentLocation.path, currentLocation.directory).catch(() => {
        /* no action */
      })
    }
  }

  private async saveImageData(path: string, data: string, encoding?: Encoding, metadata?: Metadata): Promise<void> {
    await this.writeDataFile({
      path,
      data,
      encoding
    })

    if (metadata) {
      await this.saveImageMetadata(path, metadata)
    }
  }

  private async saveImageMetadata(path: string, metadata: Metadata): Promise<void> {
    await this.writeDataFile({
      path: this.getMetadataFilePath(path),
      data: JSON.stringify(metadata),
      encoding: Encoding.UTF8
    })
  }

  private async readImageMetadata(path: string): Promise<Metadata> {
    return this.readDataFile({
      path: this.getMetadataFilePath(path),
      encoding: Encoding.UTF8
    }).then((result: ReadFileResult) => JSON.parse(result.data))
  }

  private async readDataFile(options: ReadFileOptions): Promise<ReadFileResult> {
    return this.filesystem.readFile({
      directory: Directory.Data,
      ...options
    })
  }

  private async writeDataFile(options: WriteFileOptions): Promise<WriteFileResult> {
    return this.filesystem.writeFile({
      directory: Directory.Data,
      ...options,
      recursive: true
    })
  }

  private async filesInDir(path: string, directory: Directory = Directory.Data): Promise<Set<string>> {
    return this.filesystem
      .readdir({
        path,
        directory
      })
      .then((result: ReaddirResult) => new Set(result.files.map((fileInfo: FileInfo) => fileInfo.uri)))
  }

  private getLinkFilePath(path: string): string {
    return `${path}.link`
  }

  private getMetadataFilePath(path: string): string {
    return `${path}.metadata`
  }

  private splitPath(path: string): { dir: string; filename: string } {
    const dirEnd = path.lastIndexOf('/')

    return dirEnd !== -1 ? { dir: path.slice(0, dirEnd), filename: path.slice(dirEnd + 1) } : { dir: '/', filename: path }
  }

  private async createTempProtocolModuleDir(moduleName: string): Promise<{ path: string; directory: Directory }> {
    const tempDir: string = `protocolmodule_${moduleName.replace(/\.zip$/, '')}_${Date.now()}`
    const directory: Directory = Directory.Cache

    await this.filesystem.mkdir({
      path: tempDir,
      directory
    })

    return { path: tempDir, directory }
  }
}
