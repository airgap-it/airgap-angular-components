import { CallMethodOptions, CallMethodResult, IsolatedModulesPlugin } from '../../capacitor-plugins/definitions'

const UNDEFINED_STRING: string = 'it.airgap.vault.__UNDEFINED__'

export abstract class IsolatedBase<I> {
  constructor(protected readonly isolatedModulesPlugin: IsolatedModulesPlugin, methods: string[] = []) {
    this.extendWithMethods(methods)
  }

  protected abstract createCallOptions(method: string, args: unknown[] | undefined): Promise<CallMethodOptions>

  protected async callMethod<T, K extends string = keyof I extends string ? keyof I : string>(name: K, args?: unknown[]): Promise<T> {
    const { value }: CallMethodResult = await this.isolatedModulesPlugin.callMethod(await this.createCallOptions(name, args))

    return value as T
  }

  private extendWithMethods(methods: string[]) {
    for (const method of methods) {
      if (this[method] === undefined) {
        this[method] = (...args) => {
          return this.callMethod<any, string>(
            method,
            args
          )
        }
      }
    }
  }
}
