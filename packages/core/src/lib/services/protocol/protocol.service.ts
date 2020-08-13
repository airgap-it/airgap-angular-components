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
  KusamaProtocol,
  ICoinSubProtocol,
  TezosKtProtocol,
  TezosBTC,
  GenericERC20
} from 'airgap-coin-lib'
import { ProtocolNetwork } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { ProtocolSymbols, SubProtocolSymbols, MainProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { getProtocolOptionsByIdentifier } from 'airgap-coin-lib/dist/utils/protocolOptionsByIdentifier'
import { isNetworkEqual } from 'airgap-coin-lib/dist/utils/Network'
import {
  EthereumERC20ProtocolOptions,
  EthereumProtocolNetwork,
  EthereumERC20ProtocolConfig
} from 'airgap-coin-lib/dist/protocols/ethereum/EthereumProtocolOptions'
import { getMainIdentifier } from '../../utils/protocol/protocol-identifier'
import { getProtocolAndNetworkIdentifier } from '../../utils/protocol/protocol-network-identifier'
import { createNotInitialized } from '../../utils/not-initialized'
import { Token } from '../../types/Token'
import { ethTokens } from './tokens'

export const activeEthTokens: Set<string> = new Set([
  'eth-erc20-xchf'
])

export interface SubProtocolsMap {
  [key: string]: {
    [subProtocolIdentifier in SubProtocolSymbols]?: ICoinSubProtocol
  }
}

export interface ProtocolServiceConfig {
  passiveProtocols?: ICoinProtocol[]
  activeProtocols?: ICoinProtocol[]

  passiveSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]
  activeSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]

  extraPassiveProtocols?: ICoinProtocol[]
  extraActiveProtocols?: ICoinProtocol[]

  extraPassiveSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]
  extraActiveSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]
}

const notInitialized = createNotInitialized('ProtocolService', 'Call `init` first.')

@Injectable({
  providedIn: 'root'
})
export class ProtocolService {
  private _supportedProtocols: ICoinProtocol[] | undefined
  private _supportedSubProtocols: SubProtocolsMap | undefined

  private _passiveProtocols: ICoinProtocol[] | undefined
  private _activeProtocols: ICoinProtocol[] | undefined

  private _passiveSubProtocols: SubProtocolsMap | undefined
  private _activeSubProtocols: SubProtocolsMap | undefined

  public get isInitialized(): boolean {
    return (
      this._passiveProtocols !== undefined &&
      this._activeProtocols !== undefined &&
      this._passiveSubProtocols !== undefined &&
      this._activeSubProtocols !== undefined
    )
  }

  public get supportedProtocols(): ICoinProtocol[] {
    if (this._supportedProtocols === undefined) {
      const passiveProtocols: ICoinProtocol[] = this._passiveProtocols ?? notInitialized()
      const activeProtocols: ICoinProtocol[] = this._activeProtocols ?? notInitialized()

      this._supportedProtocols = passiveProtocols.concat(activeProtocols)
    }

    return this._supportedProtocols
  }

  public get passiveProtocols(): ICoinProtocol[] {
    return this._passiveProtocols ?? notInitialized()
  }

  public get activeProtocols(): ICoinProtocol[] {
    return this._activeProtocols ?? notInitialized()
  }

  public get supportedSubProtocols(): SubProtocolsMap {
    if (this._supportedSubProtocols === undefined) {
      const passiveSubProtocols: SubProtocolsMap = this._passiveSubProtocols ?? notInitialized()
      const activeSubProtocols: SubProtocolsMap = this._activeSubProtocols ?? notInitialized()

      this._supportedSubProtocols = this.mergeSubProtocolMaps(passiveSubProtocols, activeSubProtocols)
    }

    return this._supportedSubProtocols
  }

  public get passiveSubProtocols(): SubProtocolsMap {
    return this._passiveSubProtocols ?? notInitialized()
  }

  public get activeSubProtocols(): SubProtocolsMap {
    return this._activeSubProtocols ?? notInitialized()
  }

  public init(config?: ProtocolServiceConfig): void {
    if (this.isInitialized) {
      // eslint-disable-next-line no-console
      console.log('[ProtocolService] already initialized')

      return
    }

    this._passiveProtocols = config?.passiveProtocols ?? this.getDefaultPassiveProtocols()
    this._activeProtocols = config?.activeProtocols ?? this.getDefaultActiveProtocols()

    this._passiveSubProtocols = this.createSubProtocolMap(config?.passiveSubProtocols ?? this.getDefaultPassiveSubProtocols())
    this._activeSubProtocols = this.createSubProtocolMap(config?.activeSubProtocols ?? this.getDefaultActiveSubProtocols())

    if (config?.extraPassiveProtocols !== undefined) {
      this._passiveProtocols.push(...config.extraPassiveProtocols)
    }

    if (config?.extraActiveProtocols !== undefined) {
      this._activeProtocols.push(...config.extraActiveProtocols)
    }

    if (config?.extraPassiveSubProtocols !== undefined) {
      this._passiveSubProtocols = this.mergeSubProtocolMaps(this.passiveSubProtocols, config.extraPassiveSubProtocols)
    }

    if (config?.extraActiveSubProtocols !== undefined) {
      this._activeSubProtocols = this.mergeSubProtocolMaps(this.activeSubProtocols, config.extraActiveSubProtocols)
    }

    this.removeProtocolDuplicates()
    this.removeSubProtocolDuplicates()
  }

  public getProtocol(
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    network?: ProtocolNetwork,
    activeOnly: boolean = true
  ): ICoinProtocol | undefined {
    try {
      return typeof protocolOrIdentifier === 'string'
        ? this.getProtocolByIdentifier(protocolOrIdentifier, network, activeOnly)
        : protocolOrIdentifier
    } catch (error) {
      return undefined
    }
  }

  public getProtocolByIdentifier(identifier: ProtocolSymbols, network?: ProtocolNetwork, activeOnly: boolean = true): ICoinProtocol {
    const targetNetwork: ProtocolNetwork = network ?? getProtocolOptionsByIdentifier(identifier, network).network
    const filtered: ICoinProtocol[] = (activeOnly ? this.activeProtocols : this.supportedProtocols)
      .map((protocol: ICoinProtocol) => [protocol, ...(protocol.subProtocols ?? [])])
      .reduce((flatten: ICoinProtocol[], toFlatten: ICoinProtocol[]) => flatten.concat(toFlatten), [])
      .filter(
        (protocol: ICoinProtocol) => protocol.identifier.startsWith(identifier) && isNetworkEqual(protocol.options.network, targetNetwork)
      )

    if (filtered.length === 0) {
      throw new ProtocolNotSupported()
    }

    return filtered.sort((a: ICoinProtocol, b: ICoinProtocol) => a.identifier.length - b.identifier.length)[0]
  }

  public getSubProtocolsByIdentifier(
    identifier: ProtocolSymbols,
    network?: ProtocolNetwork,
    activeOnly: boolean = true
  ): ICoinSubProtocol[] {
    const targetNetwork: ProtocolNetwork = network ?? getProtocolOptionsByIdentifier(identifier, network).network
    const mainIdentifier: MainProtocolSymbols = getMainIdentifier(identifier)
    const protocolAndNetworkIdentifier: string = getProtocolAndNetworkIdentifier(mainIdentifier, targetNetwork)

    const subProtocolMap: SubProtocolsMap = activeOnly
      ? this.activeSubProtocols
      : this.supportedSubProtocols

    return Object.values(subProtocolMap[protocolAndNetworkIdentifier] ?? {}).filter(
      (subProtocol: ICoinSubProtocol | undefined) => subProtocol !== undefined
    ) as ICoinSubProtocol[]
  }

  public isAddressOfProtocol(protocolSymbol: ProtocolSymbols, address: string): boolean {
    try {
      const protocol: ICoinProtocol = this.getProtocolByIdentifier(protocolSymbol)

      return address.match(protocol.addressValidationPattern) !== null
    } catch {
      return false
    }
  }

  private getDefaultPassiveProtocols(): ICoinProtocol[] {
    return []
  }

  private getDefaultActiveProtocols(): ICoinProtocol[] {
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

  private getDefaultPassiveSubProtocols(): [ICoinProtocol, ICoinSubProtocol][] {
    const ethereumProtocol = new EthereumProtocol()

    return [
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
  }

  private getDefaultActiveSubProtocols(): [ICoinProtocol, ICoinSubProtocol][] {
    const ethereumProtocol = new EthereumProtocol()

    return [
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

  private removeProtocolDuplicates(): void {
    // if a protocol has been set as passive and active, it's considered active
    const activeIdentifiers: Set<string> = new Set(this.activeProtocols.map(getProtocolAndNetworkIdentifier))
    this._passiveProtocols = this.passiveProtocols.filter(
      (protocol: ICoinProtocol) => !activeIdentifiers.has(getProtocolAndNetworkIdentifier(protocol))
    )
  }

  private removeSubProtocolDuplicates(): void {
    // if a sub protocol has been set as passive and active, it's considered active
    const passiveEntries: [string, SubProtocolSymbols][] = Object.entries(this.passiveSubProtocols)
      .map(([protocolAndNetworkIdentifier, subProtocols]: [string, { [subProtocolIdentifier in SubProtocolSymbols]?: ICoinSubProtocol }]) =>
        Object.keys(subProtocols).map((subProtocol: string) => [protocolAndNetworkIdentifier, subProtocol] as [string, SubProtocolSymbols])
      )
      .reduce((flatten: [string, SubProtocolSymbols][], toFlatten: [string, SubProtocolSymbols][]) => flatten.concat(toFlatten), [])

    const filtered: SubProtocolsMap = {}

    passiveEntries.forEach(([protocolAndNetworkIdentifier, subProtocolIdentifier]: [string, SubProtocolSymbols]) => {
      if (
        this.activeSubProtocols[protocolAndNetworkIdentifier] === undefined ||
        this.activeSubProtocols[protocolAndNetworkIdentifier][subProtocolIdentifier] === undefined
      ) {
        if (filtered[protocolAndNetworkIdentifier] === undefined) {
          filtered[protocolAndNetworkIdentifier] = {}
        }

        filtered[protocolAndNetworkIdentifier][subProtocolIdentifier] = this.passiveSubProtocols[protocolAndNetworkIdentifier][
          subProtocolIdentifier
        ]
      }
    })

    this._passiveSubProtocols = filtered
  }
}
