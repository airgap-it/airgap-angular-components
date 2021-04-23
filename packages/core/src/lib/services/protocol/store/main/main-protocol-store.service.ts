import { Injectable } from '@angular/core'
import { ICoinProtocol, ProtocolNetwork, MainProtocolSymbols, getProtocolOptionsByIdentifier, isNetworkEqual } from '@airgap/coinlib-core'
import { getProtocolAndNetworkIdentifier } from '../../../../utils/protocol/protocol-network-identifier'
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

  public getProtocolByIdentifier(
    identifier: MainProtocolSymbols,
    network?: ProtocolNetwork | string,
    activeOnly: boolean = true,
    retry: boolean = true
  ): ICoinProtocol | undefined {
    try {
      const targetNetwork: ProtocolNetwork | string = network ?? getProtocolOptionsByIdentifier(identifier).network
      const found: ICoinProtocol | undefined = (activeOnly ? this.activeProtocols : this.supportedProtocols).find(
        (protocol: ICoinProtocol) =>
          protocol.identifier === identifier &&
          (typeof targetNetwork === 'string'
            ? protocol.options.network.identifier === targetNetwork
            : isNetworkEqual(protocol.options.network, targetNetwork))
      )
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

  public getNetworksForProtocol(identifier: MainProtocolSymbols, activeOnly: boolean = true): ProtocolNetwork[] {
    return (activeOnly ? this.activeProtocols : this.supportedProtocols)
      .filter((protocol: ICoinProtocol) => protocol.identifier === identifier)
      .map((protocol: ICoinProtocol) => protocol.options.network)
  }

  protected transformConfig(config: MainProtocolStoreConfig): BaseProtocolStoreConfig<ICoinProtocol[]> {
    // do nothing, `config` has already the desired interface
    return config
  }

  protected mergeProtocols(protocols1: ICoinProtocol[], protocols2: ICoinProtocol[] | undefined): ICoinProtocol[] {
    return protocols1.concat(protocols2 ?? [])
  }

  protected removeProtocolDuplicates(): void {
    // if a protocol has been set as passive and active, it's considered active
    const presentIdentifiers: Set<string> = new Set()

    // keep the last occurance
    this._activeProtocols = this.filterProtocolsIfIdentifierRegistered(this.activeProtocols.reverse(), presentIdentifiers).reverse()
    this._passiveProtocols = this.filterProtocolsIfIdentifierRegistered(this.passiveProtocols.reverse(), presentIdentifiers).reverse()
  }

  private filterProtocolsIfIdentifierRegistered(protocols: ICoinProtocol[], registry: Set<string>): ICoinProtocol[] {
    return protocols.filter((protocol: ICoinProtocol) => {
      const protocolAndNetworkIdentifier = getProtocolAndNetworkIdentifier(protocol)
      const alreadyPresent: boolean = registry.has(protocolAndNetworkIdentifier)
      if (!alreadyPresent) {
        registry.add(protocolAndNetworkIdentifier)
      }

      return !alreadyPresent
    })
  }
}
