import { Platform } from '@ionic/angular'
import {
  BatchCallMethodOptions,
  BatchCallMethodResult,
  BatchCallMethodSingleResult,
  CallMethodOptions,
  CallMethodResult,
  IsolatedModulesPlugin,
  LoadAllModulesOptions,
  LoadAllModulesResult,
  PreviewDynamicModuleOptions,
  PreviewDynamicModuleResult,
  ReadDynamicModuleOptions,
  ReadDynamicModuleResult,
  RegisterDynamicModuleOptions,
  RemoveDynamicModulesOptions,
  VerifyDynamicModuleOptions,
  VerifyDynamicModuleResult
} from '../definitions'

const UNDEFINED_STRING = 'it.airgap.__UNDEFINED__'

export class IsolatedModulesPluginWrapper implements IsolatedModulesPlugin {
  private readonly isMobile: boolean

  constructor(private readonly plugin: IsolatedModulesPlugin, platform: Platform) {
    this.isMobile = platform.is('hybrid')
  }

  public async previewDynamicModule(options: PreviewDynamicModuleOptions): Promise<PreviewDynamicModuleResult> {
    return this.plugin.previewDynamicModule(options)
  }

  public async verifyDynamicModule(options: VerifyDynamicModuleOptions): Promise<VerifyDynamicModuleResult> {
    return this.plugin.verifyDynamicModule(options)
  }

  public async registerDynamicModule(options: RegisterDynamicModuleOptions): Promise<void> {
    return this.plugin.registerDynamicModule(options)
  }

  public async readDynamicModule(options: ReadDynamicModuleOptions): Promise<ReadDynamicModuleResult> {
    return this.plugin.readDynamicModule(options)
  }

  public async removeDynamicModules(options?: RemoveDynamicModulesOptions): Promise<void> {
    return this.plugin.removeDynamicModules(options)
  }

  public async loadAllModules(options?: LoadAllModulesOptions): Promise<LoadAllModulesResult> {
    return this.plugin.loadAllModules(options)
  }

  private batchedCalls: CallMethodOptions[] = []
  private batchedCallsPromise: Promise<BatchCallMethodSingleResult[]> | undefined = undefined
  public async callMethod<T = unknown>(options: CallMethodOptions<T>): Promise<CallMethodResult> {
    const newLength = this.batchedCalls.push(options)
    const index = newLength - 1
    if (this.batchedCallsPromise === undefined) {
      this.batchedCallsPromise = new Promise<BatchCallMethodSingleResult[]>((resolve, reject) => {
        setTimeout(() => {
          this.batchCallMethod({ options: this.batchedCalls })
            .then(({ values }) => resolve(values))
            .catch(reject)

          this.batchedCalls = []
          this.batchedCallsPromise = undefined
        }, 100)
      })
    }
    const promise = this.batchedCallsPromise

    const singleResult: BatchCallMethodSingleResult = (await promise)[index]
    if (singleResult.type === 'success') {
      return { value: singleResult.value }
    } else {
      throw singleResult.error
    }
  }

  public async batchCallMethod(options: BatchCallMethodOptions): Promise<BatchCallMethodResult> {
    const newOptions: BatchCallMethodOptions = this.isMobile ? this.replaceUndefined(options) : options

    return this.plugin.batchCallMethod(newOptions)
  }

  private replaceUndefined<T>(value: T): T {
    if (Array.isArray(value)) {
      return value.map((v) => this.replaceUndefined(v)) as any as T
    }

    if (typeof value === 'object' && typeof value !== 'undefined' && value !== null) {
      return Object.entries(value).reduce((obj, [k, v]) => Object.assign(obj, { [k]: this.replaceUndefined(v) }), {} as T)
    }

    return (typeof value === 'undefined' ? UNDEFINED_STRING : value) as T
  }
}
