import { Injectable } from '@angular/core'
import { AlertController, ToastController } from '@ionic/angular'
import { AlertInput, AlertButton, AlertOptions, ToastOptions, ToastButton } from '@ionic/core'
import { TranslateService } from '@ngx-translate/core'

@Injectable({
  providedIn: 'root'
})
export class UiEventService {
  constructor(
    private readonly translateService: TranslateService,
    private readonly alertController: AlertController,
    private readonly toastController: ToastController
  ) {}

  public async showTranslatedToast(optionsInput: ToastOptions): Promise<void> {
    const header = optionsInput.header
    const message = optionsInput.message?.toString()
    const buttons = optionsInput.buttons ?? []

    const translationKeys: string[] = [
      header,
      message,
      ...buttons.map((button: string | ToastButton) => (typeof button === 'string' ? button : button.text))
    ].filter((key: string | undefined): key is string => key !== undefined)

    const values = await this.translateService.get(translationKeys).toPromise()

    buttons.forEach((button: string | ToastButton) => {
      if (typeof button === 'string') {
        // eslint-disable-next-line no-param-reassign
        button = values[button]
      } else {
        if (button.text) {
          button.text = values[button.text]
        }
      }
    })

    const options: ToastOptions = {}
    if (header) {
      options.header = values[header]
    }
    if (message) {
      options.message = values[message]
    }

    options.buttons = buttons

    const toast = await this.toastController.create({
      duration: 2000, // Apply defaults
      ...optionsInput, // Overwrite with configuration
      ...options // Overwrite translations
    })

    return toast.present()
  }

  public async showTranslatedAlert(optionsInput: AlertOptions): Promise<void> {
    const header = optionsInput.header
    const subHeader = optionsInput.subHeader
    const message = optionsInput.message?.toString()
    const inputs = optionsInput.inputs ?? []
    const buttons = optionsInput.buttons ?? []

    const translationKeys: string[] = [
      header,
      subHeader,
      message,
      ...inputs.map((input: AlertInput) => input.placeholder),
      ...buttons.map((button: string | AlertButton) => (typeof button === 'string' ? button : button.text))
    ].filter((key: string | undefined): key is string => key !== undefined)

    const values = await this.translateService.get(translationKeys).toPromise()

    inputs.forEach((input: AlertInput) => {
      if (input.placeholder !== undefined) {
        input.placeholder = values[input.placeholder]
      }
    })

    buttons.forEach((button: string | AlertButton) => {
      if (typeof button === 'string') {
        // eslint-disable-next-line no-param-reassign
        button = values[button]
      } else {
        button.text = values[button.text]
      }
    })

    const options: AlertOptions = {}
    if (header) {
      options.header = values[header]
    }
    if (subHeader) {
      options.subHeader = values[subHeader]
    }
    if (message) {
      options.message = values[message]
    }

    options.inputs = inputs
    options.buttons = buttons

    const alert = await this.alertController.create({
      backdropDismiss: true, // Apply defaults
      ...optionsInput, // Overwrite with configuration
      ...options // Overwrite translations
    })

    return alert.present()
  }
}
