import { InjectionToken } from '@angular/core'

export interface AppConfig {
  appName: string
  otherAppName: string
}

export const APP_CONFIG = new InjectionToken<AppConfig>('AppConfig')
