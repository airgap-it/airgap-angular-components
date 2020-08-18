/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { AlertInput, AlertButton, AlertOptions } from '@ionic/core'
import { SupportedLanguage } from '../../types/SupportedLanguage'

export interface LanguageServiceConfig {
  supportedLanguages: SupportedLanguage[]
  defaultLanguage: SupportedLanguage
  useBrowserLanguage?: boolean
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private static readonly defaultLanguage: SupportedLanguage = 'en'

  public get supportedLanguages(): string[] {
    return this.translateService.getLangs()
  }

  constructor(private readonly translateService: TranslateService) {}

  public async init(
    config: LanguageServiceConfig = {
      supportedLanguages: [LanguageService.defaultLanguage],
      defaultLanguage: LanguageService.defaultLanguage,
      useBrowserLanguage: true
    }
  ): Promise<void> {
    const supportedLanguages: SupportedLanguage[] = config.supportedLanguages
    const defaultLanguage: SupportedLanguage = config.defaultLanguage
    const useBrowserLanguage: boolean = config.useBrowserLanguage ?? true

    if (supportedLanguages.find((supported: SupportedLanguage) => supported === defaultLanguage) === undefined) {
      supportedLanguages.push(defaultLanguage)
    }

    this.translateService.addLangs(supportedLanguages)
    this.translateService.setDefaultLang(defaultLanguage)

    const language: string = useBrowserLanguage ? this.translateService.getBrowserLang().toLowerCase() : defaultLanguage

    return this.changeLanguage(language)
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public loadTranslation(language: string, translation: any, merge: boolean = true): void {
    this.translateService.setTranslation(language, translation, merge)
  }

  public async changeLanguage(language: string): Promise<void> {
    return this.translateService.use(language).toPromise()
  }

  public isLanguageSupported(language: string): boolean {
    return this.supportedLanguages.find((supported: string) => supported === language) !== undefined
  }

  public async getTranslatedAlert(header: string, message: string, inputs: AlertInput[], buttons: AlertButton[]): Promise<AlertOptions> {
    const translationKeys: string[] = [
      header,
      message,
      ...inputs.map((input: AlertInput) => input.placeholder),
      ...buttons.map((button: AlertButton) => button.text)
    ].filter((key: string | undefined) => key !== undefined) as string[]

    const values = await this.translateService.get(translationKeys).toPromise()

    inputs.forEach((input: AlertInput) => {
      if (input.placeholder !== undefined) {
        input.placeholder = values[input.placeholder]
      }
    })

    buttons.forEach((button: AlertButton) => {
      button.text = values[button.text]
    })

    return {
      header: values[header],
      message: values[message],
      inputs,
      buttons
    }
  }
}
