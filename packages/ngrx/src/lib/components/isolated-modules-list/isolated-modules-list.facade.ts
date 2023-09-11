import { IIsolatedModulesListFacade, IsolatedModuleMetadata, IsolatedModulesListFacade, UIResource } from '@airgap/angular-core'
import { Injectable, Injector } from '@angular/core'
import { Observable } from 'rxjs'
import { BaseNgRxFacade } from '../../base/base-ngrx.facade'
import { IsolatedModulesListStore } from './isolated-modules-list.store'
import { IsolatedModulesListState } from './isolated-modules-list.types'

@Injectable()
export class IsolatedModulesListNgRxFacade extends BaseNgRxFacade<IsolatedModulesListStore> implements IIsolatedModulesListFacade {
  public readonly modules$: Observable<UIResource<IsolatedModuleMetadata[]>>

  constructor(store: IsolatedModulesListStore) {
    super(store)

    this.modules$ = this.store.select((state: IsolatedModulesListState) => state.filteredModules)
  }

  public updateModules(modules: UIResource<IsolatedModuleMetadata[]>, query: string): void {
    this.store.setModules({ modules, query })
  }

  public filterModules(query: string | undefined): void {
    this.store.filterModules(query)
  }
}

export const isolatedModulesListNgRxFacade = (_injector: Injector): IsolatedModulesListFacade => {
  return new IsolatedModulesListNgRxFacade(new IsolatedModulesListStore())
}
