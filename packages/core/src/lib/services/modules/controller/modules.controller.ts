import { AirGapWallet } from '@airgap/coinlib-core'
import { AirGapBlockExplorer, AirGapModule, ProtocolConfiguration, ProtocolNetwork } from '@airgap/module-kit'
import { Injectable } from '@angular/core'
import { IsolatedModuleInstalledMetadata, IsolatedModulePreviewMetadata } from '../../../types/isolated-modules/IsolatedModuleMetadata'
import { flattened } from '../../../utils/array'
import { BaseModulesController, LoadedModule, LoadedProtocol } from './base-modules.controller'
import { IntegralModulesController } from './integral/integral-modules.controller'
import { IsolatedModulesController } from './isolated/isolated-modules.controller'

@Injectable({
  providedIn: 'root'
})
export class ModulesController {
  public isInitialized: boolean = false

  constructor(
    private readonly integralModulesController: IntegralModulesController,
    private readonly isolatedModulesController: IsolatedModulesController
  ) {}

  public init(integralModules: AirGapModule[]): void {
    this.isInitialized = true
    this.integralModulesController.init(integralModules)
  }

  public async loadModules(protocolType?: ProtocolConfiguration['type'], ignoreProtocols?: string[]): Promise<LoadedModule[]> {
    const integralModules: LoadedModule[] = await this.integralModulesController.loadModules(protocolType, ignoreProtocols)
    const integralProtocols: string[] = flattened(
      await Promise.all(
        integralModules.map((module: LoadedModule) =>
          Promise.all(
            module.protocols.map((protocol: LoadedProtocol) => protocol.protocol.getMetadata().then((metadata) => metadata.identifier))
          )
        )
      )
    )

    const isolatedModules: LoadedModule[] = await this.isolatedModulesController.loadModules(
      protocolType,
      ignoreProtocols.concat(integralProtocols)
    )

    return integralModules.concat(isolatedModules)
  }

  public async getProtocolNetwork(protocolIdentifier: string, networkId?: string): Promise<ProtocolNetwork | undefined> {
    if (this.integralModulesController.isProtocolSupported(protocolIdentifier)) {
      return this.integralModulesController.getProtocolNetwork(protocolIdentifier, networkId)
    } else if (this.isolatedModulesController.isProtocolSupported(protocolIdentifier)) {
      return this.isolatedModulesController.getProtocolNetwork(protocolIdentifier, networkId)
    } else {
      return undefined
    }
  }

  public async getProtocolBlockExplorer(
    protocolIdentifier: string,
    network: string | ProtocolNetwork
  ): Promise<AirGapBlockExplorer | undefined> {
    if (this.integralModulesController.isProtocolSupported(protocolIdentifier)) {
      return this.integralModulesController.getProtocolBlockExplorer(protocolIdentifier, network)
    } else if (this.isolatedModulesController.isProtocolSupported(protocolIdentifier)) {
      return this.isolatedModulesController.getProtocolBlockExplorer(protocolIdentifier, network)
    } else {
      return undefined
    }
  }

  public async deriveAddresses(wallets: AirGapWallet[], amount?: number): Promise<Record<string, string[]>> {
    const [integralWallets, isolatedWallets]: AirGapWallet[][] = await this.groupWalletsByControllers(wallets, [
      this.integralModulesController,
      this.isolatedModulesController
    ])

    const [integralAddresses, isolatedAddresses]: [Record<string, string[]>, Record<string, string[]>] = await Promise.all([
      this.integralModulesController.deriveAddresses(integralWallets, amount),
      this.isolatedModulesController.deriveAddresses(isolatedWallets, amount)
    ])

    return Object.assign({}, integralAddresses, isolatedAddresses)
  }

  public async getModulesMetadata(): Promise<IsolatedModuleInstalledMetadata[]> {
    return this.isolatedModulesController.getModulesMetadata()
  }

  public async readModuleMetadata(name: string, path: string): Promise<IsolatedModulePreviewMetadata> {
    return this.isolatedModulesController.readModuleMetadata(name, path)
  }

  public async installModule(metadata: IsolatedModulePreviewMetadata): Promise<LoadedModule> {
    return this.isolatedModulesController.installModule(metadata)
  }

  public async removeInstalledModules(identifiers: string[]): Promise<string[]> {
    return this.isolatedModulesController.removeInstalledModules(identifiers)
  }

  public async removeAllInstalledModules(): Promise<string[]> {
    return this.isolatedModulesController.removeAllInstalledModules()
  }

  private async groupWalletsByControllers(wallets: AirGapWallet[], controllers: BaseModulesController[]): Promise<AirGapWallet[][]> {
    const walletsWithProtocolIdentifiers: [AirGapWallet, string][] = await Promise.all(
      wallets.map(async (wallet: AirGapWallet) => [wallet, await wallet.protocol.getIdentifier()] as [AirGapWallet, string])
    )

    return controllers.map((controller: BaseModulesController) =>
      walletsWithProtocolIdentifiers
        .filter(([_, protocolIdentifier]: [AirGapWallet, string]) => controller.isProtocolSupported(protocolIdentifier))
        .map(([wallet, _]: [AirGapWallet, string]) => wallet)
    )
  }
}
