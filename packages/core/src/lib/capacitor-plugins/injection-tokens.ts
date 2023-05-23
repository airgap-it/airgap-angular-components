import { InjectionToken } from '@angular/core'
import { AppPlugin } from '@capacitor/app'
import { AppLauncherPlugin } from '@capacitor/app-launcher'
import { ClipboardPlugin } from '@capacitor/clipboard'
import { FilesystemPlugin } from '@capacitor/filesystem'
import { SplashScreenPlugin } from '@capacitor/splash-screen'
import { StatusBarPlugin } from '@capacitor/status-bar'

import { AppInfoPlugin, IsolatedModulesPlugin, ZipPlugin } from './definitions'

export const APP_PLUGIN = new InjectionToken<AppPlugin>('AppPlugin')
export const APP_INFO_PLUGIN = new InjectionToken<AppInfoPlugin>('AppInfoPlugin')
export const APP_LAUNCHER_PLUGIN = new InjectionToken<AppLauncherPlugin>('AppLauncherPlugin')
export const CLIPBOARD_PLUGIN = new InjectionToken<ClipboardPlugin>('ClipboardPlugin')
export const FILESYSTEM_PLUGIN = new InjectionToken<FilesystemPlugin>('FilesystemPlugin')
export const ISOLATED_MODULES_PLUGIN = new InjectionToken<IsolatedModulesPlugin>('IsolatedModulesPlugin')
export const SPLASH_SCREEN_PLUGIN = new InjectionToken<SplashScreenPlugin>('SplashScreenPlugin')
export const STATUS_BAR_PLUGIN = new InjectionToken<StatusBarPlugin>('StatusBarPlugin')
export const ZIP_PLUGIN = new InjectionToken<ZipPlugin>('ZipPlugin')
