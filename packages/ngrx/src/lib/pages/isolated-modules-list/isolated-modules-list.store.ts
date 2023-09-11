import { BaseModulesService, IsolatedModuleMetadata, UIResourceStatus } from '@airgap/angular-core'
import { ComponentStore, tapResponse } from '@ngrx/component-store'
import { from, Observable } from 'rxjs'
import { first, switchMap, tap } from 'rxjs/operators'
import { IsolatedModulesListPageState } from './isolated-modules-list.types'

const initialState: IsolatedModulesListPageState = {
  modules: {
    status: UIResourceStatus.IDLE,
    value: []
  },
  filter: undefined
}

export class IsolatedModulesListPageStore extends ComponentStore<IsolatedModulesListPageState> {
  constructor(private readonly modulesService: BaseModulesService) {
    super(initialState)
  }

  public readonly onPageLoaded$ = this.effect((trigger$: Observable<void>) => {
    return trigger$.pipe(
      tap(() => this.onModulesLoading()),
      switchMap(() => from(this.loadModules()).pipe(first())),
      tapResponse(
        (value: IsolatedModuleMetadata[]) => this.setModules(value),
        () => this.onModulesLoadingError()
      )
    )
  })

  public readonly setModules = this.updater((state: IsolatedModulesListPageState, modules: IsolatedModuleMetadata[]) => {
    return {
      ...state,
      modules: {
        status: UIResourceStatus.SUCCESS,
        value: modules
      }
    }
  })

  public readonly onModulesLoading = this.updater((state: IsolatedModulesListPageState) => {
    return {
      ...state,
      modules: {
        status: UIResourceStatus.LOADING,
        value: state.modules.value
      }
    }
  })

  public readonly onModulesLoadingError = this.updater((state: IsolatedModulesListPageState) => {
    return {
      ...state,
      modules: {
        status: UIResourceStatus.ERROR,
        value: state.modules.value
      }
    }
  })

  public readonly setFilterQuery = this.updater((state: IsolatedModulesListPageState, query: string | undefined) => {
    return {
      ...state,
      filter: query
    }
  })

  private async loadModules(): Promise<IsolatedModuleMetadata[]> {
    return this.modulesService.getModulesMetadata()
  }
}
