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
export abstract class IACMessageHandler<T> {
  abstract name: string

  abstract canHandle(data: string): Promise<boolean>

  abstract receive(data: string): Promise<IACHandlerStatus> // internally store

  abstract handleComplete(): Promise<T> // handle complete

  abstract getProgress(): Promise<number>

  abstract getResult(): Promise<T | undefined>

  abstract getDataSingle(): Promise<T | string | undefined>

  abstract reset(): Promise<void>
}
