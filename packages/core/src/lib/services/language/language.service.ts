import { Injectable } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

export type SupportedLanguage = 'en' | 'de' | 'es' | 'zh-cn'
export interface LanguageServiceConfig {
  supportedLanguages: SupportedLanguage | SupportedLanguage[]
  defaultLanguage: SupportedLanguage
  useLanguage?: SupportedLanguage
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
      supportedLanguages: LanguageService.defaultLanguage,
      defaultLanguage: LanguageService.defaultLanguage,
      useBrowserLanguage: true
    }
  ): Promise<void> {
    let supportedLanguages: SupportedLanguage[] = Array.isArray(config.supportedLanguages) ? config.supportedLanguages : [config.supportedLanguages]
    const defaultLanguage: SupportedLanguage = config.defaultLanguage ?? LanguageService.defaultLanguage
    const useLanguage: SupportedLanguage = config.useLanguage ?? defaultLanguage

    if (supportedLanguages.length === 0) {
      // eslint-disable-next-line no-console
      console.log(`LanguageService: no supported languages provided, using ${defaultLanguage}.`)
      supportedLanguages = [defaultLanguage]
    }

    this.translateService.addLangs(supportedLanguages)
    this.translateService.setDefaultLang(defaultLanguage)

    const language: string = config.useBrowserLanguage 
      ? this.translateService.getBrowserLang().toLowerCase()
      : useLanguage

    return this.translateService.use(language).toPromise()
  }

  public async changeLanguage(language: SupportedLanguage): Promise<void> {
    return this.translateService.use(language).toPromise()
  }
}
