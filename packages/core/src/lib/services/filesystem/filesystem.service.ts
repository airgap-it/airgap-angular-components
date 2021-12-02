import { Inject, Injectable } from '@angular/core'
import {
  Directory,
  Encoding,
  FilesystemPlugin,
  ReaddirResult,
  ReadFileOptions,
  ReadFileResult,
  WriteFileOptions,
  WriteFileResult
} from '@capacitor/filesystem'

import { FILESYSTEM_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { ImageService } from '../image/image.service'
import { UriService } from '../uri/uri.service'

interface Metadata {
  mediaType?: string
  isBinary?: boolean
}

@Injectable({
  providedIn: 'root'
})
export class FilesystemService {
  constructor(
    private readonly uriService: UriService,
    private readonly imageService: ImageService,
    @Inject(FILESYSTEM_PLUGIN) private readonly filesystem: FilesystemPlugin
  ) {}

  public async readLazyImage(path: string): Promise<string | undefined> {
    try {
      const { dir, filename } = this.splitPath(path)
      const filesInDir = await this.filesInDir(dir)

      if (filesInDir.has(filename)) {
        const data: string = await this.readFile({ path }).then((result: ReadFileResult) => result.data)

        const metadata: Metadata | undefined = filesInDir.has(this.getMetadataFilePath(filename))
          ? await this.readMetadata(path)
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
    await this.saveData(dataEntry.path, dataEntry.data, dataEntry.encoding, dataEntry.metadata)
  }

  private async readMetadata(path: string): Promise<Metadata> {
    return this.readFile({
      path: this.getMetadataFilePath(path),
      encoding: Encoding.UTF8
    }).then((result: ReadFileResult) => JSON.parse(result.data))
  }

  private async downloadRemoteImage(path: string): Promise<string | undefined> {
    const uri: string = await this.readFile({
      path: this.getLinkFilePath(path),
      encoding: Encoding.UTF8
    }).then((result: ReadFileResult) => result.data)

    const base64 = await this.imageService.fetch(uri)
    if (!base64) {
      return undefined
    }

    const splitData = this.uriService.splitDataUri(base64)

    await this.saveData(path, splitData.data, Encoding.UTF8, { mediaType: splitData.mediaType, isBinary: splitData.isBinary })

    return base64
  }

  private async saveData(path: string, data: string, encoding?: Encoding, metadata?: Metadata): Promise<void> {
    await this.writeFile({
      path,
      data,
      encoding
    })

    if (metadata) {
      await this.saveMetadata(path, metadata)
    }
  }

  private async saveMetadata(path: string, metadata: Metadata): Promise<void> {
    await this.writeFile({
      path: this.getMetadataFilePath(path),
      data: JSON.stringify(metadata),
      encoding: Encoding.UTF8
    })
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

  private async readFile(options: ReadFileOptions): Promise<ReadFileResult> {
    return this.filesystem.readFile({
      directory: Directory.Data,
      ...options
    })
  }

  private async writeFile(options: WriteFileOptions): Promise<WriteFileResult> {
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
      .then((result: ReaddirResult) => new Set(result.files))
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
}
