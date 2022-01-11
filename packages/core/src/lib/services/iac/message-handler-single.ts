import { IACHandlerStatus, IACMessageHandler, IACMessageWrapper } from './message-handler'

/**
 * Handles requests that can only be in a single QR
 */
export abstract class IACSinglePartHandler<T> extends IACMessageHandler<T> {
  protected payload: T | undefined
  protected rawData: string | undefined

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

    this.rawData = data
    this.payload = processed

    return IACHandlerStatus.SUCCESS
  }

  public async getProgress(): Promise<number> {
    return 1
  }

  public async getResult(): Promise<IACMessageWrapper<T> | undefined> {
    return { result: this.payload, data: await this.getDataSingle() }
  }

  public async getDataSingle(): Promise<string> {
    return this.rawData
  }

  public async reset(): Promise<void> {
    this.payload = undefined

    return
  }

  abstract processData(data: string): Promise<T | undefined>
}
