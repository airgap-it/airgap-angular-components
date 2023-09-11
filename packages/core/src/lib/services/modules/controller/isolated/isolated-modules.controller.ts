import { AirGapWallet } from '@airgap/coinlib-core'
import { Inject, Injectable } from '@angular/core'
import {
  AirGapAnyProtocol,
  AirGapBlockExplorer,
  AirGapV3SerializerCompanion,
  ProtocolConfiguration,
  ProtocolNetwork
} from '@airgap/module-kit'
import { ISOLATED_MODULES_PLUGIN } from '../../../../capacitor-plugins/injection-tokens'
import {
  CallMethodResult,
  IsolatedModulesPlugin,
  LoadAllModulesResult,
  PreviewDynamicModuleResult,
  ReadAssetModuleResult,
  ReadDynamicModuleResult
} from '../../../../capacitor-plugins/definitions'
import { IsolatedModule, IsolatedProtocol } from '../../../../types/isolated-modules/IsolatedModule'
import { IsolatedAirGapV3SerializerCompanion } from '../../../../protocol/isolated/v3-serializer-companion-isolated'
import { flattened } from '../../../../utils/array'
import { IsolatedAirGapOfflineProtocol } from '../../../../protocol/isolated/protocol-offline-isolated'
import { IsolatedAirGapOnlineProtocol } from '../../../../protocol/isolated/protocol-online-isolated'
import { IsolatedAirGapBlockExplorer } from '../../../../protocol/isolated/block-explorer-isolated'
import {
  IsolatedModuleAssetMetadata,
  IsolatedModuleInstalledMetadata,
  IsolatedModuleMetadata,
  IsolatedModulePreviewMetadata
} from '../../../../types/isolated-modules/IsolatedModuleMetadata'
import { BaseModulesController, LoadedModule, LoadedProtocol } from '../base-modules.controller'
import { FilesystemService } from '../../../filesystem/filesystem.service'

const AIRGAP_PUBLIC_KEY: string = ''

@Injectable({
  providedIn: 'root'
})
export class IsolatedModulesController implements BaseModulesController {
  private readonly staticModules: Map<string, IsolatedModule> = new Map()
  private readonly dynamicModules: Map<string, IsolatedModule> = new Map()

  private readonly supportedProtocols: Set<string> = new Set()

  constructor(
    @Inject(ISOLATED_MODULES_PLUGIN) private readonly isolatedModules: IsolatedModulesPlugin,
    private readonly filesystemService: FilesystemService
  ) {}

  public async loadModules(protocolType?: ProtocolConfiguration['type'], ignoreProtocols: string[] = []): Promise<LoadedModule[]> {
    const { modules }: LoadAllModulesResult = await this.isolatedModules.loadAllModules({ protocolType, ignoreProtocols })
    modules.forEach((module: IsolatedModule) => {
      if (module.type === 'static') {
        this.staticModules.set(module.identifier, module)
      } else {
        this.dynamicModules.set(module.identifier, module)
      }
    })

    return this.processIsolatedModules(modules, protocolType, new Set(ignoreProtocols))
  }

  private async processIsolatedModules(
    modules: IsolatedModule[],
    type?: ProtocolConfiguration['type'],
    ignore: Set<string> = new Set()
  ): Promise<LoadedModule[]> {
    const loadedModules: (LoadedModule | undefined)[] = await Promise.all(
      modules.map((module: IsolatedModule) => this.processIsolatedModule(module, type, ignore))
    )

    return loadedModules.filter((module: LoadedModule | undefined) => module !== undefined)
  }

  private async processIsolatedModule(
    module: IsolatedModule,
    type?: ProtocolConfiguration['type'],
    ignore: Set<string> = new Set()
  ): Promise<LoadedModule | undefined> {
    const protocols: LoadedProtocol[] = module.protocols
      .filter((protocol: IsolatedProtocol) => !ignore.has(protocol.identifier) && (type ? protocol.mode === type : true))
      .map((protocol: IsolatedProtocol) => {
        const wrappedProtocol: AirGapAnyProtocol =
          protocol.mode === 'offline'
            ? new IsolatedAirGapOfflineProtocol(this.isolatedModules, protocol)
            : new IsolatedAirGapOnlineProtocol(this.isolatedModules, protocol)

        const wrappedBlockExplorer: AirGapBlockExplorer = new IsolatedAirGapBlockExplorer(
          this.isolatedModules,
          protocol.identifier,
          protocol.network,
          protocol.blockExplorerMetadata
        )

        this.supportedProtocols.add(protocol.identifier)

        return { identifier: protocol.identifier, protocol: wrappedProtocol, blockExplorer: wrappedBlockExplorer }
      })

    if (protocols.length === 0) {
      return undefined
    }

    const v3SerializerCompanion: AirGapV3SerializerCompanion = new IsolatedAirGapV3SerializerCompanion(
      this.isolatedModules,
      module.v3SchemaConfigurations,
      module.identifier
    )

    return {
      protocols,
      v3SerializerCompanion
    }
  }

  public isProtocolSupported(identifier: string): boolean {
    return this.supportedProtocols.has(identifier)
  }

  public async getProtocolNetwork(protocolIdentifier: string, networkId?: string): Promise<ProtocolNetwork | undefined> {
    const { value }: CallMethodResult = await this.isolatedModules.callMethod({
      target: 'onlineProtocol',
      method: 'getNetwork',
      protocolIdentifier,
      networkId
    })

    return value as ProtocolNetwork
  }

  public async getProtocolBlockExplorer(
    protocolIdentifier: string,
    network: string | ProtocolNetwork
  ): Promise<AirGapBlockExplorer | undefined> {
    const networkObject: ProtocolNetwork =
      typeof network === 'string' ? await this.getProtocolNetwork(protocolIdentifier, network) : network

    return new IsolatedAirGapBlockExplorer(this.isolatedModules, protocolIdentifier, networkObject)
  }

  public async deriveAddresses(wallets: AirGapWallet[], amount: number = 50): Promise<Record<string, string[]>> {
    // TODO: optimize?
    const addressesByKey: Record<string, string[]>[] = await Promise.all(
      wallets.map(async (wallet: AirGapWallet) => {
        const addresses: string[] = await wallet.deriveAddresses(amount)

        return { [`${await wallet.protocol.getIdentifier()}_${wallet.publicKey}`]: addresses }
      })
    )

    return addressesByKey.reduce((obj: Record<string, string[]>, next: Record<string, string[]>) => Object.assign(obj, next), {})
  }

  public async getModulesMetadata(): Promise<IsolatedModuleMetadata[]> {
    const metadata: [IsolatedModuleAssetMetadata[], IsolatedModuleInstalledMetadata[]] = await Promise.all([
      this.getAssetModulesMetadata(),
      this.getDynamicModulesMetadata()
    ])

    return flattened<IsolatedModuleMetadata>(metadata)
  }

  private async getAssetModulesMetadata(): Promise<IsolatedModuleAssetMetadata[]> {
    return Promise.all(
      Array.from(this.staticModules.values()).map(async (module: IsolatedModule): Promise<IsolatedModuleAssetMetadata> => {
        const { manifest }: ReadAssetModuleResult = await this.isolatedModules.readAssetModule({
          identifier: module.identifier
        })

        return {
          type: 'asset',
          manifest,
          module,
          source: manifest.publicKey === AIRGAP_PUBLIC_KEY ? 'airgap' : '3rd_party'
        }
      })
    )
  }

  private async getDynamicModulesMetadata(): Promise<IsolatedModuleInstalledMetadata[]> {
    return Promise.all(
      Array.from(this.dynamicModules.values()).map(async (module: IsolatedModule): Promise<IsolatedModuleInstalledMetadata> => {
        const { manifest, installedAt }: ReadDynamicModuleResult = await this.isolatedModules.readDynamicModule({
          identifier: module.identifier
        })

        return {
          type: 'installed',
          manifest,
          module,
          installedAt,
          source: manifest.publicKey === AIRGAP_PUBLIC_KEY ? 'airgap' : '3rd_party'
        }
      })
    )
  }

  public async readModuleMetadata(name: string, path: string): Promise<IsolatedModulePreviewMetadata> {
    if (!name.endsWith('.zip')) {
      throw new Error('Invalid protocol module format, expected .zip')
    }

    const tempDir = await this.filesystemService.createTempProtocolModule(name, path)

    try {
      const root: string | undefined = await this.filesystemService.findProtocolModuleRoot(tempDir.path, tempDir.directory)
      if (root === undefined) {
        throw new Error('Invalid protocol module structure, manifest not found')
      }

      const preview: PreviewDynamicModuleResult = await this.isolatedModules.previewDynamicModule({
        path: `${tempDir.path}/${root}`.replace(/\/+$/, ''),
        directory: tempDir.directory
      })

      return {
        type: 'preview',
        module: preview.module,
        manifest: preview.manifest,
        path: tempDir.path,
        root,
        directory: tempDir.directory,
        source: preview.manifest.publicKey === AIRGAP_PUBLIC_KEY ? 'airgap' : '3rd_party'
      }
    } catch (error) {
      await this.filesystemService.removeTempProtocolModule(tempDir.path, tempDir.directory).catch(() => {
        /* no action */
      })
      throw error
    }
  }

  public async installModule(metadata: IsolatedModulePreviewMetadata): Promise<LoadedModule> {
    const newIdentifier: string = metadata.manifest.name
      .replace(/\s+/, '_')
      .replace(/[^a-zA-Z\d_-]/g, '')
      .toLocaleLowerCase()

    await this.filesystemService.installProtocolModule(newIdentifier, metadata.manifest.include, metadata.manifest.res?.symbol ?? {}, {
      path: metadata.path,
      root: metadata.root,
      directory: metadata.directory
    })

    await this.isolatedModules.registerDynamicModule({
      identifier: newIdentifier,
      protocolIdentifiers: metadata.module.protocols.map((protocol) => protocol.identifier)
    })

    this.dynamicModules.set(newIdentifier, {
      ...metadata.module,
      identifier: newIdentifier
    })

    return this.processIsolatedModule(metadata.module)
  }

  public async removeInstalledModules(identifiers: string[]): Promise<string[]> {
    await this.isolatedModules.removeDynamicModules({ identifiers })
    const protocolIdentifiers: string[] = flattened(
      identifiers.map(
        (identifier: string) =>
          this.dynamicModules.get(identifier)?.protocols.map((protocol: IsolatedProtocol) => protocol.identifier) ?? []
      )
    )

    identifiers.forEach((identifier: string) => {
      this.dynamicModules.delete(identifier)
    })

    return protocolIdentifiers
  }

  public async removeAllInstalledModules(): Promise<string[]> {
    await this.isolatedModules.removeDynamicModules()
    const protocolIdentifiers: string[] = flattened(
      Array.from(this.dynamicModules.values()).map((module: IsolatedModule) =>
        module.protocols.map((protocol: IsolatedProtocol) => protocol.identifier)
      )
    )

    this.dynamicModules.clear()

    return protocolIdentifiers
  }
}
