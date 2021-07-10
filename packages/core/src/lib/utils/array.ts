import { Either } from '../types/Either'

export function duplicatesRemoved<T>(array: T[]): T[] {
  return array.filter((item: T, index: number, arr: T[]) => arr.indexOf(item) === index)
}

export function partition<T>(array: T[], isValid: (element: T) => boolean): [T[], T[]] {
  const pass: T[] = []
  const fail: T[] = []
  array.forEach((element: T) => {
    if (isValid(element)) {
      pass.push(element)
    } else {
      fail.push(element)
    }
  })

  return [pass, fail]
}

export function flattened<T>(array: T[][]): T[] {
  return array.reduce((output: T[], next: T[]) => output.concat(next), [])
}

export function merged<T, R>(array: Either<T, R>[]): [T[], R[]] {
  return array.reduce(
    (output: [T[], R[]], next: Either<T, R>) => {
      const [t, r]: Either<T, R> = next
      if (t !== undefined) {
        output[0].push(t)
      }

      if (r !== undefined) {
        output[1].push(r)
      }

      return output
    },
    [[], []]
  )
}
