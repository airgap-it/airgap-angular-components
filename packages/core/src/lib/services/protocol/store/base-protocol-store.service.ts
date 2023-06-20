import { ProtocolNetwork } from '@airgap/coinlib-core'
import { Injectable } from '@angular/core'
import { createNotInitialized } from '../../../utils/not-initialized'

export interface BaseProtocolStoreConfig<T> {
  passiveProtocols: T
  activeProtocols: T
}

@Injectable()
export abstract class BaseProtocolStoreService<
  ICoinType = unknown,
  SymbolType = unknown,
  CollectionType = unknown,
  ConfigType = BaseProtocolStoreConfig<CollectionType>
> {
  protected _supportedProtocols: Promise<CollectionType | undefined>

  protected _passiveProtocols: CollectionType | undefined
  protected _activeProtocols: CollectionType | undefined

  protected notInitialized: () => never

  constructor(private readonly _tag: string = '_ProtocolService') {
    this.notInitialized = createNotInitialized(this._tag, 'Call `init` first.')
  }

  public get isInitialized(): boolean {
    return this._passiveProtocols !== undefined && this._activeProtocols !== undefined
  }

  public get supportedProtocols(): Promise<CollectionType> {
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

  public async addActiveProtocols(protocols: CollectionType): Promise<void> {
    const activeProtocols: CollectionType = this._activeProtocols ?? this.notInitialized()
    this._activeProtocols = await this.mergeProtocols(protocols, activeProtocols)
  }

  public async init(config: ConfigType): Promise<void> {
    if (this.isInitialized) {
      // eslint-disable-next-line no-console
      console.log(`[${this._tag}] already initialized`)

      return
    }

    const transformedConfig: BaseProtocolStoreConfig<CollectionType> = await this.transformConfig(config)

    this._passiveProtocols = transformedConfig.passiveProtocols
    this._activeProtocols = transformedConfig.activeProtocols

    await this.removeProtocolDuplicates()
  }

  public abstract removeProtocols(identifiers: SymbolType[]): Promise<void>

  public abstract isIdentifierValid(identifier: string): boolean

  public abstract getProtocolByIdentifier(
    identifier: SymbolType,
    network?: ProtocolNetwork | string,
    activeOnly?: boolean
  ): Promise<ICoinType | undefined>
  public abstract getNetworksForProtocol(identifier: SymbolType, activeOnly?: boolean): Promise<ProtocolNetwork[]>

  protected abstract transformConfig(config: ConfigType): Promise<BaseProtocolStoreConfig<CollectionType>>
  protected abstract mergeProtocols(protocols1: CollectionType, protocols2: CollectionType | undefined): Promise<CollectionType>

  protected abstract removeProtocolDuplicates(): Promise<void>
}
