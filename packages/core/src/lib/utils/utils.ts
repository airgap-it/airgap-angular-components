// TODO: Split up into individual files

// https://stackoverflow.com/a/8472700/4790610
export function generateGUID(): string {
  // tslint:disable
  if (typeof window.crypto !== 'undefined' && typeof window.crypto.getRandomValues !== 'undefined') {
    // If we have a cryptographically secure PRNG, use that
    // https://stackoverflow.com/questions/6906916/collisions-when-generating-uuids-in-javascript
    const buf = new Uint16Array(8)
    window.crypto.getRandomValues(buf)
    const S4 = function (num: number): string {
      let ret = num.toString(16)
      while (ret.length < 4) {
        ret = `0${ret}`
      }

      return ret
    }

    return `${S4(buf[0]) + S4(buf[1])}-${S4(buf[2])}-${S4(buf[3])}-${S4(buf[4])}-${S4(buf[5])}${S4(buf[6])}${S4(buf[7])}`
  } else {
    // Otherwise, just use Math.random
    // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      // eslint-disable-next-line no-bitwise
      const r = (Math.random() * 16) | 0
      // eslint-disable-next-line no-bitwise
      const v = c === 'x' ? r : (r & 0x3) | 0x8

      return v.toString(16)
    })
  }
  // tslint:enable
}

export async function to<T, U = Error>(promise: Promise<T>, errorExt?: unknown): Promise<[U | null, T | undefined]> {
  return promise
    .then<[null, T]>((data: T) => [null, data])
    .catch<[U, undefined]>((rejectionError: U) => {
      if (errorExt) {
        Object.assign(rejectionError, errorExt)
      }

      return [rejectionError, undefined]
    })
}

function readParameterFromUrl(url: string, parameter: string): string {
  try {
    const parsedUrl: URL = new URL(url)

    return parsedUrl.searchParams.get(parameter) || ''
  } catch (error) {
    return url
  }
}

export function parseIACUrl(url: string | string[], parameter: string): string[] {
  let parseResult: string[] | undefined
  if (Array.isArray(url)) {
    parseResult = url.map((chunk: string) => readParameterFromUrl(chunk, parameter))
  } else {
    try {
      parseResult = readParameterFromUrl(url, parameter).split(',')
    } catch (error) {
      parseResult = url.split(',')
    }
  }

  // In case one of the elements contains a chunked string, we have to flatten it.
  parseResult = parseResult.reduce((pv: string[], cv: string) => [...pv, ...cv.split(',')], [])

  return parseResult.filter((el: string) => el !== '')
}

export function serializedDataToUrlString(data: string, host: string, parameter: string = 'd'): string {
  return `${host}?${parameter}=${data}`
}

export function toBoolean(value: unknown): boolean {
  // All falsy and truthy values can be converted to a real boolean by using a double negative (!!)
  return Boolean(value)
}

export function assertNever(name: string, arg: never): never {
  throw new Error(`${name} ${arg}`)
}

export const TEMP_BTC_REQUEST_IDS = 'TEMP-BTC-REQUEST-IDS'
export const TEMP_MM_REQUEST_IDS = 'TEMP-MM-REQUEST-IDS'
