export function createNotInitialized(name: string, details?: string): () => never {
  const error: string = [`${name} not initialized yet.`, details].filter((part: string | undefined) => part !== undefined).join(' ')

  throw new Error(error)
}
