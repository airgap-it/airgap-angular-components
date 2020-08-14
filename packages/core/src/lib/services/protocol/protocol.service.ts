import { Injectable } from '@angular/core'
import { ICoinProtocol, ICoinSubProtocol } from 'airgap-coin-lib'
import { ProtocolNetwork } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { ProtocolSymbols, SubProtocolSymbols, MainProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { createNotInitialized } from '../../utils/not-initialized'
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

const notInitialized = createNotInitialized('ProtocolService', 'Call `init` first.')

@Injectable({
  providedIn: 'root'
})
export class ProtocolService {
  constructor(private readonly mainProtocolStore: MainProtocolStoreService, private readonly subProtocolStore: SubProtocolStoreService) {}

  public get isInitialized(): boolean {
    return this.mainProtocolStore.isInitialized && this.subProtocolStore.isInitialized
  }

  public get supportedProtocols(): ICoinProtocol[] {
    try {
      return this.mainProtocolStore.supportedProtocols
    } catch {
      return notInitialized()
    }
  }

  public get passiveProtocols(): ICoinProtocol[] {
    try {
      return this.mainProtocolStore.passiveProtocols
    } catch {
      return notInitialized()
    }
  }

  public get activeProtocols(): ICoinProtocol[] {
    try {
      return this.mainProtocolStore.activeProtocols
    } catch {
      return notInitialized()
    }
  }

  public get supportedSubProtocols(): SubProtocolsMap {
    try {
      return this.subProtocolStore.supportedProtocols
    } catch {
      return notInitialized()
    }
  }

  public get passiveSubProtocols(): SubProtocolsMap {
    try {
      return this.subProtocolStore.passiveProtocols
    } catch {
      return notInitialized()
    }
  }

  public get activeSubProtocols(): SubProtocolsMap {
    try {
      return this.subProtocolStore.activeProtocols
    } catch {
      return notInitialized()
    }
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
  }

  public isProtocolActive(protocol: ICoinProtocol): boolean
  public isProtocolActive(identifier: ProtocolSymbols, network?: ProtocolNetwork): boolean
  public isProtocolActive(protocolOrIdentifier: ICoinProtocol | ProtocolSymbols, network?: ProtocolNetwork): boolean {
    return this.isProtocolRegistered(protocolOrIdentifier, network, true)
  }

  public isProtocolSupported(protocol: ICoinProtocol): boolean
  public isProtocolSupported(identifier: ProtocolSymbols, network?: ProtocolNetwork): boolean
  public isProtocolSupported(protocolOrIdentifier: ICoinProtocol | ProtocolSymbols, network?: ProtocolNetwork): boolean {
    return this.isProtocolRegistered(protocolOrIdentifier, network, false)
  }

  public getProtocol(
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    network?: ProtocolNetwork | string,
    activeOnly: boolean = true
  ): ICoinProtocol | undefined {
    try {
      if (typeof protocolOrIdentifier == 'string') {
        return this.mainProtocolStore.isIdentifierValid(protocolOrIdentifier)
          ? this.mainProtocolStore.getProtocolByIdentifier(protocolOrIdentifier as MainProtocolSymbols, network, activeOnly)
          : this.subProtocolStore.getProtocolByIdentifier(protocolOrIdentifier as SubProtocolSymbols, network, activeOnly)
      } else {
        return protocolOrIdentifier
      }
    } catch (error) {
      return undefined
    }
  }

  public isAddressOfProtocol(protocolSymbol: ProtocolSymbols, address: string): boolean {
    const protocol: ICoinProtocol | undefined = this.getProtocol(protocolSymbol)

    return protocol !== undefined && address.match(protocol.addressValidationPattern) !== null
  }

  private isProtocolRegistered(
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    network?: ProtocolNetwork,
    checkActiveOnly: boolean = true
  ): boolean {
    const identifier = typeof protocolOrIdentifier === 'string' ? protocolOrIdentifier : protocolOrIdentifier.identifier
    const targetNetwork: ProtocolNetwork | undefined =
      typeof protocolOrIdentifier !== 'string' ? protocolOrIdentifier.options.network : network

    return this.getProtocol(identifier, targetNetwork, checkActiveOnly) !== undefined
  }
}
