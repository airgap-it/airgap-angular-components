import { AirGapWallet, ICoinProtocol, ICoinSubProtocol, ProtocolSymbols } from '@airgap/coinlib-core'
import {
  AirGapAnyProtocol,
  AirGapModule,
  AirGapV3SerializerCompanion,
  isOnlineProtocol,
  isSubProtocol,
  ProtocolConfiguration,
  ProtocolNetwork,
  protocolNetworkIdentifier,
  V3SchemaConfiguration
} from '@airgap/module-kit'
import { SerializerV3, TransactionValidator } from '@airgap/serializer'
import { Injectable } from '@angular/core'
import {
  createICoinProtocolAdapter,
  createICoinSubProtocolAdapter,
  ICoinProtocolAdapter,
  ICoinSubProtocolAdapter,
  TransactionValidatorAdapter
} from '../../protocol/adapter/protocol-v0-adapter'
import { IsolatedModuleMetadata, IsolatedModulePreviewMetadata } from '../../types/isolated-modules/IsolatedModuleMetadata'
import { flattened } from '../../utils/array'
import { ProtocolService } from '../protocol/protocol.service'
import { LoadedModule, LoadedProtocol } from './controller/base-modules.controller'
import { ModulesController } from './controller/modules.controller'

type AdaptedProtocolStatus = 'active' | 'passive'

interface AdaptedMainProtocol {
  type: 'main'
  status: AdaptedProtocolStatus
  value: ICoinProtocolAdapter
}

interface AdaptedSubProtocol {
  type: 'sub'
  status: AdaptedProtocolStatus
  value: [ICoinProtocolAdapter, ICoinSubProtocolAdapter]
}

type AdaptedProtocol = AdaptedMainProtocol | AdaptedSubProtocol

interface Protocols {
  activeProtocols: ICoinProtocol[]
  passiveProtocols: ICoinProtocol[]
  activeSubProtocols: [ICoinProtocol, ICoinSubProtocol][]
  passiveSubProtocols: [ICoinProtocol, ICoinSubProtocol][]
}

@Injectable()
export abstract class BaseModulesService {
  private get isInitialized(): boolean {
    return this.modulesController.isInitialized
  }

  constructor(protected readonly modulesController: ModulesController, protected readonly protocolService: ProtocolService) {}

  public init(integralModules: AirGapModule[] = []): void {
    if (this.isInitialized) {
      // eslint-disable-next-line no-console
      console.log('[ModulesService] already initialized')

      return
    }

    this.modulesController.init(integralModules)
  }

  public async loadProtocols(type?: ProtocolConfiguration['type'], ignore: string[] = []): Promise<Protocols> {
    const modules: LoadedModule[] = await this.modulesController.loadModules(type, ignore)
    const adaptedProtocols: AdaptedProtocol[] = await this.adaptProtocols(modules, type)

    return this.processAdaptedProtocols(adaptedProtocols)
  }

  public async deriveAddresses(walletOrWallets: AirGapWallet | AirGapWallet[], amount: number = 50): Promise<Record<string, string[]>> {
    const wallets: AirGapWallet[] = Array.isArray(walletOrWallets) ? walletOrWallets : [walletOrWallets]

    return this.modulesController.deriveAddresses(wallets, amount)
  }

  public async getModulesMetadata(): Promise<IsolatedModuleMetadata[]> {
    return this.modulesController.getModulesMetadata()
  }

  public async readModuleMetadata(name: string, path: string): Promise<IsolatedModulePreviewMetadata> {
    return this.modulesController.readModuleMetadata(name, path)
  }

  public async installModule(metadata: IsolatedModulePreviewMetadata): Promise<void> {
    const loadedModule: LoadedModule = await this.modulesController.installModule(metadata)
    const adaptedProtocols: AdaptedProtocol[] = await this.adaptProtocols([loadedModule])
    const protocols: Protocols = this.processAdaptedProtocols(adaptedProtocols)

    await this.protocolService.addActiveMainProtocols(protocols.activeProtocols)
    await this.protocolService.addActiveSubProtocols(protocols.activeSubProtocols.map(([_, protocol]) => protocol))
  }

  public async removeInstalledModules(identifiers: string[]): Promise<void> {
    const removedIdentifiers: string[] = await this.modulesController.removeInstalledModules(identifiers)
    await this.protocolService.removeProtocols(removedIdentifiers as ProtocolSymbols[])
  }

  public async removeAllInstalledModules(): Promise<void> {
    const removedIdentifiers: string[] = await this.modulesController.removeAllInstalledModules()
    await this.protocolService.removeProtocols(removedIdentifiers as ProtocolSymbols[])
  }

  private async adaptProtocols(modules: LoadedModule[], type?: ProtocolConfiguration['type']): Promise<AdaptedProtocol[]> {
    const adaptedProtocols: AdaptedProtocol[][] = await Promise.all(
      modules.map(async (module: LoadedModule) => {
        this.loadSerializerCompanion(module.v3SerializerCompanion)

        const activeProtocols: Record<string, ICoinProtocolAdapter> = {}
        const activeSubProtocols: [ICoinProtocolAdapter, ICoinSubProtocolAdapter][] = []

        const groupedProtocols: Record<string, LoadedProtocol> = await Promise.all(
          module.protocols.map(async (protocol: LoadedProtocol) => [await this.getProtocolKey(protocol.protocol, type), protocol])
        ).then((pairs: [string, LoadedProtocol][]) =>
          pairs.reduce(
            (obj: Record<string, LoadedProtocol>, next: [string, LoadedProtocol]) => Object.assign(obj, { [next[0]]: next[1] }),
            {}
          )
        )

        for (const { protocol, blockExplorer } of Object.values(groupedProtocols)) {
          if (isSubProtocol(protocol)) {
            const adapter: ICoinSubProtocolAdapter = await createICoinSubProtocolAdapter(
              protocol,
              blockExplorer,
              module.v3SerializerCompanion,
              { type }
            )

            const mainKey: string = await this.getProtocolKey(
              await adapter.protocolV1.mainProtocol(),
              isOnlineProtocol(adapter.protocolV1) && (type === 'online' || type === 'full')
                ? await adapter.protocolV1.getNetwork()
                : undefined
            )
            if (!(mainKey in activeProtocols)) {
              const mainAdapter: ICoinProtocolAdapter = await createICoinProtocolAdapter(
                groupedProtocols[mainKey].protocol,
                groupedProtocols[mainKey].blockExplorer,
                module.v3SerializerCompanion,
                { type }
              )
              activeProtocols[mainKey] = mainAdapter
            }

            activeSubProtocols.push([activeProtocols[mainKey], adapter])
          } else {
            const key: string = await this.getProtocolKey(protocol, type)
            if (activeProtocols[key] !== undefined) {
              continue
            }

            const adapter: ICoinProtocolAdapter = await createICoinProtocolAdapter(protocol, blockExplorer, module.v3SerializerCompanion, {
              type
            })
            activeProtocols[key] = adapter
          }
        }

        const adaptedMainProtocols: AdaptedProtocol[] = Object.values(activeProtocols).map(
          (protocol): AdaptedMainProtocol => ({
            type: 'main',
            status: 'active',
            value: protocol
          })
        )

        const adaptedSubProtocols: AdaptedProtocol[] = activeSubProtocols.map(
          (protocol): AdaptedSubProtocol => ({
            type: 'sub',
            status: 'active',
            value: protocol
          })
        )

        return adaptedMainProtocols.concat(adaptedSubProtocols)
      })
    )

    return flattened(adaptedProtocols)
  }

  private loadSerializerCompanion(v3SerializerCompanion: AirGapV3SerializerCompanion) {
    v3SerializerCompanion.schemas.forEach((configuration: V3SchemaConfiguration) => {
      SerializerV3.addSchema(configuration.type, configuration.schema, configuration.protocolIdentifier as ProtocolSymbols)

      if (configuration.protocolIdentifier) {
        SerializerV3.addValidator(configuration.protocolIdentifier as ProtocolSymbols, {
          create(): TransactionValidator {
            return new TransactionValidatorAdapter(configuration.protocolIdentifier, v3SerializerCompanion)
          }
        })
      }
    })
  }

  private processAdaptedProtocols(protocols: AdaptedProtocol[]): Protocols {
    const activeProtocols: ICoinProtocol[] = []
    const passiveProtocols: ICoinProtocol[] = []

    const activeSubProtocols: [ICoinProtocol, ICoinSubProtocol][] = []
    const passiveSubProtocols: [ICoinProtocol, ICoinSubProtocol][] = []

    for (const protocol of protocols) {
      if (protocol.type === 'main' && protocol.status === 'active') {
        activeProtocols.push(protocol.value)
      }

      if (protocol.type === 'main' && protocol.status === 'passive') {
        passiveProtocols.push(protocol.value)
      }

      if (protocol.type === 'sub' && protocol.status === 'active') {
        activeSubProtocols.push(protocol.value)
      }

      if (protocol.type === 'sub' && protocol.status === 'passive') {
        passiveSubProtocols.push(protocol.value)
      }
    }

    return {
      activeProtocols,
      passiveProtocols,
      activeSubProtocols,
      passiveSubProtocols
    }
  }

  private async getProtocolKey(protocol: AirGapAnyProtocol, type?: ProtocolConfiguration['type']): Promise<string>
  private async getProtocolKey(protocolIdentifier: string, network: ProtocolNetwork | undefined): Promise<string>
  private async getProtocolKey(
    protocolOrIdentifier: AirGapAnyProtocol | string,
    networkOrTypeOrUndefined?: ProtocolNetwork | ProtocolConfiguration['type'] | undefined
  ): Promise<string> {
    const protocolIdentifier: string =
      typeof protocolOrIdentifier === 'string' ? protocolOrIdentifier : (await protocolOrIdentifier.getMetadata()).identifier

    const type: ProtocolConfiguration['type'] | undefined =
      typeof networkOrTypeOrUndefined === 'string' ? networkOrTypeOrUndefined : undefined

    const network: ProtocolNetwork | undefined =
      isOnlineProtocol(protocolOrIdentifier) && (type === 'online' || type === 'full')
        ? await protocolOrIdentifier.getNetwork()
        : typeof networkOrTypeOrUndefined === 'object'
        ? networkOrTypeOrUndefined
        : undefined

    if (!network) {
      return protocolIdentifier
    }

    return `${protocolIdentifier}_${protocolNetworkIdentifier(network)}`
  }
}
