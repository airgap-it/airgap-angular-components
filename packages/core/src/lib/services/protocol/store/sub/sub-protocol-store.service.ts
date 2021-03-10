import { Injectable } from '@angular/core'
import {
  ICoinProtocol,
  ICoinSubProtocol,
  ProtocolNetwork,
  SubProtocolSymbols,
  MainProtocolSymbols,
  getProtocolOptionsByIdentifier,
  isNetworkEqual
} from '@airgap/coinlib-core'
import { getMainIdentifier } from '../../../../utils/protocol/protocol-identifier'
import { getProtocolAndNetworkIdentifier } from '../../../../utils/protocol/protocol-network-identifier'
import { Token } from '../../../../types/Token'
import { ethTokens } from '../../tokens'
import { BaseProtocolStoreService, BaseProtocolStoreConfig } from '../base-protocol-store.service'

export interface SubProtocolsMap {
  [key: string]: {
    [subProtocolIdentifier in SubProtocolSymbols]?: ICoinSubProtocol
  }
}

export interface SubProtocolStoreConfig {
  passiveSubProtocols: [ICoinProtocol, ICoinSubProtocol][]
  activeSubProtocols: [ICoinProtocol, ICoinSubProtocol][]
}

@Injectable({
  providedIn: 'root'
})
export class SubProtocolStoreService extends BaseProtocolStoreService<
  ICoinSubProtocol,
  SubProtocolSymbols,
  SubProtocolsMap,
  SubProtocolStoreConfig
> {
  private _ethTokenIdentifers: Set<string> | undefined

  constructor() {
    super('SubProtocolService')
  }

  private get ethTokenIdentifiers(): Set<string> {
    if (this._ethTokenIdentifers === undefined) {
      this._ethTokenIdentifers = new Set(ethTokens.map((token: Token) => token.identifier))
    }

    return this._ethTokenIdentifers
  }

  public isIdentifierValid(identifier: string): boolean {
    return Object.values(SubProtocolSymbols).includes(identifier as SubProtocolSymbols) || this.ethTokenIdentifiers.has(identifier)
  }

  public getProtocolByIdentifier(
    identifier: SubProtocolSymbols,
    network?: ProtocolNetwork | string,
    activeOnly: boolean = true
  ): ICoinSubProtocol | undefined {
    try {
      const mainIdentifier: MainProtocolSymbols = getMainIdentifier(identifier)
      const targetNetwork: ProtocolNetwork | string = network ?? getProtocolOptionsByIdentifier(mainIdentifier).network
      const protocolAndNetworkIdentifier: string = getProtocolAndNetworkIdentifier(mainIdentifier, targetNetwork)

      const subProtocolsMap: SubProtocolsMap = activeOnly ? this.activeProtocols : this.supportedProtocols

      return (subProtocolsMap[protocolAndNetworkIdentifier] ?? {})[identifier]
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[SubProtocolStore:getProtocolByIdentifer]', error)

      return undefined
    }
  }

  public getNetworksForProtocol(identifier: SubProtocolSymbols, activeOnly: boolean = true): ProtocolNetwork[] {
    const subProtocolsMap: SubProtocolsMap = activeOnly ? this.activeProtocols : this.supportedProtocols

    return Object.values(subProtocolsMap)
      .map((entry) => entry[identifier]?.options.network)
      .filter((network: ProtocolNetwork | undefined) => network !== undefined) as ProtocolNetwork[]
  }

  protected transformConfig(config: SubProtocolStoreConfig): BaseProtocolStoreConfig<SubProtocolsMap> {
    return {
      passiveProtocols: this.createSubProtocolMap(config.passiveSubProtocols),
      activeProtocols: this.createSubProtocolMap(config.activeSubProtocols)
    }
  }

  protected mergeProtocols(protocols1: SubProtocolsMap, protocols2: SubProtocolsMap): SubProtocolsMap {
    return this.mergeSubProtocolMaps(protocols1, protocols2)
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
