import { Injectable } from '@angular/core'
import { ProtocolOptions } from '@airgap/coinlib-core/utils/ProtocolOptions'
import { ICoinProtocol, MainProtocolSymbols, ProtocolNetwork, ProtocolSymbols, isNetworkEqual } from '@airgap/coinlib-core'
import { getProtocolAndNetworkIdentifier } from '../../../../utils/protocol/protocol-network-identifier'
import { getProtocolOptionsByIdentifier } from '../../../../utils/protocol/protocol-options'
import { BaseProtocolStoreService, BaseProtocolStoreConfig } from '../base-protocol-store.service'

export type MainProtocolStoreConfig = BaseProtocolStoreConfig<ICoinProtocol[]>

@Injectable({
  providedIn: 'root'
})
export class MainProtocolStoreService extends BaseProtocolStoreService<
  ICoinProtocol,
  MainProtocolSymbols,
  ICoinProtocol[],
  MainProtocolStoreConfig
> {
  constructor() {
    super('MainProtocolService')
  }

  public isIdentifierValid(identifier: string): boolean {
    return Object.values(MainProtocolSymbols).includes(identifier as MainProtocolSymbols)
  }

  public async getProtocolByIdentifier(
    identifier: MainProtocolSymbols,
    network?: ProtocolNetwork | string,
    activeOnly: boolean = true,
    retry: boolean = true
  ): Promise<ICoinProtocol | undefined> {
    try {
      const targetNetwork: ProtocolNetwork | string = network ?? getProtocolOptionsByIdentifier(identifier).network
      const protocols: ICoinProtocol[] = activeOnly ? this.activeProtocols : await this.supportedProtocols
      const candidates: (ICoinProtocol | undefined)[] = await Promise.all(
        protocols.map(async (protocol: ICoinProtocol) => {
          const protocolIdentifier: ProtocolSymbols = await protocol.getIdentifier()
          const protocolOptions: ProtocolOptions = await protocol.getOptions()

          const identifiersMatch = protocolIdentifier === identifier
          const networksMatch =
            typeof targetNetwork === 'string'
              ? protocolOptions.network.identifier === targetNetwork
              : isNetworkEqual(protocolOptions.network, targetNetwork)

          return identifiersMatch && networksMatch ? protocol : undefined
        })
      )
      const found: ICoinProtocol | undefined = candidates.find((candidate: ICoinProtocol | undefined) => candidate !== undefined)

      if (!found && retry) {
        return this.getProtocolByIdentifier(identifier, undefined, activeOnly, false)
      }

      return found
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[MainProtocolStore:getProtocolByIdentifer]', error)

      return undefined
    }
  }

  public async getNetworksForProtocol(identifier: MainProtocolSymbols, activeOnly: boolean = true): Promise<ProtocolNetwork[]> {
    const protocols: ICoinProtocol[] = activeOnly ? this.activeProtocols : await this.supportedProtocols
    const networks: (ProtocolNetwork | undefined)[] = await Promise.all(
      protocols.map(async (protocol: ICoinProtocol) => {
        return (await protocol.getIdentifier()) === identifier ? (await protocol.getOptions()).network : undefined
      })
    )

    return networks.filter((network: ProtocolNetwork | undefined) => network !== undefined)
  }

  protected async transformConfig(config: MainProtocolStoreConfig): Promise<BaseProtocolStoreConfig<ICoinProtocol[]>> {
    // do nothing, `config` has already the desired interface
    return config
  }

  protected async mergeProtocols(protocols1: ICoinProtocol[], protocols2: ICoinProtocol[] | undefined): Promise<ICoinProtocol[]> {
    return protocols1.concat(protocols2 ?? [])
  }

  protected async removeProtocolDuplicates(): Promise<void> {
    // if a protocol has been set as passive and active, it's considered active
    const presentIdentifiers: Set<string> = new Set()

    // keep the last occurance
    const activeProtocolsReversed = await this.filterProtocolsIfIdentifierRegistered(this.activeProtocols.reverse(), presentIdentifiers)
    this._activeProtocols = activeProtocolsReversed.reverse()

    const passiveProtocolsReversed = await this.filterProtocolsIfIdentifierRegistered(this.passiveProtocols.reverse(), presentIdentifiers)
    this._passiveProtocols = passiveProtocolsReversed.reverse()
  }

  private async filterProtocolsIfIdentifierRegistered(protocols: ICoinProtocol[], registry: Set<string>): Promise<ICoinProtocol[]> {
    const filtered: (ICoinProtocol | undefined)[] = await Promise.all(
      protocols.map(async (protocol: ICoinProtocol) => {
        const protocolAndNetworkIdentifier = await getProtocolAndNetworkIdentifier(protocol)
        const alreadyPresent: boolean = registry.has(protocolAndNetworkIdentifier)
        if (!alreadyPresent) {
          registry.add(protocolAndNetworkIdentifier)
        }

        return !alreadyPresent ? protocol : undefined
      })
    )

    return filtered.filter((protocol: ICoinProtocol | undefined) => protocol !== undefined)
  }
}
