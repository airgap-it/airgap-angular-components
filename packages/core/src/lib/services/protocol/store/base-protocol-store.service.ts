import { ProtocolNetwork } from '@airgap/coinlib-core'
import { createNotInitialized } from '../../../utils/not-initialized'

export interface BaseProtocolStoreConfig<T> {
  passiveProtocols: T
  activeProtocols: T
}

export abstract class BaseProtocolStoreService<
  ICoinType = unknown,
  SymbolType = unknown,
  CollectionType = unknown,
  ConfigType = BaseProtocolStoreConfig<CollectionType>
> {
  protected _supportedProtocols: CollectionType | undefined

  protected _passiveProtocols: CollectionType | undefined
  protected _activeProtocols: CollectionType | undefined

  protected notInitialized: () => never

  constructor(private readonly _tag: string = '_ProtocolService') {
    this.notInitialized = createNotInitialized(this._tag, 'Call `init` first.')
  }

  public get isInitialized(): boolean {
    return this._passiveProtocols !== undefined && this._activeProtocols !== undefined
  }

  public get supportedProtocols(): CollectionType {
    if (this._supportedProtocols === undefined) {
      const passiveProtocols: CollectionType = this._passiveProtocols ?? this.notInitialized()
      const activeProtocols: CollectionType = this._activeProtocols ?? this.notInitialized()

      this._supportedProtocols = this.mergeProtocols(passiveProtocols, activeProtocols)
    }

    return this._supportedProtocols
  }

  public get passiveProtocols(): CollectionType {
    return this._passiveProtocols ?? this.notInitialized()
  }

  public get activeProtocols(): CollectionType {
    return this._activeProtocols ?? this.notInitialized()
  }

  public init(config: ConfigType): void {
    if (this.isInitialized) {
      // eslint-disable-next-line no-console
      console.log(`[${this._tag}] already initialized`)

      return
    }

    const transformedConfig = this.transformConfig(config)

    this._passiveProtocols = transformedConfig.passiveProtocols
    this._activeProtocols = transformedConfig.activeProtocols

    this.removeProtocolDuplicates()
  }

  public abstract isIdentifierValid(identifier: string): boolean

  public abstract getProtocolByIdentifier(identifier: SymbolType, network?: ProtocolNetwork | string, activeOnly?: boolean): ICoinType | undefined
  public abstract getNetworksForProtocol(identifier: SymbolType, activeOnly?: boolean): ProtocolNetwork[]

  protected abstract transformConfig(config: ConfigType): BaseProtocolStoreConfig<CollectionType>
  protected abstract mergeProtocols(protocols1: CollectionType, protocols2: CollectionType | undefined): CollectionType

  protected abstract removeProtocolDuplicates(): void
}
