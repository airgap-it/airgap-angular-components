import { InjectionToken } from '@angular/core'
import { AppPlugin, ClipboardPlugin, SplashScreenPlugin, StatusBarPlugin, PermissionsPlugin } from '@capacitor/core'
import { AppInfoPlugin } from './definitions'

export const APP_PLUGIN = new InjectionToken<AppPlugin>('AppPlugin')
export const APP_INFO_PLUGIN = new InjectionToken<AppInfoPlugin>('AppInfoPlugin')
export const CLIPBOARD_PLUGIN = new InjectionToken<ClipboardPlugin>('ClipboardPlugin')
export const PERMISSIONS_PLUGIN = new InjectionToken<PermissionsPlugin>('PermissionsPlugin')
export const SPLASH_SCREEN_PLUGIN = new InjectionToken<SplashScreenPlugin>('SplashScreenPlugin')
export const STATUS_BAR_PLUGIN = new InjectionToken<StatusBarPlugin>('StatusBarPlugin')
