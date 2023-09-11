import { IsolatedModuleMetadata, UIResource } from '@airgap/angular-core'

export interface IsolatedModulesListState {
  allModules: UIResource<IsolatedModuleMetadata[]>
  filteredModules: UIResource<IsolatedModuleMetadata[]>
}
