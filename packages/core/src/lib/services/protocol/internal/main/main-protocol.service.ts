import { Injectable } from '@angular/core'
import {
  ICoinProtocol,
  ProtocolNotSupported,
  AeternityProtocol,
  BitcoinProtocol,
  EthereumProtocol,
  GroestlcoinProtocol,
  TezosProtocol,
  CosmosProtocol,
  PolkadotProtocol,
  KusamaProtocol
} from 'airgap-coin-lib'
import { ProtocolNetwork } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { MainProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { getProtocolOptionsByIdentifier } from 'airgap-coin-lib/dist/utils/protocolOptionsByIdentifier'
import { isNetworkEqual } from 'airgap-coin-lib/dist/utils/Network'
import { getProtocolAndNetworkIdentifier } from '../../../../utils/protocol/protocol-network-identifier'
import { BaseProtocolService, BaseProtocolServiceConfig } from '../base-protocol.service'

export type MainProtocolServiceConfig = BaseProtocolServiceConfig<ICoinProtocol[]>

@Injectable({
  providedIn: 'root'
})
export class MainProtocolService extends BaseProtocolService<ICoinProtocol[], MainProtocolServiceConfig> {
  constructor() {
    super('MainProtocolService')
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

  protected transformConfig(config: MainProtocolServiceConfig): BaseProtocolServiceConfig<ICoinProtocol[]> {
    // do nothing, `config` has already the desired interface
    return config
  }

  protected mergeProtocols(protocols1: ICoinProtocol[], protocols2: ICoinProtocol[] | undefined): ICoinProtocol[] {
    return protocols1.concat(protocols2 ?? [])
  }

  protected getDefaultPassiveProtocols(): ICoinProtocol[] {
    return []
  }

  protected getDefaultActiveProtocols(): ICoinProtocol[] {
    return [
      new AeternityProtocol(),
      new BitcoinProtocol(),
      new EthereumProtocol(),
      new GroestlcoinProtocol(),
      new TezosProtocol(),
      new CosmosProtocol(),
      new PolkadotProtocol(),
      new KusamaProtocol()
    ]
  }

  protected removeProtocolDuplicates(): void {
    // if a protocol has been set as passive and active, it's considered active
    const activeIdentifiers: Set<string> = new Set(this.activeProtocols.map(getProtocolAndNetworkIdentifier))
    this._passiveProtocols = this.passiveProtocols.filter(
      (protocol: ICoinProtocol) => !activeIdentifiers.has(getProtocolAndNetworkIdentifier(protocol))
    )
  }
}
