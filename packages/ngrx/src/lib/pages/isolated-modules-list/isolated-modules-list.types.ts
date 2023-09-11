import { IsolatedModuleMetadata, UIResource } from '@airgap/angular-core'

export interface IsolatedModulesListPageState {
  modules: UIResource<IsolatedModuleMetadata[]>
  filter: string | undefined
}
