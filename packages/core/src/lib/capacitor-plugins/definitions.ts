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
import { IsolatedModulesPluginWrapper } from './isolated-modules/isolated-modules.plugin-wrapper'

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

export interface PreviewDynamicModuleOptions {
  path: string
  directory: Directory
}

export interface PreviewDynamicModuleResult {
  module: IsolatedModule
  manifest: IsolatedModuleManifest
}

export interface VerifyDynamicModuleOptions {
  path: string
  directory: Directory
}

export interface VerifyDynamicModuleResult {
  verified: boolean
}

export interface RegisterDynamicModuleOptions {
  identifier: string
  protocolIdentifiers: string[]
}

export interface ReadDynamicModuleOptions {
  identifier: string
}

export interface ReadDynamicModuleResult {
  manifest: IsolatedModuleManifest
  installedAt: string
}

export interface RemoveDynamicModulesOptions {
  identifiers?: string[]
}

export interface LoadAllModulesOptions {
  protocolType?: ProtocolConfiguration['type']
  ignoreProtocols?: string[]
}

export interface LoadAllModulesResult {
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

export type CallMethodOptions<T = any> =
  | OfflineProtocolCallMethodOptions<T extends AirGapOfflineProtocol ? T : AirGapOfflineProtocol>
  | OnlineProtocolCallMethodOptions<T extends AirGapOnlineProtocol ? T : AirGapOnlineProtocol>
  | BlockExplorerCallMethodOptions<T extends AirGapBlockExplorer ? T : AirGapBlockExplorer>
  | V3SerializerCompanionCallMethodOptions<T extends AirGapV3SerializerCompanion ? T : AirGapV3SerializerCompanion>

export interface CallMethodResult {
  value: unknown
}

export interface BatchCallMethodOptions {
  options: CallMethodOptions[]
}

interface BatchCallMethodSingleSuccessResult {
  type: 'success'
  value: unknown
}
interface BatchCallMethodSingleFailureResult {
  type: 'error'
  error: unknown
}

export type BatchCallMethodSingleResult = BatchCallMethodSingleSuccessResult | BatchCallMethodSingleFailureResult
export interface BatchCallMethodResult {
  values: BatchCallMethodSingleResult[]
}

export interface IsolatedModulesPlugin {
  previewDynamicModule(options: PreviewDynamicModuleOptions): Promise<PreviewDynamicModuleResult>
  verifyDynamicModule(options: VerifyDynamicModuleOptions): Promise<VerifyDynamicModuleResult>
  registerDynamicModule(options: RegisterDynamicModuleOptions): Promise<void>
  readDynamicModule(options: ReadDynamicModuleOptions): Promise<ReadDynamicModuleResult>

  removeDynamicModules(options?: RemoveDynamicModulesOptions): Promise<void>

  loadAllModules(options?: LoadAllModulesOptions): Promise<LoadAllModulesResult>

  callMethod<T = unknown>(options: CallMethodOptions<T>): Promise<CallMethodResult>
  batchCallMethod(options: BatchCallMethodOptions): Promise<BatchCallMethodResult>
}

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const _IsolatedModules: IsolatedModulesPlugin = registerPlugin('IsolatedModules', {
  web: () => import('./isolated-modules/isolated-modules.plugin').then((m) => new m.IsolatedModules())
})

// eslint-disable-next-line @typescript-eslint/naming-convention
export const IsolatedModules: IsolatedModulesPlugin = new IsolatedModulesPluginWrapper(_IsolatedModules)
