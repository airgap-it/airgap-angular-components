import { IsolatedModuleMetadata, UIResource, UIResourceStatus } from '@airgap/angular-core'
import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { IsolatedModulesListState } from './isolated-modules-list.types'

const initialState: IsolatedModulesListState = {
  allModules: {
    status: UIResourceStatus.IDLE,
    value: []
  },
  filteredModules: {
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
    (state: IsolatedModulesListState, data: { modules: UIResource<IsolatedModuleMetadata[]>; query?: string }) => {
      return {
        ...state,
        allModules: {
          status: data.modules.status,
          value: data.modules.value
        },
        filteredModules: {
          status: data.modules.status,
          value: this.filterModulesByNameOrAuthor(data.modules.value ?? [], data.query)
        }
      }
    }
  )

  public readonly filterModules = this.updater((state: IsolatedModulesListState, query: string | undefined) => {
    return {
      ...state,
      filteredModules: {
        status: state.allModules.status,
        value: this.filterModulesByNameOrAuthor(state.allModules.value ?? [], query)
      }
    }
  })

  private filterModulesByNameOrAuthor(modules: IsolatedModuleMetadata[], query: string | undefined): IsolatedModuleMetadata[] {
    return query
      ? modules.filter((module: IsolatedModuleMetadata) => {
          return (
            module.manifest.name.toLowerCase().includes(query.toLowerCase()) ||
            module.manifest.author.toLowerCase().includes(query.toLowerCase())
          )
        })
      : modules
  }
}
