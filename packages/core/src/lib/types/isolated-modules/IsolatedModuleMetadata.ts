import { Directory } from '@capacitor/filesystem'
import { IsolatedModule } from './IsolatedModule'
import { IsolatedModuleManifest } from './IsolatedModuleManifest'

interface BaseIsolatedModuleMetadata<T extends string> {
  type: T
  module: IsolatedModule
  manifest: IsolatedModuleManifest
}

export interface IsolatedModulePreviewMetadata extends BaseIsolatedModuleMetadata<'preview'> {
  path: string
  root: string
  directory: Directory
}

export interface IsolatedModuleInstalledMetadata extends BaseIsolatedModuleMetadata<'installed'> {
  installedAt: string
}

export type IsolatedModuleMetadata = IsolatedModulePreviewMetadata | IsolatedModuleInstalledMetadata
