import { Injectable } from '@angular/core'
import {
  ICoinProtocol,
  ProtocolNotSupported,
  EthereumProtocol,
  TezosProtocol,
  ICoinSubProtocol,
  TezosKtProtocol,
  TezosBTC,
  GenericERC20
} from 'airgap-coin-lib'
import { ProtocolNetwork } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { SubProtocolSymbols, MainProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { getProtocolOptionsByIdentifier } from 'airgap-coin-lib/dist/utils/protocolOptionsByIdentifier'
import { isNetworkEqual } from 'airgap-coin-lib/dist/utils/Network'
import {
  EthereumERC20ProtocolOptions,
  EthereumProtocolNetwork,
  EthereumERC20ProtocolConfig
} from 'airgap-coin-lib/dist/protocols/ethereum/EthereumProtocolOptions'
import { getMainIdentifier } from '../../../utils/protocol/protocol-identifier'
import { getProtocolAndNetworkIdentifier } from '../../../utils/protocol/protocol-network-identifier'
import { Token } from '../../../types/Token'
import { ethTokens } from '../tokens'
import { BaseProtocolService, BaseProtocolServiceConfig } from './base-protocol.service'

export const activeEthTokens: Set<string> = new Set(['eth-erc20-xchf'])

export interface SubProtocolsMap {
  [key: string]: {
    [subProtocolIdentifier in SubProtocolSymbols]?: ICoinSubProtocol
  }
}

export interface SubProtocolServiceConfig {
  passiveSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]
  activeSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]

  extraPassiveSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]
  extraActiveSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]
}

@Injectable({
  providedIn: 'root'
})
export class SubProtocolService extends BaseProtocolService<SubProtocolsMap, SubProtocolServiceConfig> {
  constructor() {
    super('SubProtocolService')
  }

  public getSubProtocolByIdentifier(
    identifier: SubProtocolSymbols,
    network?: ProtocolNetwork,
    activeOnly: boolean = true
  ): ICoinSubProtocol {
    const mainIdentifier: MainProtocolSymbols = getMainIdentifier(identifier)
    const targetNetwork: ProtocolNetwork = network ?? getProtocolOptionsByIdentifier(mainIdentifier, network).network
    const protocolAndNetworkIdentifier: string = getProtocolAndNetworkIdentifier(mainIdentifier, targetNetwork)

    const subProtocolMap: SubProtocolsMap = activeOnly ? this.activeProtocols : this.supportedProtocols

    const subProtocol = (subProtocolMap[protocolAndNetworkIdentifier] ?? {})[identifier]

    if (subProtocol === undefined) {
      throw new ProtocolNotSupported()
    }

    return subProtocol
  }

  public getSubProtocolsByMainIdentifier(
    mainIdentifier: MainProtocolSymbols,
    network?: ProtocolNetwork,
    activeOnly: boolean = true
  ): ICoinSubProtocol[] {
    const targetNetwork: ProtocolNetwork = network ?? getProtocolOptionsByIdentifier(mainIdentifier, network).network
    const protocolAndNetworkIdentifier: string = getProtocolAndNetworkIdentifier(mainIdentifier, targetNetwork)

    const subProtocolMap: SubProtocolsMap = activeOnly ? this.activeProtocols : this.supportedProtocols

    return Object.values(subProtocolMap[protocolAndNetworkIdentifier] ?? {}).filter(
      (subProtocol: ICoinSubProtocol | undefined) => subProtocol !== undefined
    ) as ICoinSubProtocol[]
  }

  protected transformConfig(config: SubProtocolServiceConfig): BaseProtocolServiceConfig<SubProtocolsMap> {
    return {
      passiveProtocols: config.passiveSubProtocols !== undefined ? this.createSubProtocolMap(config.passiveSubProtocols) : undefined,
      activeProtocols: config.activeSubProtocols !== undefined ? this.createSubProtocolMap(config.activeSubProtocols) : undefined,
      extraPassiveProtocols:
        config.extraPassiveSubProtocols !== undefined ? this.createSubProtocolMap(config.extraPassiveSubProtocols) : undefined,
      extraActiveProtocols:
        config.extraActiveSubProtocols !== undefined ? this.createSubProtocolMap(config.extraActiveSubProtocols) : undefined
    }
  }

  protected mergeProtocols(protocols1: SubProtocolsMap, protocols2: SubProtocolsMap): SubProtocolsMap {
    return this.mergeSubProtocolMaps(protocols1, protocols2)
  }

  protected getDefaultPassiveProtocols(): SubProtocolsMap {
    const ethereumProtocol = new EthereumProtocol()

    const defaultPassiveProtocols: [ICoinProtocol, ICoinSubProtocol][] = [
      [new TezosProtocol(), new TezosKtProtocol()],
      ...ethTokens
        .filter((token: Token, index: number, array: Token[]) => !activeEthTokens.has(token.identifier) && array.indexOf(token) === index)
        .map(
          (token: Token) =>
            [
              ethereumProtocol,
              new GenericERC20(
                new EthereumERC20ProtocolOptions(
                  new EthereumProtocolNetwork(),
                  new EthereumERC20ProtocolConfig(
                    token.symbol,
                    token.name,
                    token.marketSymbol,
                    token.identifier as SubProtocolSymbols,
                    token.contractAddress,
                    token.decimals
                  )
                )
              )
            ] as [EthereumProtocol, GenericERC20]
        )
    ]

    return this.createSubProtocolMap(defaultPassiveProtocols)
  }

  protected getDefaultActiveProtocols(): SubProtocolsMap {
    const ethereumProtocol = new EthereumProtocol()

    const defaultActiveProtocols: [ICoinProtocol, ICoinSubProtocol][] = [
      [new TezosProtocol(), new TezosBTC()],
      ...ethTokens
        .filter((token: Token, index: number, array: Token[]) => activeEthTokens.has(token.identifier) && array.indexOf(token) === index)
        .map(
          (token: Token) =>
            [
              ethereumProtocol,
              new GenericERC20(
                new EthereumERC20ProtocolOptions(
                  new EthereumProtocolNetwork(),
                  new EthereumERC20ProtocolConfig(
                    token.symbol,
                    token.name,
                    token.marketSymbol,
                    token.identifier as SubProtocolSymbols,
                    token.contractAddress,
                    token.decimals
                  )
                )
              )
            ] as [EthereumProtocol, GenericERC20]
        )
    ]

    return this.createSubProtocolMap(defaultActiveProtocols)
  }

  protected removeProtocolDuplicates(): void {
    // if a sub protocol has been set as passive and active, it's considered active
    const passiveEntries: [string, SubProtocolSymbols][] = Object.entries(this.passiveProtocols)
      .map(([protocolAndNetworkIdentifier, subProtocols]: [string, { [subProtocolIdentifier in SubProtocolSymbols]?: ICoinSubProtocol }]) =>
        Object.keys(subProtocols).map((subProtocol: string) => [protocolAndNetworkIdentifier, subProtocol] as [string, SubProtocolSymbols])
      )
      .reduce((flatten: [string, SubProtocolSymbols][], toFlatten: [string, SubProtocolSymbols][]) => flatten.concat(toFlatten), [])

    const filtered: SubProtocolsMap = {}

    passiveEntries.forEach(([protocolAndNetworkIdentifier, subProtocolIdentifier]: [string, SubProtocolSymbols]) => {
      if (
        this.activeProtocols[protocolAndNetworkIdentifier] === undefined ||
        this.activeProtocols[protocolAndNetworkIdentifier][subProtocolIdentifier] === undefined
      ) {
        if (filtered[protocolAndNetworkIdentifier] === undefined) {
          filtered[protocolAndNetworkIdentifier] = {}
        }

        filtered[protocolAndNetworkIdentifier][subProtocolIdentifier] = this.passiveProtocols[protocolAndNetworkIdentifier][
          subProtocolIdentifier
        ]
      }
    })

    this._passiveProtocols = filtered
  }

  private createSubProtocolMap(protocols: [ICoinProtocol, ICoinSubProtocol][]): SubProtocolsMap {
    const subProtocolMap: SubProtocolsMap = {}

    protocols.forEach(([protocol, subProtocol]: [ICoinProtocol, ICoinSubProtocol]) => {
      if (!subProtocol.identifier.startsWith(protocol.identifier)) {
        throw new Error(`Sub protocol ${subProtocol.name} is not supported for protocol ${protocol.identifier}.`)
      }

      if (!isNetworkEqual(protocol.options.network, subProtocol.options.network)) {
        throw new Error(`Sub protocol ${subProtocol.name} must have the same network as the main protocol.`)
      }

      const protocolAndNetworkIdentifier: string = getProtocolAndNetworkIdentifier(protocol)

      if (subProtocolMap[protocolAndNetworkIdentifier] === undefined) {
        subProtocolMap[protocolAndNetworkIdentifier] = {}
      }

      subProtocolMap[protocolAndNetworkIdentifier][subProtocol.identifier as SubProtocolSymbols] = subProtocol
    })

    return subProtocolMap
  }

  private mergeSubProtocolMaps(
    first: [ICoinProtocol, ICoinSubProtocol][] | SubProtocolsMap,
    second: [ICoinProtocol, ICoinSubProtocol][] | SubProtocolsMap
  ): SubProtocolsMap {
    if (Array.isArray(first) && Array.isArray(second)) {
      return this.createSubProtocolMap(first.concat(second))
    }

    const firstMap: SubProtocolsMap = Array.isArray(first) ? this.createSubProtocolMap(first) : first
    const secondMap: SubProtocolsMap = Array.isArray(second) ? this.createSubProtocolMap(second) : second

    const mergedMap: SubProtocolsMap = {}

    Object.entries(firstMap)
      .concat(Object.entries(secondMap))
      .forEach(
        ([protocolAndNetworkIdentifier, subProtocols]: [string, { [subProtocolIdentifier in SubProtocolSymbols]?: ICoinSubProtocol }]) => {
          if (mergedMap[protocolAndNetworkIdentifier] === undefined) {
            mergedMap[protocolAndNetworkIdentifier] = subProtocols
          } else {
            mergedMap[protocolAndNetworkIdentifier] = {
              ...mergedMap[protocolAndNetworkIdentifier],
              ...subProtocols
            }
          }
        }
      )

    return mergedMap
  }
}
