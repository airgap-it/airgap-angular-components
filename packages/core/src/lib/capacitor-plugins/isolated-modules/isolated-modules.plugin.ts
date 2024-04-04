/* eslint-disable max-lines */
/* eslint-disable max-classes-per-file */
import { WebPlugin } from '@capacitor/core'
import { AeternityModule } from '@airgap/aeternity'
import { AstarModule } from '@airgap/astar'
import { BitcoinModule } from '@airgap/bitcoin'
import { CosmosModule } from '@airgap/cosmos'
import { EthereumModule } from '@airgap/ethereum'
import { GroestlcoinModule } from '@airgap/groestlcoin'
import { ICPModule } from '@airgap/icp'
import { CoreumModule } from '@airgap/coreum'
import { AcurastModule } from '@airgap/acurast'
import {
  AirGapAnyProtocol,
  AirGapBlockExplorer,
  AirGapModule,
  AirGapOfflineProtocol,
  AirGapOnlineProtocol,
  AirGapV3SerializerCompanion,
  BlockExplorerMetadata,
  CryptoConfiguration,
  hasConfigurableContract,
  isSubProtocol,
  OfflineProtocolConfiguration,
  OnlineProtocolConfiguration,
  ProtocolConfiguration,
  ProtocolMetadata,
  ProtocolNetwork,
  SubProtocolType
} from '@airgap/module-kit'
import { MoonbeamModule } from '@airgap/moonbeam'
import { OptimismModule } from '@airgap/optimism'
import { PolkadotModule } from '@airgap/polkadot'
import { TezosModule } from '@airgap/tezos'

import {
  BatchCallMethodOptions,
  BatchCallMethodResult,
  BatchCallMethodSingleResult,
  BlockExplorerCallMethodOptions,
  CallMethodOptions,
  CallMethodResult,
  IsolatedModulesPlugin,
  LoadAllModulesOptions,
  LoadAllModulesResult,
  OfflineProtocolCallMethodOptions,
  OnlineProtocolCallMethodOptions,
  PreviewDynamicModuleOptions,
  PreviewDynamicModuleResult,
  ReadAssetModuleOptions,
  ReadAssetModuleResult,
  ReadDynamicModuleOptions,
  ReadDynamicModuleResult,
  RegisterDynamicModuleOptions,
  RemoveDynamicModulesOptions,
  V3SerializerCompanionCallMethodOptions,
  VerifyDynamicModuleOptions,
  VerifyDynamicModuleResult
} from '../definitions'
import { flattened } from '../../utils/array'
import { assertNever } from '../../utils/utils'
import { IsolatedModule, IsolatedProtocol } from '../../types/isolated-modules/IsolatedModule'
import { getOfflineProtocolConfiguration, getOnlineProtocolConfiguration } from '../../utils/modules/load-protocol'

export class IsolatedModules extends WebPlugin implements IsolatedModulesPlugin {
  private readonly offlineProtocols: Record<string, AirGapOfflineProtocol> = {}
  private readonly onlineProtocols: Record<string, AirGapOnlineProtocol> = {}
  private readonly blockExplorers: Record<string, AirGapBlockExplorer> = {}
  private readonly v3SerializerCompanions: Record<string, AirGapV3SerializerCompanion> = {}

  private readonly moduleIndices: Record<string, number> = {}

  constructor(
    private readonly modules: AirGapModule[] = [
      new BitcoinModule(),
      new EthereumModule(),
      new TezosModule(),
      new PolkadotModule(),
      new CosmosModule(),
      new AeternityModule(),
      new GroestlcoinModule(),
      new MoonbeamModule(),
      new AstarModule(),
      new ICPModule(),
      new CoreumModule(),
      new OptimismModule(),
      new AcurastModule()
    ]
  ) {
    super()
  }

  public async previewDynamicModule(_options: PreviewDynamicModuleOptions): Promise<PreviewDynamicModuleResult> {
    throw new Error('Dynamic isolated module preview not supported in a browser')
  }

  public async verifyDynamicModule(_options: VerifyDynamicModuleOptions): Promise<VerifyDynamicModuleResult> {
    throw new Error('Dynamic isolated module verification not supported in a browser')
  }

  public async registerDynamicModule(_options: RegisterDynamicModuleOptions): Promise<void> {
    throw new Error('Dynamic isolated module registration not supported in a browser')
  }

  public async readDynamicModule(_options: ReadDynamicModuleOptions): Promise<ReadDynamicModuleResult> {
    throw new Error('Dynamic isolated module read not supported in a browser')
  }

  public async removeDynamicModules(_options: RemoveDynamicModulesOptions): Promise<void> {
    throw new Error('Dynamic isolated module removal not supported in a browser')
  }

  public async readAssetModule(_options: ReadAssetModuleOptions): Promise<ReadAssetModuleResult> {
    throw new Error('Asset isolated module read not supported in a browser')
  }

  public async loadAllModules(options: LoadAllModulesOptions = {}): Promise<LoadAllModulesResult> {
    const modules: IsolatedModule[] = await Promise.all(
      this.modules.map((module: AirGapModule, index: number) =>
        this.loadModule(module, index, options.protocolType, new Set(options.ignoreProtocols ?? []))
      )
    )

    return { modules }
  }

  private async loadModule(
    module: AirGapModule,
    index: number,
    protocolType: ProtocolConfiguration['type'] | undefined,
    ignoreProtocols: Set<string>
  ): Promise<IsolatedModule> {
    const moduleIdentifier: string = index.toString()
    const v3SerializerCompanion: AirGapV3SerializerCompanion = await module.createV3SerializerCompanion()

    this.v3SerializerCompanions[moduleIdentifier] = v3SerializerCompanion

    const protocols: IsolatedProtocol[][] = await Promise.all(
      Object.entries(module.supportedProtocols)
        .filter(([identifier, _]) => !ignoreProtocols.has(identifier))
        .map(([identifier, configuration]: [string, ProtocolConfiguration]) =>
          this.loadModuleProtocols(module, index, identifier, configuration, protocolType)
        )
    )

    return {
      identifier: moduleIdentifier,
      type: 'static',
      protocols: flattened(protocols),
      v3SchemaConfigurations: v3SerializerCompanion.schemas
    }
  }

  private async loadModuleProtocols(
    module: AirGapModule,
    moduleIndex: number,
    identifier: string,
    configuration: ProtocolConfiguration,
    protocolType?: ProtocolConfiguration['type']
  ): Promise<IsolatedProtocol[]> {
    const offlineConfiguration: OfflineProtocolConfiguration | undefined = getOfflineProtocolConfiguration(configuration, protocolType)
    const onlineConfiguration: OnlineProtocolConfiguration | undefined = getOnlineProtocolConfiguration(configuration, protocolType)

    const [offlineProtocols, onlineProtocols]: [IsolatedProtocol[], IsolatedProtocol[]] = await Promise.all([
      offlineConfiguration ? this.loadOfflineProtocols(module, moduleIndex, identifier, offlineConfiguration) : Promise.resolve([]),
      onlineConfiguration ? this.loadOnlineProtocols(module, moduleIndex, identifier, onlineConfiguration) : Promise.resolve([])
    ])

    return offlineProtocols.concat(onlineProtocols)
  }

  private async loadOfflineProtocols(
    module: AirGapModule,
    moduleIndex: number,
    identifier: string,
    _configuration: OfflineProtocolConfiguration
  ): Promise<IsolatedProtocol[]> {
    const protocol: AirGapOfflineProtocol | undefined = await module.createOfflineProtocol(identifier)
    if (protocol === undefined) {
      return []
    }

    this.moduleIndices[identifier] = moduleIndex
    this.offlineProtocols[this.protocolKey(identifier)] = protocol

    const crypto: CryptoConfiguration = await protocol.getCryptoConfiguration()

    return [await this.getIsolatedProtocolConfiguration(protocol, 'offline', undefined, undefined, crypto)]
  }

  private async loadOnlineProtocols(
    module: AirGapModule,
    moduleIndex: number,
    identifier: string,
    configuration: OnlineProtocolConfiguration
  ): Promise<IsolatedProtocol[]> {
    const protocols: (IsolatedProtocol | undefined)[] = await Promise.all(
      Object.entries(configuration.networks).map(async ([networkId, _]: [string, ProtocolNetwork]) => {
        const [protocol, blockExplorer]: [AirGapOnlineProtocol | undefined, AirGapBlockExplorer | undefined] = await Promise.all([
          module.createOnlineProtocol(identifier, networkId),
          module.createBlockExplorer(identifier, networkId)
        ])
        if (protocol === undefined) {
          return undefined
        }

        this.moduleIndices[identifier] = moduleIndex
        this.onlineProtocols[this.protocolKey(identifier, networkId)] = protocol

        if (blockExplorer !== undefined) {
          this.blockExplorers[this.protocolKey(identifier, networkId)] = blockExplorer
        }

        const [network, blockExplorerMetadata]: [ProtocolNetwork, BlockExplorerMetadata | undefined] = await Promise.all([
          protocol.getNetwork(),
          blockExplorer?.getMetadata() ?? Promise.resolve(undefined)
        ])

        return this.getIsolatedProtocolConfiguration(protocol, 'online', blockExplorerMetadata, network)
      })
    )

    return protocols.filter((protocol: IsolatedProtocol | undefined) => protocol !== undefined)
  }

  private async getIsolatedProtocolConfiguration(
    protocol: AirGapAnyProtocol,
    mode: IsolatedProtocol['mode'],
    blockExplorerMetadata?: BlockExplorerMetadata,
    network?: ProtocolNetwork,
    crypto?: CryptoConfiguration
  ): Promise<IsolatedProtocol> {
    const protocolMetadata: ProtocolMetadata = await protocol.getMetadata()

    const configuration: Omit<IsolatedProtocol, 'type'> = {
      mode,
      identifier: protocolMetadata.identifier,
      protocolMetadata,
      blockExplorerMetadata: blockExplorerMetadata ?? null,
      network: network ?? null,
      methods: this.collectMethods(protocol),
      cachedValues: {
        getCryptoConfiguration: crypto
      }
    }

    if (isSubProtocol(protocol)) {
      const [subType, mainProtocol, contractAddress]: [SubProtocolType, string, string | undefined] = await Promise.all([
        protocol.getType(),
        protocol.mainProtocol(),
        hasConfigurableContract(protocol) ? protocol.getContractAddress() : Promise.resolve(undefined)
      ])

      return {
        ...configuration,
        type: 'sub',
        cachedValues: Object.assign(configuration.cachedValues, {
          getType: subType,
          mainProtocol,
          getContractAddress: contractAddress
        }),
        subType,
        mainProtocolIdentifier: mainProtocol,
        contractAddress: contractAddress ?? null
      }
    } else {
      return {
        ...configuration,
        type: 'main'
      }
    }
  }

  private collectMethods(protocol: AirGapAnyProtocol): string[] {
    let propertyNames: string[] = []
    let obj = protocol
    while (obj) {
      propertyNames = propertyNames.concat(Object.getOwnPropertyNames(obj))
      obj = Object.getPrototypeOf(obj)
    }

    return propertyNames.filter((key: string) => typeof protocol[key] === 'function')
  }

  public async callMethod(options: CallMethodOptions): Promise<CallMethodResult> {
    switch (options.target) {
      case 'offlineProtocol':
        return this.callOfflineProtocolMethod(options)
      case 'onlineProtocol':
        return this.callOnlineProtocolMethod(options)
      case 'blockExplorer':
        return this.callBlockExplorerMethod(options)
      case 'v3SerializerCompanion':
        return this.callV3SerializerCompanionMethod(options)
      default:
        assertNever('options', options)
    }
  }

  private async callOfflineProtocolMethod(options: OfflineProtocolCallMethodOptions): Promise<CallMethodResult> {
    const protocol: AirGapOfflineProtocol = await this.getOfflineProtocol(options.protocolIdentifier)
    const method = protocol[options.method].bind(protocol)

    return { value: await method(...(options.args ?? [])) }
  }

  private async callOnlineProtocolMethod(options: OnlineProtocolCallMethodOptions): Promise<CallMethodResult> {
    const protocol: AirGapOnlineProtocol = await this.getOnlineProtocol(options.protocolIdentifier, options.networkId)
    const method = protocol[options.method].bind(protocol)

    return { value: await method(...(options.args ?? [])) }
  }

  private async callBlockExplorerMethod(options: BlockExplorerCallMethodOptions): Promise<CallMethodResult> {
    const blockExplorer: AirGapBlockExplorer = await this.getBlockExplorer(options.protocolIdentifier, options.networkId)
    const method = blockExplorer[options.method].bind(blockExplorer)

    return { value: await method(...(options.args ?? [])) }
  }

  private async callV3SerializerCompanionMethod(options: V3SerializerCompanionCallMethodOptions): Promise<CallMethodResult> {
    const v3SerializerCompanion: AirGapV3SerializerCompanion = await this.getV3SerializerCompanion(options.moduleIdentifier)
    const method = v3SerializerCompanion[options.method].bind(v3SerializerCompanion)

    return { value: await method(...(options.args ?? [])) }
  }

  private async getOfflineProtocol(protocolIdentifier: string): Promise<AirGapOfflineProtocol | undefined> {
    return this.getModuleComponent(
      protocolIdentifier,
      undefined,
      this.offlineProtocols,
      (module: AirGapModule) => module.createOfflineProtocol(protocolIdentifier),
      (identifier: string) => this.moduleIndices[identifier]
    )
  }

  private async getOnlineProtocol(protocolIdentifier: string, networkId?: string): Promise<AirGapOnlineProtocol | undefined> {
    return this.getModuleComponent(
      protocolIdentifier,
      networkId,
      this.onlineProtocols,
      (module: AirGapModule) => module.createOnlineProtocol(protocolIdentifier, networkId),
      (identifier: string) => this.moduleIndices[identifier]
    )
  }

  private async getBlockExplorer(protocolIdentifier: string, networkId?: string): Promise<AirGapBlockExplorer | undefined> {
    return this.getModuleComponent(
      protocolIdentifier,
      networkId,
      this.blockExplorers,
      (module: AirGapModule) => module.createBlockExplorer(protocolIdentifier, networkId),
      (identifier: string) => this.moduleIndices[identifier]
    )
  }

  private async getV3SerializerCompanion(moduleIdentifier: string): Promise<AirGapV3SerializerCompanion | undefined> {
    return this.getModuleComponent(
      moduleIdentifier,
      undefined,
      this.v3SerializerCompanions,
      (module: AirGapModule) => module.createV3SerializerCompanion(),
      (identifier: string) => parseInt(identifier, 10)
    )
  }

  private async getModuleComponent<T>(
    identifier: string,
    networkId: string | undefined,
    componentCollection: Record<string, T>,
    createComponent: (module: AirGapModule) => Promise<T | undefined>,
    identifierToModuleIndex: (id: string) => number | undefined
  ): Promise<T | undefined> {
    const protocolKey: string = this.protocolKey(identifier, networkId)
    if (componentCollection[protocolKey] === undefined) {
      const moduleIndex: number | undefined = identifierToModuleIndex(identifier)
      if (moduleIndex === undefined) {
        return undefined
      }

      componentCollection[protocolKey] = await createComponent(this.modules[moduleIndex])
    }

    return componentCollection[protocolKey]
  }

  public async batchCallMethod(options: BatchCallMethodOptions): Promise<BatchCallMethodResult> {
    const values: BatchCallMethodSingleResult[] = await Promise.all(
      options.options.map(async (o: CallMethodOptions): Promise<BatchCallMethodSingleResult> => {
        try {
          const { value } = await this.callMethod(o)

          return { type: 'success', value }
        } catch (error) {
          return { type: 'error', error }
        }
      })
    )

    return { values }
  }

  private protocolKey(identifier: string, networkId?: string): string {
    return networkId ? `${identifier}_${networkId}` : identifier
  }
}
