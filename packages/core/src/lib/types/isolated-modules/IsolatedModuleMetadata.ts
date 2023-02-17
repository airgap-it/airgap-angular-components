import { Directory } from '@capacitor/filesystem'
import { IsolatedModule } from './IsolatedModule'
import { IsolatedModuleManifest } from './IsolatedModuleManifest'

export interface IsolatedModuleMetadata {
  module: IsolatedModule
  manifest: IsolatedModuleManifest
  path: string
  root: string
  directory: Directory
}
