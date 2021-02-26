export function removeDuplicates<T>(array: T[]): T[] {
  return array.filter((item: T, index: number, arr: T[]) => arr.indexOf(item) === index)
}
