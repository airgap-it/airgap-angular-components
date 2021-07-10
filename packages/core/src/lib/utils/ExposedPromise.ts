/* eslint-disable max-classes-per-file */

export enum ExposedPromiseStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  REJECTED = 'rejected'
}

type Resolve<T> = (value: T | PromiseLike<T>) => void
type Reject<U> = (reason?: U) => void

const notInitialized = (): never => {
  throw new Error('ExposedPromise not initialized yet.')
}

export class ExposedPromise<T = unknown, U = unknown> {
  private readonly _promise: Promise<T>

  private _resolve: Resolve<T> = notInitialized
  private _reject: Reject<U> = notInitialized
  private _status: ExposedPromiseStatus = ExposedPromiseStatus.PENDING
  private _promiseResult: T | PromiseLike<T> | undefined
  private _promiseError: U | undefined

  public get promise(): Promise<T> {
    return this._promise
  }

  public get resolve(): Resolve<T> {
    return this._resolve
  }
  public get reject(): Reject<U> {
    return this._reject
  }
  public get status(): ExposedPromiseStatus {
    return this._status
  }
  public get promiseResult(): T | PromiseLike<T> | undefined {
    return this._promiseResult
  }
  public get promiseError(): U | undefined {
    return this._promiseError
  }

  constructor() {
    this._promise = new Promise<T>((innerResolve: Resolve<T>, innerReject: Reject<U>): void => {
      this._resolve = (value: T | PromiseLike<T>): void => {
        if (this.isSettled()) {
          return
        }

        this._promiseResult = value

        innerResolve(value)

        this._status = ExposedPromiseStatus.RESOLVED

        return
      }
      this._reject = (reason?: U): void => {
        if (this.isSettled()) {
          return
        }

        this._promiseError = reason

        innerReject(reason)

        this._status = ExposedPromiseStatus.REJECTED

        return
      }
    })
  }

  public static resolve<T>(value: T): ExposedPromise<T> {
    const promise = new ExposedPromise<T>()
    promise.resolve(value)

    return promise
  }

  public static reject<T = never, U = unknown>(reason?: U): ExposedPromise<T, U> {
    const promise = new ExposedPromise<T, U>()
    promise.reject(reason)

    return promise
  }

  public isPending(): boolean {
    return this.status === ExposedPromiseStatus.PENDING
  }

  public isResolved(): boolean {
    return this.status === ExposedPromiseStatus.RESOLVED
  }

  public isRejected(): boolean {
    return this.status === ExposedPromiseStatus.REJECTED
  }

  public isSettled(): boolean {
    return this.isResolved() || this.isRejected()
  }
}

type ResolveTypes<K extends string> = Record<K, unknown>
type RejectTypes<K extends string> = Record<K, unknown> | unknown
type Error<K extends string, E extends RejectTypes<K>> = E extends Record<K, unknown> ? E[K] : unknown
export class ExposedPromiseRegistry<
  Key extends string,
  ResolveType extends ResolveTypes<Key>,
  RejectType extends RejectTypes<Key> = unknown
> {
  private readonly exposedPromises: { [key in Key]?: ExposedPromise<ResolveType[key], Error<key, RejectType>> } = {}

  public resolve<K extends Key>(key: K, value: ResolveType[K]): void {
    this.getIfNotSettled(key)?.resolve(value)
  }

  public reject<K extends Key>(key: K, error: Error<K, RejectType>): void {
    this.getIfNotSettled(key)?.reject(error)
  }

  public async yield<K extends Key>(key: K): Promise<ResolveType[K]> {
    const exposedPromise: ExposedPromise<ResolveType[K], Error<K, RejectType>> = new ExposedPromise()
    this.exposedPromises[key] = exposedPromise

    const value: ResolveType[K] = await exposedPromise.promise
    this.exposedPromises[key] = undefined

    return value
  }

  private getIfNotSettled<K extends Key>(key: K): ExposedPromise<ResolveType[K], Error<K, RejectType>> | undefined {
    const promise: ExposedPromise<ResolveType[K], Error<K, RejectType>> | undefined = this.exposedPromises[key]
    if (promise?.isSettled()) {
      throw new Error('Promise is already settled')
    }

    return promise
  }
}
