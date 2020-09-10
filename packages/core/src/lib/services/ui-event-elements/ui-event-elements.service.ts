import { Injectable } from '@angular/core'
import { UiEventService } from '../ui-event/ui-event.service'

@Injectable({
  providedIn: 'root'
})
export class UiEventElementsService {
  constructor(private readonly uiEventService: UiEventService) {}

  public async showSuccessfullyCopiedToClipboardToast(message: string = 'clipboard.toast.success_text'): Promise<void> {
    await this.uiEventService.showTranslatedToast({
      message,
      position: 'top',
      buttons: [
        {
          text: 'clipboard.toast.ok_label',
          role: 'cancel'
        }
      ]
    })
  }

  public async showIACMessageUnknownAlert(relayHandler: () => void, cancelHandler: () => void): Promise<void> {
    const relayButton = {
      text: 'Relay',
      handler: relayHandler
    }

    const cancelButton = {
      text: 'tab-wallets.invalid-sync-operation_alert.okay_label',
      role: 'cancel',
      handler: cancelHandler
    }

    await this.uiEventService.showTranslatedAlert({
      header: 'tab-wallets.invalid-sync-operation_alert.title',
      message: 'tab-wallets.invalid-sync-operation_alert.text',
      buttons: [relayButton, cancelButton]
    })
  }

  public async showIACMessageNotSupportedAlert(relayHandler: () => void, cancelHandler: () => void): Promise<void> {
    const relayButton = {
      text: 'Relay',
      handler: relayHandler
    }

    const cancelButton = {
      text: 'tab-wallets.sync-operation-not-supported_alert.okay_label',
      role: 'cancel',
      handler: cancelHandler
    }

    await this.uiEventService.showTranslatedAlert({
      header: 'tab-wallets.sync-operation-not-supported_alert.title',
      message: 'tab-wallets.sync-operation-not-supported_alert.text',
      buttons: [relayButton, cancelButton]
    })
  }
}
