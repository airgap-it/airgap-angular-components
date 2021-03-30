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
