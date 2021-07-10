import { IACHandlerStatus, IACMessageHandler } from './message-handler'

/**
 * Handles requests that can only be in a single QR
 */
export abstract class IACSinglePartHandler<T> extends IACMessageHandler<T> {
  protected payload: T | undefined

  constructor() {
    super()
  }

  public async canHandle(data: string): Promise<boolean> {
    const processed = await this.processData(data)
    if (processed) {
      return true
    } else {
      return false
    }
  }

  public async receive(data: string): Promise<IACHandlerStatus> {
    const processed = await this.processData(data)

    if (!processed) {
      return IACHandlerStatus.UNSUPPORTED
    }

    this.payload = processed

    return IACHandlerStatus.SUCCESS
  }

  public async getProgress(): Promise<number> {
    return 1
  }

  public async getResult(): Promise<T | undefined> {
    return this.payload
  }

  public async getDataSingle(): Promise<T | undefined> {
    return this.getResult()
  }

  public async reset(): Promise<void> {
    this.payload = undefined

    return
  }

  abstract processData(data: string): Promise<T | undefined>
}
