import { Injectable } from '@angular/core'
import {
  ICoinProtocol,
  ICoinSubProtocol,
  ProtocolNetwork,
  ProtocolSymbols,
  SubProtocolSymbols,
  MainProtocolSymbols,
  getProtocolOptionsByIdentifier
} from '@airgap/coinlib-core'
import { getProtocolAndNetworkIdentifier } from '../../utils/protocol/protocol-network-identifier'
import { ExposedPromise } from '../../utils/ExposedPromise'
import { getMainIdentifier } from '../../utils/protocol/protocol-identifier'
import { Token } from '../../types/Token'
import { MainProtocolStoreConfig, MainProtocolStoreService } from './store/main/main-protocol-store.service'
import { SubProtocolStoreConfig, SubProtocolStoreService, SubProtocolsMap } from './store/sub/sub-protocol-store.service'
import {
  getDefaultPassiveProtocols,
  getDefaultActiveProtocols,
  getDefaultPassiveSubProtocols,
  getDefaultActiveSubProtocols
} from './defaults'
import { ethTokens } from './tokens'

export interface ProtocolServiceConfig extends Partial<MainProtocolStoreConfig & SubProtocolStoreConfig> {
  extraPassiveProtocols?: ICoinProtocol[]
  extraActiveProtocols?: ICoinProtocol[]

  extraPassiveSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]
  extraActiveSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]
}

@Injectable({
  providedIn: 'root'
})
export class ProtocolService {
  private readonly isReady: ExposedPromise<void> = new ExposedPromise()
  private knownProtocolSymbols: Set<string> | undefined

  constructor(private readonly mainProtocolStore: MainProtocolStoreService, private readonly subProtocolStore: SubProtocolStoreService) {}

  private get isInitialized(): boolean {
    return this.mainProtocolStore.isInitialized && this.subProtocolStore.isInitialized
  }

  public async getSupportedProtocols(): Promise<ICoinProtocol[]> {
    await this.waitReady()

    return this.mainProtocolStore.supportedProtocols
  }

  public async getPassiveProtocols(): Promise<ICoinProtocol[]> {
    await this.waitReady()

    return this.mainProtocolStore.passiveProtocols
  }

  public async getActiveProtocols(): Promise<ICoinProtocol[]> {
    await this.waitReady()

    return this.mainProtocolStore.activeProtocols
  }

  public async getSupportedSubProtocols(): Promise<SubProtocolsMap> {
    await this.waitReady()

    return this.subProtocolStore.supportedProtocols
  }

  public async getPassiveSubProtocols(): Promise<SubProtocolsMap> {
    await this.waitReady()

    return this.subProtocolStore.passiveProtocols
  }

  public async getActiveSubProtocols(): Promise<SubProtocolsMap> {
    await this.waitReady()

    return this.subProtocolStore.activeProtocols
  }

  public init(config?: ProtocolServiceConfig): void {
    if (this.isInitialized) {
      // eslint-disable-next-line no-console
      console.log('[ProtocolService] already initialized')

      return
    }

    this.mainProtocolStore.init({
      passiveProtocols: (config?.passiveProtocols ?? getDefaultPassiveProtocols()).concat(config?.extraPassiveProtocols ?? []),
      activeProtocols: (config?.activeProtocols ?? getDefaultActiveProtocols()).concat(config?.extraActiveProtocols ?? [])
    })

    this.subProtocolStore.init({
      passiveSubProtocols: (config?.passiveSubProtocols ?? getDefaultPassiveSubProtocols()).concat(config?.extraPassiveSubProtocols ?? []),
      activeSubProtocols: (config?.activeSubProtocols ?? getDefaultActiveSubProtocols()).concat(config?.extraActiveSubProtocols ?? [])
    })

    this.isReady.resolve()
  }

  public async waitReady(): Promise<void> {
    return this.isReady.promise
  }

  public async isProtocolActive(protocol: ICoinProtocol): Promise<boolean>
  public async isProtocolActive(identifier: ProtocolSymbols, network?: ProtocolNetwork): Promise<boolean>
  public async isProtocolActive(protocolOrIdentifier: ICoinProtocol | ProtocolSymbols, network?: ProtocolNetwork): Promise<boolean> {
    await this.waitReady()

    return this.isProtocolRegistered(protocolOrIdentifier, network, true)
  }

  public async isProtocolSupported(protocol: ICoinProtocol): Promise<boolean>
  public async isProtocolSupported(identifier: ProtocolSymbols, network?: ProtocolNetwork): Promise<boolean>
  public async isProtocolSupported(protocolOrIdentifier: ICoinProtocol | ProtocolSymbols, network?: ProtocolNetwork): Promise<boolean> {
    await this.waitReady()

    return this.isProtocolRegistered(protocolOrIdentifier, network, false)
  }

  public async getProtocol(
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    network?: ProtocolNetwork | string,
    activeOnly: boolean = true
  ): Promise<ICoinProtocol> {
    await this.waitReady()

    if (typeof protocolOrIdentifier === 'string') {
      let protocol: ICoinProtocol | undefined

      if (this.mainProtocolStore.isIdentifierValid(protocolOrIdentifier)) {
        protocol = this.mainProtocolStore.getProtocolByIdentifier(protocolOrIdentifier as MainProtocolSymbols, network, activeOnly)
      } else if (this.subProtocolStore.isIdentifierValid(protocolOrIdentifier)) {
        protocol = this.subProtocolStore.getProtocolByIdentifier(protocolOrIdentifier as SubProtocolSymbols, network, activeOnly)
        if (protocol === undefined) {
          const mainProtocolIdentifier = getMainIdentifier(protocolOrIdentifier)

          return this.getProtocol(mainProtocolIdentifier, network, activeOnly)
        }
      }

      if (protocol === undefined) {
        throw new Error(`Protocol ${protocolOrIdentifier} not supported`)
      }

      return protocol
    } else {
      return protocolOrIdentifier
    }
  }

  public async addActiveProtocols(protocolOrProtocols: ICoinProtocol | ICoinProtocol[]): Promise<void> {
    const protocols: ICoinProtocol[] = Array.isArray(protocolOrProtocols) ? protocolOrProtocols : [protocolOrProtocols]

    const mainProtocols: ICoinProtocol[] = protocols.filter((protocol: ICoinProtocol) =>
      this.mainProtocolStore.isIdentifierValid(protocol.identifier)
    )
    const subProtocols: ICoinProtocol[] = protocols.filter((protocol: ICoinProtocol) =>
      this.subProtocolStore.isIdentifierValid(protocol.identifier)
    )

    await Promise.all([this.addActiveMainProtocols(mainProtocols), this.addActiveSubProtocols(subProtocols)])
  }

  public async addActiveMainProtocols(protocolOrProtocols: ICoinProtocol | ICoinProtocol[]): Promise<void> {
    await this.waitReady()

    const protocols: ICoinProtocol[] = Array.isArray(protocolOrProtocols) ? protocolOrProtocols : [protocolOrProtocols]
    const validProtocols: ICoinProtocol[] = protocols.filter((protocol: ICoinProtocol) =>
      this.mainProtocolStore.isIdentifierValid(protocol.identifier)
    )

    this.mainProtocolStore.addActiveProtocols(validProtocols)
  }

  public async addActiveSubProtocols(protocolOrProtocols: ICoinProtocol | ICoinProtocol[]): Promise<void> {
    await this.waitReady()

    const protocols: ICoinProtocol[] = Array.isArray(protocolOrProtocols) ? protocolOrProtocols : [protocolOrProtocols]
    const validProtocols: ICoinProtocol[] = protocols.filter((protocol: ICoinProtocol) =>
      this.subProtocolStore.isIdentifierValid(protocol.identifier)
    )

    this.subProtocolStore.addActiveProtocols(
      validProtocols
        .map((protocol: ICoinProtocol) => {
          const mainIdentifier: MainProtocolSymbols = getMainIdentifier(protocol.identifier)
          const protocolAndNetworkIdentifier: string = getProtocolAndNetworkIdentifier(mainIdentifier, protocol.options.network)

          return [protocolAndNetworkIdentifier, protocol] as [string, ICoinProtocol]
        })
        .reduce(
          (obj: SubProtocolsMap, [protocolAndNetworkIdentifier, protocol]: [string, ICoinProtocol]) =>
            Object.assign(obj, {
              [protocolAndNetworkIdentifier]: Object.assign(obj[protocolAndNetworkIdentifier] ?? {}, { [protocol.identifier]: protocol })
            }),
          {}
        )
    )
  }

  public async isProtocolAvailable(protocolIdentifier: ProtocolSymbols, networkIdentifier: string): Promise<boolean> {
    await this.waitReady()

    const protocol: ICoinProtocol | undefined = this.mainProtocolStore.isIdentifierValid(protocolIdentifier)
      ? this.mainProtocolStore.getProtocolByIdentifier(protocolIdentifier as MainProtocolSymbols, networkIdentifier, true, false)
      : this.subProtocolStore.getProtocolByIdentifier(protocolIdentifier as SubProtocolSymbols, networkIdentifier, true, false)

    return protocol !== undefined
  }

  public async getSubProtocols(
    mainProtocol: ICoinProtocol | MainProtocolSymbols,
    network?: ProtocolNetwork | string,
    activeOnly: boolean = true
  ): Promise<ICoinSubProtocol[]> {
    await this.waitReady()

    const mainIdentifier = typeof mainProtocol === 'string' ? mainProtocol : mainProtocol.identifier
    const targetNetwork: ProtocolNetwork | string = network ?? getProtocolOptionsByIdentifier(mainIdentifier).network
    const protocolAndNetworkIdentifier: string = getProtocolAndNetworkIdentifier(mainIdentifier, targetNetwork)

    const subProtocolsMap: SubProtocolsMap = await (activeOnly ? this.getActiveSubProtocols() : this.getSupportedSubProtocols())

    return Object.values(subProtocolsMap[protocolAndNetworkIdentifier] ?? {}).filter(
      (subProtocol: ICoinSubProtocol | undefined) => subProtocol !== undefined
    )
  }

  public async getAllSubProtocols(
    mainProtocol: ICoinProtocol | MainProtocolSymbols,
    activeOnly: boolean = true
  ): Promise<ICoinSubProtocol[]> {
    await this.waitReady()

    const mainIdentifier = typeof mainProtocol === 'string' ? mainProtocol : mainProtocol.identifier
    const subProtocolsMap: SubProtocolsMap = await (activeOnly ? this.getActiveSubProtocols() : this.getSupportedSubProtocols())

    return Object.keys(subProtocolsMap)
      .filter((key) => key.startsWith(mainIdentifier))
      .map((key) => Object.values(subProtocolsMap[key] ?? {}))
      .reduce((flatten, next) => flatten.concat(next))
  }

  public async getNetworksForProtocol(
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    activeOnly: boolean = true
  ): Promise<ProtocolNetwork[]> {
    await this.waitReady()

    const identifier: ProtocolSymbols = typeof protocolOrIdentifier === 'string' ? protocolOrIdentifier : protocolOrIdentifier.identifier

    return this.mainProtocolStore.isIdentifierValid(identifier)
      ? this.mainProtocolStore.getNetworksForProtocol(identifier as MainProtocolSymbols, activeOnly)
      : this.subProtocolStore.getNetworksForProtocol(identifier as SubProtocolSymbols, activeOnly)
  }

  public async getNetworkForProtocol(
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    networkIdentifier: string,
    activeOnly: boolean = true
  ): Promise<ProtocolNetwork | undefined> {
    const networks = await this.getNetworksForProtocol(protocolOrIdentifier, activeOnly)

    return networks.find((network: ProtocolNetwork) => network.identifier === networkIdentifier)
  }

  public async isAddressOfProtocol(protocolOrIdentifier: ICoinProtocol | ProtocolSymbols, address: string): Promise<boolean> {
    await this.waitReady()

    const protocol: ICoinProtocol =
      typeof protocolOrIdentifier === 'string' ? await this.getProtocol(protocolOrIdentifier) : protocolOrIdentifier

    return address.match(protocol.addressValidationPattern) !== null
  }

  public async getProtocolsForAddress(address: string): Promise<ICoinProtocol[]> {
    await this.waitReady()

    const protocols: ICoinProtocol[] = await this.getSupportedProtocols()

    return (
      await Promise.all(
        protocols.map(async (protocol) => {
          const isProtocolAddress: boolean = await this.isAddressOfProtocol(protocol, address)

          return isProtocolAddress ? protocol : undefined
        })
      )
    ).filter((protocol: ICoinProtocol | undefined) => protocol !== undefined)
  }

  public isKnownProtocolSymbol(symbol: ProtocolSymbols): boolean {
    if (this.knownProtocolSymbols === undefined) {
      this.knownProtocolSymbols = new Set([
        ...Object.values(MainProtocolSymbols),
        ...Object.values(SubProtocolSymbols),
        ...ethTokens.map((token: Token) => token.identifier)
      ])
    }

    return this.knownProtocolSymbols?.has(symbol) ?? false
  }

  private async isProtocolRegistered(
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    network?: ProtocolNetwork,
    checkActiveOnly: boolean = true
  ): Promise<boolean> {
    const identifier = typeof protocolOrIdentifier === 'string' ? protocolOrIdentifier : protocolOrIdentifier.identifier
    const targetNetwork: ProtocolNetwork =
      typeof protocolOrIdentifier !== 'string'
        ? protocolOrIdentifier.options.network
        : network ?? getProtocolOptionsByIdentifier(identifier).network

    return this.getProtocol(identifier, targetNetwork, checkActiveOnly)
      .then((protocol) => protocol.identifier === identifier && protocol.options.network.identifier === targetNetwork.identifier)
      .catch(() => false)
  }
}
