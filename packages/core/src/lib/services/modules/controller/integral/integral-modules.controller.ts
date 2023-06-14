import { AirGapWallet } from '@airgap/coinlib-core'
import {
  AirGapBlockExplorer,
  AirGapModule,
  AirGapOfflineProtocol,
  AirGapOnlineProtocol,
  AirGapV3SerializerCompanion,
  OfflineProtocolConfiguration,
  OnlineProtocolConfiguration,
  ProtocolConfiguration,
  ProtocolNetwork
} from '@airgap/module-kit'
import { Injectable } from '@angular/core'
import { flattened } from '../../../../utils/array'
import { getOfflineProtocolConfiguration, getOnlineProtocolConfiguration } from '../../../../utils/modules/load-protocol'
import { deriveAddressesAsync } from '../../../../utils/worker'
import { BaseModulesController, LoadedModule, LoadedProtocol } from '../base-modules.controller'

@Injectable({
  providedIn: 'root'
})
export class IntegralModulesController implements BaseModulesController {
  public isInitialized: boolean = false

  private modules: AirGapModule[] = []

  private readonly supportedProtocols: Set<string> = new Set()

  public init(modules: AirGapModule[]): void {
    this.isInitialized = true
    this.modules = modules
  }

  public async loadModules(protocolType?: ProtocolConfiguration['type'], ignoreProtocols: string[] = []): Promise<LoadedModule[]> {
    return Promise.all(this.modules.map((module: AirGapModule) => this.loadModule(module, protocolType, new Set(ignoreProtocols))))
  }

  private async loadModule(
    module: AirGapModule,
    protocolType: ProtocolConfiguration['type'] | undefined,
    ignoreProtocols: Set<string>
  ): Promise<LoadedModule> {
    const v3SerializerCompanion: AirGapV3SerializerCompanion = await module.createV3SerializerCompanion()
    const protocols: LoadedProtocol[] = flattened(
      await Promise.all(
        Object.entries(module.supportedProtocols)
          .filter(([identifier, _]) => !ignoreProtocols.has(identifier))
          .map(([identifier, configuration]: [string, ProtocolConfiguration]) =>
            this.loadModuleProtocols(module, identifier, configuration, protocolType)
          )
      )
    )

    protocols.forEach((protocol: LoadedProtocol) => {
      this.supportedProtocols.add(protocol.identifier)
    })

    return { protocols, v3SerializerCompanion }
  }

  private async loadModuleProtocols(
    module: AirGapModule,
    identifier: string,
    configuration: ProtocolConfiguration,
    protocolType?: ProtocolConfiguration['type']
  ): Promise<LoadedProtocol[]> {
    const offlineConfiguration: OfflineProtocolConfiguration | undefined = getOfflineProtocolConfiguration(configuration, protocolType)
    const onlineConfiguration: OnlineProtocolConfiguration | undefined = getOnlineProtocolConfiguration(configuration, protocolType)

    const [offlineProtocols, onlineProtocols]: [LoadedProtocol[], LoadedProtocol[]] = await Promise.all([
      offlineConfiguration ? this.loadOfflineProtocols(module, identifier, offlineConfiguration) : Promise.resolve([]),
      onlineConfiguration ? this.loadOnlineProtocols(module, identifier, onlineConfiguration) : Promise.resolve([])
    ])

    return offlineProtocols.concat(onlineProtocols)
  }

  private async loadOfflineProtocols(
    module: AirGapModule,
    identifier: string,
    _configuration: OfflineProtocolConfiguration
  ): Promise<LoadedProtocol[]> {
    const protocol: AirGapOfflineProtocol | undefined = await module.createOfflineProtocol(identifier)
    if (protocol === undefined) {
      return []
    }

    return [{ identifier, protocol }]
  }

  private async loadOnlineProtocols(
    module: AirGapModule,
    identifier: string,
    configuration: OnlineProtocolConfiguration
  ): Promise<LoadedProtocol[]> {
    const protocols: (LoadedProtocol | undefined)[] = await Promise.all(
      Object.entries(configuration.networks).map(async ([networkId, _]: [string, ProtocolNetwork]) => {
        const [protocol, blockExplorer]: [AirGapOnlineProtocol | undefined, AirGapBlockExplorer | undefined] = await Promise.all([
          module.createOnlineProtocol(identifier, networkId),
          module.createBlockExplorer(identifier, networkId)
        ])
        if (protocol === undefined) {
          return undefined
        }

        return { identifier, protocol, blockExplorer }
      })
    )

    return protocols.filter((protocol: LoadedProtocol | undefined) => protocol !== undefined)
  }

  public isProtocolSupported(identifier: string): boolean {
    return this.supportedProtocols.has(identifier)
  }

  public async getProtocolNetwork(protocolIdentifier: string, networkId?: string): Promise<ProtocolNetwork | undefined> {
    const targetModule: AirGapModule | undefined = this.modules.find(
      (module: AirGapModule) => module.supportedProtocols[protocolIdentifier] !== undefined
    )
    if (targetModule === undefined) {
      return undefined
    }

    const onlineProtocol: AirGapOnlineProtocol | undefined = await targetModule.createOnlineProtocol(protocolIdentifier, networkId)
    if (onlineProtocol === undefined) {
      return undefined
    }

    return onlineProtocol.getNetwork()
  }

  public async getProtocolBlockExplorer(
    protocolIdentifier: string,
    network: string | ProtocolNetwork
  ): Promise<AirGapBlockExplorer | undefined> {
    const targetModule: AirGapModule | undefined = this.modules.find(
      (module: AirGapModule) => module.supportedProtocols[protocolIdentifier] !== undefined
    )
    if (targetModule === undefined) {
      return undefined
    }

    return targetModule.createBlockExplorer(protocolIdentifier, network)
  }

  public async deriveAddresses(wallets: AirGapWallet[], amount?: number): Promise<Record<string, string[]>> {
    return deriveAddressesAsync(wallets, amount)
  }
}
