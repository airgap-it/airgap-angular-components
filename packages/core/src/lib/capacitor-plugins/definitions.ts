/* eslint-disable spaced-comment */
import {
  AirGapBlockExplorer,
  AirGapOfflineProtocol,
  AirGapOnlineProtocol,
  AirGapV3SerializerCompanion,
  ProtocolConfiguration
} from '@airgap/module-kit'
import { registerPlugin } from '@capacitor/core'
import { Directory } from '@capacitor/filesystem'
import { IsolatedModule } from '../types/isolated-modules/IsolatedModule'
import { IsolatedModuleManifest } from '../types/isolated-modules/IsolatedModuleManifest'

/**************** AppInfoPlugin ****************/

export type AndroidFlavor = 'playstore' | 'fdroid'

export interface AppInfoPlugin {
  get(): Promise<{ appName: string; packageName: string; versionName: string; versionCode: number; productFlavor?: AndroidFlavor }>
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const AppInfo: AppInfoPlugin = registerPlugin('AppInfo')

/**************** ZipPlugin ****************/

export interface ZipPlugin {
  unzip(params: { from: string; to: string; directory?: Directory; toDirectory?: Directory }): Promise<void>
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Zip: ZipPlugin = registerPlugin('Zip')

/**************** IsolatedModulesPlugin ****************/

export interface PreviewModuleOptions {
  path: string
  directory: Directory
}

export interface PreviewModuleResult {
  module: IsolatedModule
  manifest: IsolatedModuleManifest
}

export interface RegisterModuleOptions {
  identifier: string
  protocolIdentifiers: string[]
}

export interface LoadModulesOptions {
  protocolType?: ProtocolConfiguration['type']
}

export interface LoadModulesResult {
  modules: IsolatedModule[]
}

interface AnyCallMethodOptions<T extends string, M> {
  target: T
  method: M
  args?: unknown[]
}

export interface OfflineProtocolCallMethodOptions<T extends AirGapOfflineProtocol = AirGapOfflineProtocol>
  extends AnyCallMethodOptions<'offlineProtocol', keyof T> {
  protocolIdentifier: string
}
export interface OnlineProtocolCallMethodOptions<T extends AirGapOnlineProtocol = AirGapOnlineProtocol>
  extends AnyCallMethodOptions<'onlineProtocol', keyof T> {
  protocolIdentifier: string
  networkId?: string
}
export interface BlockExplorerCallMethodOptions<T extends AirGapBlockExplorer = AirGapBlockExplorer>
  extends AnyCallMethodOptions<'blockExplorer', keyof T> {
  protocolIdentifier: string
  networkId?: string
}
export interface V3SerializerCompanionCallMethodOptions<T extends AirGapV3SerializerCompanion = AirGapV3SerializerCompanion>
  extends AnyCallMethodOptions<'v3SerializerCompanion', Exclude<keyof T, 'schemas'>> {
  moduleIdentifier: string
}

export type CallMethodOptions<T = unknown> =
  | OfflineProtocolCallMethodOptions<T extends AirGapOfflineProtocol ? T : AirGapOfflineProtocol>
  | OnlineProtocolCallMethodOptions<T extends AirGapOnlineProtocol ? T : AirGapOnlineProtocol>
  | BlockExplorerCallMethodOptions<T extends AirGapBlockExplorer ? T : AirGapBlockExplorer>
  | V3SerializerCompanionCallMethodOptions<T extends AirGapV3SerializerCompanion ? T : AirGapV3SerializerCompanion>

export interface CallMethodResult {
  value: unknown
}

export interface IsolatedModulesPlugin {
  previewModule(options: PreviewModuleOptions): Promise<PreviewModuleResult>
  registerModule(options: RegisterModuleOptions): Promise<void>
  loadModules(options?: LoadModulesOptions): Promise<LoadModulesResult>

  callMethod<T = unknown>(options: CallMethodOptions<T>): Promise<CallMethodResult>
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const IsolatedModules: IsolatedModulesPlugin = registerPlugin('IsolatedModules', {
  web: () => import('./isolated-modules/isolated-modules.plugin').then((m) => new m.IsolatedModules()),

  // disable true isolation until it's production ready
  android: () => import('./isolated-modules/isolated-modules.plugin').then((m) => new m.IsolatedModules()),
  ios: () => import('./isolated-modules/isolated-modules.plugin').then((m) => new m.IsolatedModules())
})
