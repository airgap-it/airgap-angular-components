import { HttpRemoteData } from '@airgap/coinlib-core/utils/remote-data/HttpRemoteData'
import { IpfsRemoteData } from '@airgap/coinlib-core/utils/remote-data/IpfsRemoteData'
import { Injectable } from '@angular/core'

type UriType = 'remote' | 'data' | 'unsupported'

const SCHEME = {
  data: 'data'
}

const EXTENSION = {
  base64: 'base64'
}

@Injectable({
  providedIn: 'root'
})
export class UriService {
  public resolveUriType(uri: string): UriType {
    if (uri.startsWith(SCHEME.data)) {
      return 'data'
    } else if (IpfsRemoteData.validate(uri) || HttpRemoteData.validate(uri)) {
      return 'remote'
    } else {
      return 'unsupported'
    }
  }

  public splitDataUri(uri: string): { mediaType?: string; isBinary: boolean; data: string } | undefined {
    if (!uri.startsWith(SCHEME.data)) {
      return undefined
    }

    const dataSeparatorIndex: number = uri.indexOf(',')
    const extensionSeparatorIndex: number = uri.indexOf(';')

    const mediaType: string = uri.slice(
      `${SCHEME.data}:`.length,
      extensionSeparatorIndex !== -1 ? extensionSeparatorIndex : dataSeparatorIndex
    )

    const isBinary: boolean = uri.includes(EXTENSION.base64)
    const data: string = uri.slice(dataSeparatorIndex + 1)

    return {
      mediaType: mediaType.length > 0 ? mediaType : undefined,
      isBinary,
      data
    }
  }

  public data(data: string, mediaType: string = '', isBinary: boolean = false): string {
    const extension: string = isBinary ? `;${EXTENSION.base64}` : ''

    return `${SCHEME.data}:${mediaType}${extension},${data}`
  }
}
