export interface ExternalAliasResolver {
  validateReceiver(receiver: string): Promise<boolean>
  resolveAlias(alias: string): Promise<string | undefined>
  getAlias(address: string): Promise<string | undefined>
}
