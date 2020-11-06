import { InjectionToken } from '@angular/core'

export interface AppConfig {
  app: {
    name: string
    urlScheme: string
    universalLink: string
  }
  otherApp: {
    name: string
    urlScheme: string
    universalLink: string
  }
}

export const APP_CONFIG = new InjectionToken<AppConfig>('AppConfig')
