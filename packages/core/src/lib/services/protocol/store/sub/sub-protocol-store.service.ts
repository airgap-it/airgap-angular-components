import { Injectable } from '@angular/core'
import {
  ICoinProtocol,
  ICoinSubProtocol,
  ProtocolNetwork,
  SubProtocolSymbols,
  MainProtocolSymbols,
  isNetworkEqual
} from '@airgap/coinlib-core'
import { erc20Tokens } from '@airgap/ethereum'
import { getMainIdentifier } from '../../../../utils/protocol/protocol-identifier'
import { getProtocolAndNetworkIdentifier, splitProtocolNetworkIdentifier } from '../../../../utils/protocol/protocol-network-identifier'
import { Token } from '../../../../types/Token'
import { BaseProtocolStoreService, BaseProtocolStoreConfig } from '../base-protocol-store.service'
import { getProtocolOptionsByIdentifier } from '../../../../utils/protocol/protocol-options'
import { ModulesController } from '../../../modules/controller/modules.controller'

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

  constructor(private readonly modulesController: ModulesController) {
    super('SubProtocolService')
  }

  private get ethTokenIdentifiers(): Set<string> {
    if (this._ethTokenIdentifers === undefined) {
      this._ethTokenIdentifers = new Set(Object.values(erc20Tokens).map((token: Token) => token.identifier))
    }

    return this._ethTokenIdentifers
  }

  public async removeProtocols(identifiers: SubProtocolSymbols[]): Promise<void> {
    const identifiersSet: Set<string> = new Set(identifiers)
    const mainIdentifiersSet: Set<string> = new Set(identifiers.map(getMainIdentifier))
    const protocolKeys = Object.keys(await this.supportedProtocols)
      .map((key: string): [string, 'fully' | 'partially'] | undefined => {
        const { protocol: protocolIdentifier } = splitProtocolNetworkIdentifier(key)

        return identifiersSet.has(protocolIdentifier)
          ? [key, 'fully']
          : mainIdentifiersSet.has(protocolIdentifier)
          ? [key, 'partially']
          : undefined
      })
      .filter((key) => key !== undefined)

    protocolKeys.forEach(([key, mode]) => {
      if (mode === 'fully') {
        delete this._activeProtocols[key]
        delete this._passiveProtocols[key]
      } else {
        identifiers.forEach((identifier: SubProtocolSymbols) => {
          // eslint-disable-next-line no-unused-expressions
          this._activeProtocols[key] && delete this._activeProtocols[key][identifier]
          // eslint-disable-next-line no-unused-expressions
          this._passiveProtocols[key] && delete this._passiveProtocols[key][identifier]
        })
      }
    })

    // reset supported protocols
    this._supportedProtocols = undefined
  }

  public isIdentifierValid(identifier: string): boolean {
    const mainIdentifier = getMainIdentifier(identifier as SubProtocolSymbols)

    return (
      Object.values(SubProtocolSymbols).includes(identifier as SubProtocolSymbols) ||
      this.ethTokenIdentifiers.has(identifier) ||
      (Object.values(MainProtocolSymbols).includes(mainIdentifier) && identifier !== mainIdentifier) ||
      identifier.includes('-')
    )
  }

  public async getProtocolByIdentifier(
    identifier: SubProtocolSymbols,
    network?: ProtocolNetwork | string,
    activeOnly: boolean = true,
    retry: boolean = true
  ): Promise<ICoinSubProtocol | undefined> {
    try {
      const mainIdentifier: MainProtocolSymbols = getMainIdentifier(identifier)
      const targetNetwork: ProtocolNetwork | string =
        network ?? (await getProtocolOptionsByIdentifier(this.modulesController, mainIdentifier)).network
      const protocolAndNetworkIdentifier: string = await getProtocolAndNetworkIdentifier(mainIdentifier, targetNetwork)

      const subProtocolsMap: SubProtocolsMap = activeOnly ? this.activeProtocols : await this.supportedProtocols
      const found = (subProtocolsMap[protocolAndNetworkIdentifier] ?? {})[identifier]

      if (!found && retry) {
        const mainnetProtocol: ICoinSubProtocol | undefined = await this.getProtocolByIdentifier(identifier, undefined, activeOnly, false)
        if (mainnetProtocol === undefined) {
          const protocols: (ICoinSubProtocol | undefined)[] = Object.values(subProtocolsMap).map((values) => values[identifier])
          const filtered: (ICoinSubProtocol | undefined)[] = await Promise.all(
            protocols.map(async (protocol: ICoinSubProtocol | undefined) => {
              return protocol && (await protocol.getIdentifier()) === identifier ? protocol : undefined
            })
          )

          return filtered.find((protocol: ICoinSubProtocol | undefined) => protocol !== undefined)
        }

        return mainnetProtocol
      }

      return found
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[SubProtocolStore:getProtocolByIdentifer]', error)

      return undefined
    }
  }

  public async getNetworksForProtocol(identifier: SubProtocolSymbols, activeOnly: boolean = true): Promise<ProtocolNetwork[]> {
    const subProtocolsMap: SubProtocolsMap = activeOnly ? this.activeProtocols : await this.supportedProtocols
    const networks: (ProtocolNetwork | undefined)[] = await Promise.all(
      Object.values(subProtocolsMap).map(async (entry) => {
        const protocol = entry[identifier]

        return protocol ? (await protocol.getOptions()).network : undefined
      })
    )

    return networks.filter((network: ProtocolNetwork | undefined) => network !== undefined)
  }

  protected async transformConfig(config: SubProtocolStoreConfig): Promise<BaseProtocolStoreConfig<SubProtocolsMap>> {
    const [passiveProtocols, activeProtocols]: SubProtocolsMap[] = await Promise.all([
      this.createSubProtocolMap(config.passiveSubProtocols),
      this.createSubProtocolMap(config.activeSubProtocols)
    ])

    return { passiveProtocols, activeProtocols }
  }

  protected async mergeProtocols(protocols1: SubProtocolsMap, protocols2: SubProtocolsMap): Promise<SubProtocolsMap> {
    return this.mergeSubProtocolMaps(protocols1, protocols2)
  }

  protected async removeProtocolDuplicates(): Promise<void> {
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

        filtered[protocolAndNetworkIdentifier][subProtocolIdentifier] =
          this.passiveProtocols[protocolAndNetworkIdentifier][subProtocolIdentifier]
      }
    })

    this._passiveProtocols = filtered
  }

  private async createSubProtocolMap(protocols: [ICoinProtocol, ICoinSubProtocol][]): Promise<SubProtocolsMap> {
    const subProtocolMap: SubProtocolsMap = {}

    for (const [protocol, subProtocol] of protocols) {
      const [protocolIdentifier, protocolOptions, subProtocolIdentifier, subProtocolName, subProtocolOptions] = await Promise.all([
        protocol.getIdentifier(),
        protocol.getOptions(),
        subProtocol.getIdentifier(),
        subProtocol.getName(),
        subProtocol.getOptions()
      ])

      if (!subProtocolIdentifier.startsWith(protocolIdentifier)) {
        throw new Error(`Sub protocol ${subProtocolName} is not supported for protocol ${protocolIdentifier}.`)
      }

      if (!isNetworkEqual(protocolOptions.network, subProtocolOptions.network)) {
        throw new Error(`Sub protocol ${subProtocolName} must have the same network as the main protocol.`)
      }

      const protocolAndNetworkIdentifier: string = await getProtocolAndNetworkIdentifier(protocol)

      if (subProtocolMap[protocolAndNetworkIdentifier] === undefined) {
        subProtocolMap[protocolAndNetworkIdentifier] = {}
      }

      subProtocolMap[protocolAndNetworkIdentifier][subProtocolIdentifier as SubProtocolSymbols] = subProtocol
    }

    return subProtocolMap
  }

  private async mergeSubProtocolMaps(
    first: [ICoinProtocol, ICoinSubProtocol][] | SubProtocolsMap,
    second: [ICoinProtocol, ICoinSubProtocol][] | SubProtocolsMap
  ): Promise<SubProtocolsMap> {
    if (Array.isArray(first) && Array.isArray(second)) {
      return this.createSubProtocolMap(first.concat(second))
    }

    const firstMap: SubProtocolsMap = Array.isArray(first) ? await this.createSubProtocolMap(first) : first
    const secondMap: SubProtocolsMap = Array.isArray(second) ? await this.createSubProtocolMap(second) : second

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
