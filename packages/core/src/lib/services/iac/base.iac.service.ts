import { IACMessageDefinitionObject, IACMessageType } from 'airgap-coin-lib'

import { SerializerService } from '../serializer/serializer.service'
import { to } from '../../utils/utils'
// import { ErrorCategory, handleErrorLocal } from '../error-handler/error-handler.service'
import { UiEventService } from '../ui-event/ui-event.service'
import { IACMessageHandler } from './message-handler'

export enum IACMessageTransport {
  QR_SCANNER = 'QR_SCANNER',
  DEEPLINK = 'DEEPLINK',
  PASTE = 'PASTE'
}

export enum IACHanderStatus {
  SUCCESS = 0,
  PARTIAL = 1,
  ERROR = 2
}

type ScanAgainCallback = (scanResult?: Error | { currentPage: number; totalPageNumber: number }) => void

export abstract class BaseIACService {
  protected readonly serializerMessageHandlers: {
    [key in IACMessageType]: (
      data: string | string[],
      deserializedSync: IACMessageDefinitionObject[],
      scanAgainCallback: ScanAgainCallback
    ) => Promise<boolean>
  }

  constructor(
    protected readonly uiEventService: UiEventService,
    protected readonly serializerService: SerializerService,
    protected readonly isReady: Promise<void>,
    protected readonly customHandlers: IACMessageHandler[]
  ) {
    this.serializerMessageHandlers = {
      [IACMessageType.MetadataRequest]: this.syncTypeNotSupportedAlert.bind(this),
      [IACMessageType.MetadataResponse]: this.syncTypeNotSupportedAlert.bind(this),
      [IACMessageType.AccountShareRequest]: this.syncTypeNotSupportedAlert.bind(this),
      [IACMessageType.AccountShareResponse]: this.syncTypeNotSupportedAlert.bind(this),
      [IACMessageType.TransactionSignRequest]: this.syncTypeNotSupportedAlert.bind(this),
      [IACMessageType.TransactionSignResponse]: this.syncTypeNotSupportedAlert.bind(this),
      [IACMessageType.MessageSignRequest]: this.syncTypeNotSupportedAlert.bind(this),
      [IACMessageType.MessageSignResponse]: this.syncTypeNotSupportedAlert.bind(this)
    }
  }

  public async storeResult(
    _message: string | string[],
    status: IACHanderStatus,
    _transport: IACMessageTransport
  ): Promise<IACHanderStatus> {
    return status
  }

  public async handleRequest(
    data: string | string[],
    transport: IACMessageTransport,
    scanAgainCallback: ScanAgainCallback = (): void => undefined
  ): Promise<IACHanderStatus> {
    // Waiting for everything to be ready
    await this.isReady

    // Try to handle requests with custom handlers (eg. beacon, walletconnect, addresses, etc.)
    for (let i = 0; i < this.customHandlers.length; i++) {
      try {
        const handlerResult: boolean = await this.customHandlers[i].handle(data)

        if (handlerResult) {
          return this.storeResult(data, IACHanderStatus.SUCCESS, transport)
        }
      } catch (handlerError) {
        console.log(`Error while handling ${this.customHandlers[i].name}`, handlerError)
      }
    }

    // Deserialize the message
    const [error, deserializedSync]: [Error | null, IACMessageDefinitionObject[] | undefined] = await to(
      this.serializerService.deserialize(data)
    )

    // TODO: Check if we have partial result
    if (error && !error.message) {
      scanAgainCallback(error)

      return this.storeResult(data, IACHanderStatus.PARTIAL, transport)
    } else if (error && error.message) {
      console.warn('Deserialization of sync failed', error)
      // TODO: Log error locally

      return this.storeResult(data, IACHanderStatus.ERROR, transport)
    }

    if (deserializedSync && deserializedSync.length > 0) {
      const groupedByType: { [key in IACMessageType]?: IACMessageDefinitionObject[] } = deserializedSync.reduce(
        (grouped, message) => Object.assign(grouped, { [message.type]: (grouped[message.type] || []).concat(message) }),
        {} as { [key in IACMessageType]?: IACMessageDefinitionObject[] }
      )

      for (const type in groupedByType) {
        if (type in IACMessageType) {
          // TODO: Improve types
          const typedType: IACMessageType = parseInt(type, 10)
          this.serializerMessageHandlers[typedType](data, groupedByType[typedType] ?? [], scanAgainCallback).catch(console.error)
        } else {
          // TODO: Improve types
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.syncTypeNotSupportedAlert(data, groupedByType[(type as any) as IACMessageType] ?? [], scanAgainCallback).catch(console.error)

          return this.storeResult(data, IACHanderStatus.ERROR, transport)
        }
      }

      return this.storeResult(data, IACHanderStatus.SUCCESS, transport)
    } else {
      await this.messageNotSupportedAlert(data, scanAgainCallback)

      return this.storeResult(data, IACHanderStatus.ERROR, transport)
    }
  }

  protected async messageNotSupportedAlert(data: string | string[], scanAgainCallback: ScanAgainCallback): Promise<void> {
    const relayButton = {
      text: 'Relay',
      handler: () => {
        this.relay(data).catch(console.error)
      }
    }

    const cancelButton = {
      text: 'tab-wallets.invalid-sync-operation_alert.okay_label',
      role: 'cancel',
      handler: () => {
        scanAgainCallback()
      }
    }
    this.uiEventService
      .showTranslatedAlert({
        header: 'tab-wallets.invalid-sync-operation_alert.title',
        message: 'tab-wallets.invalid-sync-operation_alert.text',
        buttons: [relayButton, cancelButton]
      })
      .catch(console.error)
  }

  protected async syncTypeNotSupportedAlert(
    data: string | string[],
    _deserializedSyncProtocols: IACMessageDefinitionObject[],
    scanAgainCallback: ScanAgainCallback
  ): Promise<boolean> {
    const relayButton = {
      text: 'Relay',
      handler: () => {
        this.relay(data).catch(console.error)
      }
    }

    const cancelButton = {
      text: 'tab-wallets.sync-operation-not-supported_alert.okay_label',
      role: 'cancel',
      handler: () => {
        scanAgainCallback()
      }
    }

    this.uiEventService
      .showTranslatedAlert({
        header: 'tab-wallets.sync-operation-not-supported_alert.title',
        message: 'tab-wallets.sync-operation-not-supported_alert.text',
        buttons: [relayButton, cancelButton]
      })
      .catch(console.error)

    return false
  }

  /**
   * This method should relay the message to the other app. The app is responsibe
   * for navigating away from the scanner because scanning will not be resumed.
   *
   * @param data The data that will be relayed
   */
  public abstract relay(data: string | string[]): Promise<void>
}
