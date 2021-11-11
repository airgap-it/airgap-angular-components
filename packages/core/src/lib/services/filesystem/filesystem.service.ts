import { RawData } from '@airgap/coinlib-core/utils/remote-data/RemoteData'
import { RemoteDataFactory } from '@airgap/coinlib-core/utils/remote-data/RemoteDataFactory'
import { Inject, Injectable } from '@angular/core'
import { Directory, Encoding, FilesystemPlugin, ReaddirResult, ReadFileOptions, ReadFileResult, WriteFileOptions, WriteFileResult } from '@capacitor/filesystem'

import { FILESYSTEM_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { UriService } from '../uri/uri.service'

interface Metadata {
  mediaType?: string
  isBinary?: boolean
}

@Injectable({
  providedIn: 'root'
})
export class FilesystemService {
  private readonly remoteDataFactory: RemoteDataFactory

  constructor(
    private readonly uriService: UriService,
    @Inject(FILESYSTEM_PLUGIN) private readonly filesystem: FilesystemPlugin
  ) {
    this.remoteDataFactory = new RemoteDataFactory()
  }

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

  private async readMetadata(path: string): Promise<Metadata> {
    return await this.readFile({
      path: this.getMetadataFilePath(path),
      encoding: Encoding.UTF8
    }).then((result: ReadFileResult) => JSON.parse(result.data))
  }

  private async downloadRemoteImage(path: string): Promise<string | undefined> {
    const uri: string = await this.readFile({
      path: this.getLinkFilePath(path),
      encoding: Encoding.UTF8
    }).then((result: ReadFileResult) => result.data)

    const remoteData = this.remoteDataFactory.create(uri)
    const rawData: RawData | undefined = await remoteData?.getRaw()
    if (!rawData) {
      return undefined
    }

    const base64 = rawData.bytes.toString('base64')

    await this.saveData(
      path, 
      base64, 
      Encoding.UTF8,
      { mediaType: rawData.contentType, isBinary: true }
    )

    return this.uriService.data(base64, rawData.contentType, true)
  }

  public async writeLazyImage(path: string, uri: string): Promise<void> {
    const dataEntry = this.createLazyDataEntry(path, uri)
    await this.saveData(dataEntry.path, dataEntry.data, dataEntry.encoding, dataEntry.metadata)
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

  private createLazyDataEntry(path: string, uri: string): { path: string, data: string, encoding?: Encoding, metadata?: Metadata } {
    const uriType = this.uriService.resolveUriType(uri)
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
          metadata: splitData.mediaType 
            ? { mediaType: splitData.mediaType, isBinary: splitData.isBinary } 
            : undefined
        }
    }
  }

  private async readFile(options: ReadFileOptions): Promise<ReadFileResult> {
    return await this.filesystem.readFile({
      directory: Directory.Data,
      ...options
    })
  }

  private async writeFile(options: WriteFileOptions, retry: boolean = true): Promise<WriteFileResult> {
    return await this.filesystem.writeFile({
      directory: Directory.Data,
      ...options,
      recursive: true
    })
  }

  private async filesInDir(path: string, directory: Directory = Directory.Data): Promise<Set<string>> {
    return await this.filesystem.readdir({
      path,
      directory
    }).then((result: ReaddirResult) => new Set(result.files))
  }

  private getLinkFilePath(path: string): string {
    return `${path}.link`
  }

  private getMetadataFilePath(path: string): string {
    return `${path}.metadata`
  }

  private splitPath(path: string): { dir: string, filename: string } {
    const dirEnd = path.lastIndexOf('/')

    return dirEnd !== -1 
      ? { dir: path.slice(0, dirEnd), filename: path.slice(dirEnd + 1) }
      : { dir: '/', filename: path }
  }
}
