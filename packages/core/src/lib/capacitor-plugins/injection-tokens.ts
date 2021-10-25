import { InjectionToken } from '@angular/core'
import { AppPlugin } from '@capacitor/app'
import { AppLauncherPlugin } from '@capacitor/app-launcher'
import { ClipboardPlugin } from '@capacitor/clipboard'
import { SplashScreenPlugin } from '@capacitor/splash-screen'
import { StatusBarPlugin } from '@capacitor/status-bar'

import { AppInfoPlugin } from './definitions'

export const APP_PLUGIN = new InjectionToken<AppPlugin>('AppPlugin')
export const APP_INFO_PLUGIN = new InjectionToken<AppInfoPlugin>('AppInfoPlugin')
export const APP_LAUNCHER_PLUGIN = new InjectionToken<AppLauncherPlugin>('AppLauncherPlugin')
export const CLIPBOARD_PLUGIN = new InjectionToken<ClipboardPlugin>('ClipboardPlugin')
export const SPLASH_SCREEN_PLUGIN = new InjectionToken<SplashScreenPlugin>('SplashScreenPlugin')
export const STATUS_BAR_PLUGIN = new InjectionToken<StatusBarPlugin>('StatusBarPlugin')
