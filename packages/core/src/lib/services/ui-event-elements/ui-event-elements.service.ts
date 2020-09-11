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
      text: 'iac.message-unknown_alert.relay_label',
      handler: relayHandler
    }

    const cancelButton = {
      text: 'iac.message-unknown_alert.okay_label',
      role: 'cancel',
      handler: cancelHandler
    }

    await this.uiEventService.showTranslatedAlert({
      header: 'iac.message-unknown_alert.header',
      message: 'iac.message-unknown_alert.message',
      buttons: [relayButton, cancelButton]
    })
  }

  public async showIACMessageNotSupportedAlert(relayHandler: () => void, cancelHandler: () => void): Promise<void> {
    const relayButton = {
      text: 'iac.message-not-supported_alert.relay_label',
      handler: relayHandler
    }

    const cancelButton = {
      text: 'iac.message-not-supported_alert.okay_label',
      role: 'cancel',
      handler: cancelHandler
    }

    await this.uiEventService.showTranslatedAlert({
      header: 'iac.message-not-supported_alert.header',
      message: 'iac.message-not-supported_alert.message',
      buttons: [relayButton, cancelButton]
    })
  }

  public async showDeeplinkOnlyAvailableOnDevicesAlert(): Promise<void> {
    await this.uiEventService.showTranslatedAlert({
      header: 'deeplink.not-supported-alert.title',
      message: 'deeplink.not-supported-alert.message',
      buttons: [
        {
          text: 'deeplink.not-supported-alert.ok',
          role: 'cancel'
        }
      ]
    })
  }

  public async showOtherAppNotFoundAlert(): Promise<void> {
    await this.uiEventService.showTranslatedAlert({
      header: 'deeplink.app-not-found.title',
      message: 'deeplink.app-not-found.message',
      buttons: [
        {
          text: 'deeplink.app-not-found.ok',
          role: 'cancel'
        }
      ]
    })
  }

  public async showOpenSettingsAlert(openSettingsHandler: () => void): Promise<void> {
    await this.uiEventService.showTranslatedAlert({
      header: 'Settings',
      message: 'You can enable the missing permissions in the device settings.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => undefined
        },
        {
          text: 'Open settings',
          handler: openSettingsHandler
        }
      ]
    })
  }
}
