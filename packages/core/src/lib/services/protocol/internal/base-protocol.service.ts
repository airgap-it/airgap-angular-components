import { createNotInitialized } from '../../../utils/not-initialized'

export interface BaseProtocolServiceConfig<T> {
  passiveProtocols?: T
  activeProtocols?: T

  extraPassiveProtocols?: T
  extraActiveProtocols?: T
}

export abstract class BaseProtocolService<T, C = BaseProtocolServiceConfig<T>> {
  protected _supportedProtocols: T | undefined
  
  protected _passiveProtocols: T | undefined
  protected _activeProtocols: T | undefined
  
  protected notInitialized: () => never

  constructor(private readonly _tag: string = '_ProtocolService') {
    this.notInitialized = createNotInitialized(this._tag, 'Call `init` first.')
  }

  public get isInitialized(): boolean {
    return this._passiveProtocols !== undefined && this._activeProtocols !== undefined
  }

  public get supportedProtocols(): T {
    if (this._supportedProtocols === undefined) {
      const passiveProtocols: T = this._passiveProtocols ?? this.notInitialized()
      const activeProtocols: T = this._activeProtocols ?? this.notInitialized()

      this._supportedProtocols = this.mergeProtocols(passiveProtocols, activeProtocols)
    }

    return this._supportedProtocols
  }

  public get passiveProtocols(): T {
    return this._passiveProtocols ?? this.notInitialized()
  }

  public get activeProtocols(): T {
    return this._activeProtocols ?? this.notInitialized()
  }

  public init(config?: C): void {
    if (this.isInitialized) {
      // eslint-disable-next-line no-console
      console.log(`[${this._tag}] already initialized`)

      return
    }

    const transformedConfig = config !== undefined ? this.transformConfig(config) : undefined

    this._passiveProtocols = transformedConfig?.passiveProtocols ?? this.getDefaultPassiveProtocols()
    this._activeProtocols = transformedConfig?.activeProtocols ?? this.getDefaultActiveProtocols()

    if (transformedConfig?.extraPassiveProtocols !== undefined) {
      this._passiveProtocols = this.mergeProtocols(this._passiveProtocols, transformedConfig?.extraPassiveProtocols)
    }

    if (transformedConfig?.extraActiveProtocols !== undefined) {
      this._activeProtocols = this.mergeProtocols(this._activeProtocols, transformedConfig?.extraActiveProtocols)
    }

    this.removeProtocolDuplicates()
  }

  protected abstract transformConfig(config: C): BaseProtocolServiceConfig<T>
  protected abstract mergeProtocols(protocols1: T, protocols2: T | undefined): T

  protected abstract getDefaultPassiveProtocols(): T
  protected abstract getDefaultActiveProtocols(): T

  protected abstract removeProtocolDuplicates(): void
}