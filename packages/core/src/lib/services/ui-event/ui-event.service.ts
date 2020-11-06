import { Injectable, Inject } from '@angular/core'
import { AlertController, LoadingController, ToastController } from '@ionic/angular'
import { AlertInput, AlertButton, AlertOptions, ToastOptions, ToastButton, LoadingOptions } from '@ionic/core'
import { TranslateService } from '@ngx-translate/core'
import { APP_CONFIG, AppConfig } from '../../config/app-config'

/**
 * This class provides helper functions for translated UI elements such as alerts, toasts and loaders.
 *
 * This class should most likely not be called directly and instead be wrapped with something like the UiEventElementsService.
 */
@Injectable({
  providedIn: 'root'
})
export class UiEventService {
  constructor(
    private readonly translateService: TranslateService,
    private readonly alertController: AlertController,
    private readonly toastController: ToastController,
    private readonly loadingController: LoadingController,
    @Inject(APP_CONFIG) private readonly appConfig: AppConfig
  ) {}

  /**
   * Create a translated loader and show it. If you want a reference to the loader, use `getTranslatedLoader` instead.
   *
   * @param optionsInput
   */
  public async showTranslatedLoader(optionsInput: LoadingOptions): Promise<void> {
    const loader: HTMLIonLoadingElement = await this.getTranslatedLoader(optionsInput)

    return loader.present()
  }

  /**
   * Create a translated loader and return it.
   *
   * @param optionsInput
   */
  public async getTranslatedLoader(optionsInput: LoadingOptions): Promise<HTMLIonLoadingElement> {
    const message = optionsInput.message?.toString()

    const translationKeys: string[] = [message].filter((key: string | undefined): key is string => key !== undefined)

    const options: ToastOptions = {}

    if (translationKeys.length > 0) {
      const values = await this.translateService.get(translationKeys, this.appConfig).toPromise()

      if (message) {
        options.message = values[message]
      }
    }

    const loader = await this.loadingController.create({
      backdropDismiss: false, // Apply defaults
      ...optionsInput, // Overwrite with configuration
      ...options // Overwrite translations
    })

    return loader
  }

  /**
   * Create a translated toast and show it. If you want a reference to the toast, use `getTranslatedToast` instead.
   *
   * @param optionsInput
   */
  public async showTranslatedToast(optionsInput: ToastOptions): Promise<void> {
    const toast: HTMLIonToastElement = await this.getTranslatedToast(optionsInput)

    return toast.present()
  }

  /**
   * Create a translated toast and return it.
   *
   * @param optionsInput
   */
  public async getTranslatedToast(optionsInput: ToastOptions): Promise<HTMLIonToastElement> {
    const header = optionsInput.header
    const message = optionsInput.message?.toString()
    const buttons = optionsInput.buttons ?? []

    const translationKeys: string[] = [
      header,
      message,
      ...buttons.map((button: string | ToastButton) => (typeof button === 'string' ? button : button.text))
    ].filter((key: string | undefined): key is string => key !== undefined)

    const options: ToastOptions = {}

    if (translationKeys.length > 0) {
      const values = await this.translateService.get(translationKeys, this.appConfig).toPromise()

      if (header) {
        options.header = values[header]
      }
      if (message) {
        options.message = values[message]
      }

      const newButtons: (string | ToastButton)[] | undefined = await this.translateButtons<ToastButton>(buttons, values)

      if (newButtons) {
        options.buttons = newButtons
      }
    }

    const toast = await this.toastController.create({
      duration: 2000, // Apply defaults
      ...optionsInput, // Overwrite with configuration
      ...options // Overwrite translations
    })

    return toast
  }

  /**
   * Create a translated alert and show it. If you want a reference to the alert, use `getTranslatedAlert` instead.
   *
   * @param optionsInput
   */
  public async showTranslatedAlert(optionsInput: AlertOptions): Promise<void> {
    const alert: HTMLIonAlertElement = await this.getTranslatedAlert(optionsInput)

    return alert.present()
  }

  /**
   * Create a translated alert and return it.
   *
   * @param optionsInput
   */
  public async getTranslatedAlert(optionsInput: AlertOptions): Promise<HTMLIonAlertElement> {
    const header = optionsInput.header
    const subHeader = optionsInput.subHeader
    const message = optionsInput.message?.toString()
    const inputs = optionsInput.inputs ?? []
    const buttons = optionsInput.buttons ?? []

    const translationKeys: string[] = [
      header,
      subHeader,
      message,
      ...inputs.map((input: AlertInput) => input.name),
      ...inputs.map((input: AlertInput) => input.placeholder),
      ...inputs.map((input: AlertInput) => input.value),
      ...inputs.map((input: AlertInput) => input.label),
      ...buttons.map((button: string | AlertButton) => (typeof button === 'string' ? button : button.text))
    ].filter((key: string | undefined): key is string => key !== undefined)

    const options: AlertOptions = {}

    if (translationKeys.length > 0) {
      const values = await this.translateService.get(translationKeys, this.appConfig).toPromise()

      if (header) {
        options.header = values[header]
      }
      if (subHeader) {
        options.subHeader = values[subHeader]
      }
      if (message) {
        options.message = values[message]
      }

      if (inputs.length > 0) {
        inputs.forEach((input: AlertInput) => {
          if (input.name !== undefined) {
            input.name = values[input.name]
          }
          if (input.placeholder !== undefined) {
            input.placeholder = values[input.placeholder]
          }
          if (input.value !== undefined) {
            input.value = values[input.value]
          }
          if (input.label !== undefined) {
            input.label = values[input.label]
          }
        })

        options.inputs = inputs
      }

      const newButtons: (string | AlertButton)[] | undefined = await this.translateButtons<AlertButton>(buttons, values)

      if (newButtons) {
        options.buttons = newButtons
      }
    }

    const alert = await this.alertController.create({
      backdropDismiss: true, // Apply defaults
      ...optionsInput, // Overwrite with configuration
      ...options // Overwrite translations
    })

    return alert
  }

  private async translateButtons<T extends AlertButton | ToastButton>(
    buttons: (string | T)[],
    values: { [key: string]: string }
  ): Promise<undefined | (string | T)[]> {
    if (buttons.length > 0) {
      const newButtons: (string | T)[] = []
      buttons.forEach((button: string | T) => {
        if (typeof button === 'string') {
          // eslint-disable-next-line no-param-reassign
          newButtons.push(values[button])
        } else {
          if (button.text) {
            button.text = values[button.text]
            newButtons.push(button)
          }
        }
      })

      return newButtons
    } else {
      return undefined
    }
  }
}
