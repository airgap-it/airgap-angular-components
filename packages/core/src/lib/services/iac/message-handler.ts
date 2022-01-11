export enum IACMessageTransport {
  QR_SCANNER = 'QR_SCANNER',
  DEEPLINK = 'DEEPLINK',
  PASTE = 'CLIPBOARD'
}
export enum IACHandlerStatus {
  SUCCESS = 0,
  PARTIAL = 1,
  UNSUPPORTED = 2
}

export interface IACContext {
  requestId?: string
  derivationPath?: string
  sourceFingerprint?: string
}

export interface IACMessageWrapper<T> {
  result: T
  data: string
  // TODO: Instead of this, create an internal message for every protocol/message that can contain additional data, which is not in the serializer messages.
  context?: IACContext
}

export abstract class IACMessageHandler<T> {
  abstract name: string

  abstract canHandle(data: string): Promise<boolean>

  abstract receive(data: string): Promise<IACHandlerStatus> // internally store

  abstract handleComplete(): Promise<IACMessageWrapper<T>> // handle complete

  abstract getProgress(): Promise<number>

  abstract getResult(): Promise<IACMessageWrapper<T> | undefined>

  abstract getDataSingle(): Promise<string | undefined>

  abstract reset(): Promise<void>
}
