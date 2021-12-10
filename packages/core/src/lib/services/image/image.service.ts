import { Injectable } from '@angular/core'
import { UriService } from '../uri/uri.service'
import { ImageDirectFetcher } from './fetcher/image-direct.fetcher'
import { ImageProxyFetcher } from './fetcher/image-proxy.fetcher'

export interface ImageFetcher {
  fetch(uri: string): Promise<string | undefined>
}

interface FetchOptions {
  useProxy: boolean
}

const DEFAULT_FETCH_OPTIONS: FetchOptions = {
  useProxy: false
}

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private directFetcher: ImageDirectFetcher | undefined
  private proxyFetcher: ImageProxyFetcher | undefined

  constructor(private readonly uriService: UriService) {}

  public async fetch(uri: string, options: FetchOptions = DEFAULT_FETCH_OPTIONS): Promise<string> {
    return this.getFetcher(options).fetch(uri)
  }

  private getFetcher(options: FetchOptions): ImageFetcher {
    if (options.useProxy) {
      const proxyFetcher = this.proxyFetcher ?? new ImageProxyFetcher()
      if (!this.proxyFetcher) {
        this.proxyFetcher = proxyFetcher
      }

      return proxyFetcher
    }

    const directFetcher = this.directFetcher ?? new ImageDirectFetcher(this.uriService)
    if (!this.directFetcher) {
      this.directFetcher = directFetcher
    }

    return directFetcher
  }
}
