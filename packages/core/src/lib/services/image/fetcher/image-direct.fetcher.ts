import { RawData } from '@airgap/coinlib-core/utils/remote-data/RemoteData'
import { RemoteDataFactory } from '@airgap/coinlib-core/utils/remote-data/RemoteDataFactory'
import { UriService } from '../../uri/uri.service'
import { ImageFetcher } from '../image.service'

export class ImageDirectFetcher implements ImageFetcher {
  private readonly remoteDataFactory: RemoteDataFactory

  constructor(private readonly uriService: UriService) {
    this.remoteDataFactory = new RemoteDataFactory()
  }

  public async fetch(uri: string): Promise<string> {
    const remoteData = this.remoteDataFactory.create(uri, {})
    const rawData: RawData | undefined = await remoteData?.getRaw()
    if (!rawData) {
      return undefined
    }

    return this.uriService.data(rawData.bytes.toString('base64'), rawData.contentType, true)
  }
}
