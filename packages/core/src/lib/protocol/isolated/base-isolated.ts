import { CallMethodOptions, CallMethodResult, IsolatedModulesPlugin } from '../../capacitor-plugins/definitions'

export abstract class IsolatedBase<I> {
  constructor(
    protected readonly isolatedModulesPlugin: IsolatedModulesPlugin,
    methods: string[] = [],
    protected readonly cachedValues: Record<string, unknown> = {}
  ) {
    this.extendWithMethods(methods)
  }

  protected abstract createCallOptions(method: string, args: unknown[] | undefined): Promise<CallMethodOptions>

  protected async callMethod<T, K extends string = keyof I extends string ? keyof I : string>(name: K, args?: unknown[]): Promise<T> {
    if (name in this.cachedValues) {
      return this.cachedValues[name] as T
    }

    const { value }: CallMethodResult = await this.isolatedModulesPlugin.callMethod(await this.createCallOptions(name, args))

    return value as T
  }

  private extendWithMethods(methods: string[]) {
    for (const method of methods) {
      if (this[method] === undefined) {
        this[method] = (...args) => {
          return this.callMethod<any, string>(method, args)
        }
      }
    }
  }
}
