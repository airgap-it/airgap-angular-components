import { Injectable } from '@angular/core'
import { ICoinProtocol } from 'airgap-coin-lib'
import { ProtocolNetwork } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { ProtocolSymbols, SubProtocolSymbols, MainProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { createNotInitialized } from '../../utils/not-initialized'
import { MainProtocolServiceConfig, MainProtocolService } from './internal/main/main-protocol.service'
import { SubProtocolServiceConfig, SubProtocolService, SubProtocolsMap } from './internal/sub/sub-protocol.service'

export type ProtocolServiceConfig = MainProtocolServiceConfig & SubProtocolServiceConfig

const notInitialized = createNotInitialized('ProtocolService', 'Call `init` first.')

@Injectable({
  providedIn: 'root'
})
export class ProtocolService {
  constructor(public readonly mainProtocolService: MainProtocolService, public readonly subProtocolService: SubProtocolService) {}

  public get isInitialized(): boolean {
    return this.mainProtocolService.isInitialized && this.subProtocolService.isInitialized
  }

  public get supportedProtocols(): ICoinProtocol[] {
    try {
      return this.mainProtocolService.supportedProtocols
    } catch {
      return notInitialized()
    }
  }

  public get passiveProtocols(): ICoinProtocol[] {
    try {
      return this.mainProtocolService.passiveProtocols
    } catch {
      return notInitialized()
    }
  }

  public get activeProtocols(): ICoinProtocol[] {
    try {
      return this.mainProtocolService.activeProtocols
    } catch {
      return notInitialized()
    }
  }

  public get supportedSubProtocols(): SubProtocolsMap {
    try {
      return this.subProtocolService.supportedProtocols
    } catch {
      return notInitialized()
    }
  }

  public get passiveSubProtocols(): SubProtocolsMap {
    try {
      return this.subProtocolService.passiveProtocols
    } catch {
      return notInitialized()
    }
  }

  public get activeSubProtocols(): SubProtocolsMap {
    try {
      return this.subProtocolService.activeProtocols
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

    this.mainProtocolService.init({
      passiveProtocols: config?.passiveProtocols,
      activeProtocols: config?.activeProtocols,
      extraPassiveProtocols: config?.extraPassiveProtocols,
      extraActiveProtocols: config?.extraActiveProtocols
    })
    this.subProtocolService.init({
      passiveSubProtocols: config?.passiveSubProtocols,
      activeSubProtocols: config?.activeSubProtocols,
      extraPassiveSubProtocols: config?.extraPassiveSubProtocols,
      extraActiveSubProtocols: config?.extraActiveSubProtocols
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
    network?: ProtocolNetwork,
    activeOnly: boolean = true
  ): ICoinProtocol | undefined {
    try {
      if (typeof protocolOrIdentifier == 'string') {
        return Object.values(MainProtocolSymbols).includes(protocolOrIdentifier as MainProtocolSymbols)
          ? this.mainProtocolService.getProtocolByIdentifier(protocolOrIdentifier as MainProtocolSymbols, network, activeOnly)
          : this.subProtocolService.getSubProtocolByIdentifier(protocolOrIdentifier as SubProtocolSymbols, network, activeOnly)
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
