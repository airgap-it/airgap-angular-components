import { registerPlugin } from '@capacitor/core'

export type AndroidFlavor = 'playstore' | 'fdroid'

export interface AppInfoPlugin {
  get(): Promise<{ appName: string; packageName: string; versionName: string; versionCode: number; productFlavor?: AndroidFlavor }>
}

export const AppInfo: AppInfoPlugin = registerPlugin('AppInfo')