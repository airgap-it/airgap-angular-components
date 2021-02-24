import { Injectable } from '@angular/core'
import { ICoinProtocol, ICoinSubProtocol } from '@airgap/coinlib-core'
import { ProtocolNetwork } from '@airgap/coinlib-core'
import { ProtocolSymbols, SubProtocolSymbols, MainProtocolSymbols } from '@airgap/coinlib-core'
import { getProtocolOptionsByIdentifier } from '@airgap/coinlib-core/'
import { getProtocolAndNetworkIdentifier } from '../../utils/protocol/protocol-network-identifier'
import { ExposedPromise } from '../../utils/ExposedPromise'
import { MainProtocolStoreConfig, MainProtocolStoreService } from './store/main/main-protocol-store.service'
import { SubProtocolStoreConfig, SubProtocolStoreService, SubProtocolsMap } from './store/sub/sub-protocol-store.service'
import {
  getDefaultPassiveProtocols,
  getDefaultActiveProtocols,
  getDefaultPassiveSubProtocols,
  getDefaultActiveSubProtocols
} from './defaults'

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

    if (typeof protocolOrIdentifier == 'string') {
      const protocol: ICoinProtocol | undefined = this.mainProtocolStore.isIdentifierValid(protocolOrIdentifier)
        ? this.mainProtocolStore.getProtocolByIdentifier(protocolOrIdentifier as MainProtocolSymbols, network, activeOnly)
        : this.subProtocolStore.getProtocolByIdentifier(protocolOrIdentifier as SubProtocolSymbols, network, activeOnly)

      if (protocol === undefined) {
        throw new Error(`Protocol ${protocolOrIdentifier} not supported`)
      }

      return protocol
    } else {
      return protocolOrIdentifier
    }
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
    ) as ICoinSubProtocol[]
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

  public async isAddressOfProtocol(protocolSymbol: ProtocolSymbols, address: string): Promise<boolean> {
    await this.waitReady()

    const protocol: ICoinProtocol = await this.getProtocol(protocolSymbol)

    return address.match(protocol.addressValidationPattern) !== null
  }

  private async isProtocolRegistered(
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    network?: ProtocolNetwork,
    checkActiveOnly: boolean = true
  ): Promise<boolean> {
    const identifier = typeof protocolOrIdentifier === 'string' ? protocolOrIdentifier : protocolOrIdentifier.identifier
    const targetNetwork: ProtocolNetwork | undefined =
      typeof protocolOrIdentifier !== 'string' ? protocolOrIdentifier.options.network : network

    return this.getProtocol(identifier, targetNetwork, checkActiveOnly)
      .then(() => true)
      .catch(() => false)
  }
}
