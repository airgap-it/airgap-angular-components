import { Injectable } from '@angular/core'
import { ICoinProtocol, ProtocolNotSupported } from 'airgap-coin-lib'
import { ProtocolNetwork } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { MainProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { getProtocolOptionsByIdentifier } from 'airgap-coin-lib/dist/utils/protocolOptionsByIdentifier'
import { isNetworkEqual } from 'airgap-coin-lib/dist/utils/Network'
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
    activeOnly: boolean = true
  ): ICoinProtocol {
    const targetNetwork: ProtocolNetwork | string = network ?? getProtocolOptionsByIdentifier(identifier).network
    const filtered: ICoinProtocol[] = (activeOnly ? this.activeProtocols : this.supportedProtocols).filter(
      (protocol: ICoinProtocol) =>
        protocol.identifier.startsWith(identifier) &&
        (typeof targetNetwork === 'string'
          ? protocol.options.network.identifier === targetNetwork
          : isNetworkEqual(protocol.options.network, targetNetwork))
    )

    if (filtered.length === 0) {
      throw new ProtocolNotSupported()
    }

    return filtered.sort((a: ICoinProtocol, b: ICoinProtocol) => a.identifier.length - b.identifier.length)[0]
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

    this._activeProtocols = this.filterProtocolsIfIdentifierRegistered(this.activeProtocols, presentIdentifiers)
    this._passiveProtocols = this.filterProtocolsIfIdentifierRegistered(this.passiveProtocols, presentIdentifiers)
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
