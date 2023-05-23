import { IsolatedModuleInstalledMetadata, UIResource } from '@airgap/angular-core'

export interface IsolatedModulesListPageState {
  modules: UIResource<IsolatedModuleInstalledMetadata[]>
  filter: string | undefined
}
