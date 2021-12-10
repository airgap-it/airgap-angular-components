import axios, { AxiosResponse } from 'axios'
import { ImageFetcher } from '../image.service'

interface ApiResponseBase {
  jsonrpc: string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  rpc_status: string
}

interface ApiResponseSuccess<T> extends ApiResponseBase {
  // eslint-disable-next-line id-blacklist
  result: T
}

function isApiResponseSuccess<T>(response: ApiResponse<T>): response is ApiResponseSuccess<T> {
  return (response as Partial<ApiResponseSuccess<T>>).result !== undefined
}

interface ApiResponseError extends ApiResponseBase {
  error: {
    code: number
    reason: string
    // eslint-disable-next-line @typescript-eslint/naming-convention
    request_id: string
  }
}

function isApiResponseError<T>(response: ApiResponse<T>): response is ApiResponseError {
  return (response as Partial<ApiResponseError>).error !== undefined
}

type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError

interface ImgProxyFetchParams {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  response_type: 'Raw' | 'Json'
  url: string
  force: boolean
}

interface ImgProxyFetchResult {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  moderation_status: string
  categories: string[]
  data: string
}

type ApiMethod = 'img_proxy_fetch'

type ApiParams<T extends ApiMethod> = T extends 'img_proxy_fetch' ? ImgProxyFetchParams : never
type ApiResult<T extends ApiMethod> = T extends 'img_proxy_fetch' ? ImgProxyFetchResult : never

const API_URL = 'https://imgproxy-prod.cryptonomic-infra.tech'
const API_KEY = '' // TODO: set apikey

export class ImageProxyFetcher implements ImageFetcher {
  constructor(private readonly apiUrl: string = API_URL, private readonly apiKey: string = API_KEY) {}

  public async fetch(uri: string): Promise<string> {
    const result: ImgProxyFetchResult = await this.send('img_proxy_fetch', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      response_type: 'Raw',
      url: uri,
      force: false
    })

    return result.data
  }

  private async send<T extends ApiMethod>(method: T, params: ApiParams<T>): Promise<ApiResult<T>> {
    const response: AxiosResponse<ApiResponse<ApiResult<T>>> = await axios.post(
      this.apiUrl,
      {
        jsonrpc: '1.0.0',
        method,
        params
      },
      {
        headers: {
          apikey: this.apiKey,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'Content-Type': 'application/json'
        }
      }
    )

    if (isApiResponseError(response.data)) {
      throw response.data.error
    }

    if (isApiResponseSuccess(response.data)) {
      return response.data.result
    }

    throw new Error('Unknown error')
  }
}
