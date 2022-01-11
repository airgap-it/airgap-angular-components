import { IACMessageDefinitionObjectV3, IACMessageType } from '@airgap/coinlib-core'
import { UiEventElementsService } from '../ui-event-elements/ui-event-elements.service'
import { ClipboardService } from '../clipboard/clipboard.service'
import { IACMessageHandler, IACMessageTransport, IACHandlerStatus, IACMessageWrapper } from './message-handler'
import { SerializerV3Generator } from '../qr/qr-generators/serializer-v3-generator'
import { SerializerV3Handler } from '../qr/qr-handler/serializer-v3-handler'
import { SerializerV2Handler } from '../qr/qr-handler/serializer-v2-handler'
import { DeeplinkService } from '../deeplink/deeplink.service'
import { AppConfig, APP_CONFIG } from '../../config/app-config'
import { Inject } from '@angular/core'

export type ScanAgainCallback = (progress?: number) => void

export type RelayMessage = string

export abstract class BaseIACService {
  protected readonly handlers: IACMessageHandler<unknown>[]
  private transport: IACMessageTransport | undefined = undefined
  private scanAgainCallback: ScanAgainCallback | undefined = undefined

  protected readonly serializerMessageHandlers: {
    [key in IACMessageType]: (
      deserializedSync: IACMessageWrapper<IACMessageDefinitionObjectV3[]>,
      transport: IACMessageTransport,
      scanAgainCallback: ScanAgainCallback
    ) => Promise<boolean>
  }

  constructor(
    protected readonly uiEventElementService: UiEventElementsService,
    protected readonly clipboard: ClipboardService,
    protected readonly isReady: Promise<void>,
    protected readonly customHandlers: IACMessageHandler<unknown>[],
    protected readonly deeplinkService: DeeplinkService,
    @Inject(APP_CONFIG) protected readonly appConfig: AppConfig
  ) {
    this.serializerMessageHandlers = {
      [IACMessageType.AccountShareRequest]: this.syncTypeNotSupportedAlert.bind(this),
      [IACMessageType.AccountShareResponse]: this.syncTypeNotSupportedAlert.bind(this),
      [IACMessageType.TransactionSignRequest]: this.syncTypeNotSupportedAlert.bind(this),
      [IACMessageType.TransactionSignResponse]: this.syncTypeNotSupportedAlert.bind(this),
      [IACMessageType.MessageSignRequest]: this.syncTypeNotSupportedAlert.bind(this),
      [IACMessageType.MessageSignResponse]: this.syncTypeNotSupportedAlert.bind(this)
    }

    this.handlers = [
      new SerializerV3Handler((deserializedSync: IACMessageWrapper<IACMessageDefinitionObjectV3[]>) => this.deserialize(deserializedSync)),
      new SerializerV2Handler((deserializedSync: IACMessageWrapper<IACMessageDefinitionObjectV3[]>) => this.deserialize(deserializedSync))
    ]

    this.handlers.push(...customHandlers)
  }

  public async storeResult(
    message: IACMessageWrapper<unknown>,
    status: IACHandlerStatus,
    transport: IACMessageTransport
  ): Promise<IACHandlerStatus> {
    console.debug('STORE_RESULT', message, status, transport)
    return status
  }

  // check if we already have part, scanning same QR advances progress bar

  public async handleRequest(
    data: string,
    transport: IACMessageTransport,
    scanAgainCallback: ScanAgainCallback = (): void => undefined
  ): Promise<IACHandlerStatus> {
    this.transport = transport
    this.scanAgainCallback = scanAgainCallback
    await this.isReady
    for (let i = 0; i < this.handlers.length; i++) {
      const handler = this.handlers[i]
      try {
        const canHandle = await handler.canHandle(data)
        if (canHandle) {
          const handlerStatus: IACHandlerStatus = await handler.receive(data)
          if (handlerStatus === IACHandlerStatus.SUCCESS) {
            try {
              const result: IACMessageWrapper<unknown> = await handler.getResult()
              const status: IACHandlerStatus = IACHandlerStatus.SUCCESS
              await handler.handleComplete()
              await this.resetHandlers()
              return this.storeResult(result, status, transport)
            } catch (e) {
              console.error('Error while handling result', e)
              let dataSingle: string = (await handler.getDataSingle()) ?? data

              await this.messageUnknownAlert(dataSingle, this.scanAgainCallback!)
              await this.resetHandlers()
              return this.storeResult({ result: undefined, data: dataSingle }, IACHandlerStatus.UNSUPPORTED, transport)
            }
          } else if (handlerStatus === IACHandlerStatus.PARTIAL) {
            scanAgainCallback(await handler.getProgress())
            return this.storeResult({ result: data, data: await handler.getDataSingle() }, IACHandlerStatus.PARTIAL, transport)
          }
        }
      } catch (handlerError) {
        console.log(`Error while handling message in ${handler.name}`, handlerError)
      }
    }
    await this.resetHandlers()

    await this.messageUnknownAlert(data, this.scanAgainCallback!)
    return this.storeResult({ result: undefined, data: data }, IACHandlerStatus.UNSUPPORTED, this.transport)
  }

  public async resetHandlers(): Promise<void> {
    await Promise.all(
      this.handlers.map((handler) => {
        handler.reset()
      })
    )
  }

  private async deserialize(deserializedSync: IACMessageWrapper<IACMessageDefinitionObjectV3[]>): Promise<IACHandlerStatus> {
    const data = deserializedSync.result
    if (data && data.length > 0) {
      const groupedByType: { [key in IACMessageType]?: IACMessageDefinitionObjectV3[] } = data.reduce(
        (grouped, message) => Object.assign(grouped, { [message.type]: (grouped[message.type] || []).concat(message) }),
        {} as { [key in IACMessageType]?: IACMessageDefinitionObjectV3[] }
      )

      for (const type in groupedByType) {
        if (type in IACMessageType) {
          // TODO: Improve types
          const typedType: IACMessageType = parseInt(type, 10)
          // eslint-disable-next-line no-console
          this.serializerMessageHandlers[typedType](
            { result: groupedByType[typedType] ?? [], data: deserializedSync.data, context: deserializedSync.context },
            this.transport!,
            this.scanAgainCallback!
          ).catch(console.error)
        } else {
          // TODO: Improve types
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-console
          this.syncTypeNotSupportedAlert(deserializedSync, this.transport!, this.scanAgainCallback!).catch(console.error)

          return IACHandlerStatus.UNSUPPORTED
        }
      }
      return IACHandlerStatus.SUCCESS
    } else {
      throw new Error('Empty message received!')
    }
  }

  protected async messageUnknownAlert(data: string, scanAgainCallback: ScanAgainCallback): Promise<void> {
    const relayHandler = () => {
      // eslint-disable-next-line no-console
      this.relay(data).catch(console.error)
    }

    const copyHandler = () => {
      // eslint-disable-next-line no-console
      this.clipboard.copyAndShowToast(data).catch(console.error)
    }

    const cancelHandler = () => {
      scanAgainCallback()
    }

    // eslint-disable-next-line no-console
    this.uiEventElementService.showIACMessageUnknownAlert(relayHandler, copyHandler, cancelHandler).catch(console.error)
  }

  protected async syncTypeNotSupportedAlert(
    messageWrapper: IACMessageWrapper<IACMessageDefinitionObjectV3[]>,
    _transport: IACMessageTransport,
    scanAgainCallback: ScanAgainCallback
  ): Promise<boolean> {
    const relayHandler = () => {
      // eslint-disable-next-line no-console
      this.relay(messageWrapper.data).catch(console.error)
    }

    const copyHandler = () => {
      // eslint-disable-next-line no-console
      this.clipboard.copyAndShowToast(messageWrapper.data).catch(console.error)
    }

    const cancelHandler = () => {
      scanAgainCallback()
    }

    // eslint-disable-next-line no-console
    this.uiEventElementService.showIACMessageNotSupportedAlert(relayHandler, copyHandler, cancelHandler).catch(console.error)

    return false
  }

  private async serialize(messageDefinitionObject: IACMessageDefinitionObjectV3[], prefix: string): Promise<string> {
    const generator = new SerializerV3Generator()
    await generator.create(messageDefinitionObject, 100, 100)

    return generator.getSingle(prefix)
  }

  /**
   * This method should relay the message to the other app. The app is responsibe
   * for navigating away from the scanner because scanning will not be resumed.
   *
   * @param data The data that will be relayed
   */
  public abstract relay(data: RelayMessage): Promise<void>
}
