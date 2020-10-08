export abstract class IACMessageHandler {
  abstract name: string

  abstract handle(data: string | string[]): Promise<boolean>
}
