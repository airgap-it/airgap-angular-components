import { IsolatedModuleInstalledMetadata, UIResource, UIResourceStatus } from '@airgap/angular-core'
import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { IsolatedModulesListState } from './isolated-modules-list.types'

const initialState: IsolatedModulesListState = {
  modules: {
    status: UIResourceStatus.IDLE,
    value: []
  }
}

@Injectable()
export class IsolatedModulesListStore extends ComponentStore<IsolatedModulesListState> {
  constructor() {
    super(initialState)
  }

  public readonly setModules = this.updater(
    (state: IsolatedModulesListState, data: { modules: UIResource<IsolatedModuleInstalledMetadata[]>; query?: string }) => {
      return {
        ...state,
        modules: {
          status: data.modules.status,
          value: this.filterModulesByNameOrAuthor(data.modules.value ?? [], data.query)
        }
      }
    }
  )

  public readonly filterModules = this.updater((state: IsolatedModulesListState, query: string | undefined) => {
    return {
      ...state,
      modules: {
        status: state.modules.status,
        value: this.filterModulesByNameOrAuthor(state.modules.value ?? [], query)
      }
    }
  })

  private filterModulesByNameOrAuthor(
    modules: IsolatedModuleInstalledMetadata[],
    query: string | undefined
  ): IsolatedModuleInstalledMetadata[] {
    return query
      ? modules.filter((module: IsolatedModuleInstalledMetadata) => {
          return (
            module.manifest.name.toLowerCase().includes(query.toLowerCase()) ||
            module.manifest.author.toLowerCase().includes(query.toLowerCase())
          )
        })
      : modules
  }
}
