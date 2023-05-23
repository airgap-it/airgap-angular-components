import {
  BaseModulesService,
  IsolatedModuleInstalledMetadata,
  IsolatedModulesListPageFacade,
  UiEventService,
  UIResource
} from '@airgap/angular-core'
import { Injector } from '@angular/core'
import { Observable } from 'rxjs'
import { BaseNgRxFacade } from '../../base/base-ngrx.facade'

import { IsolatedModulesListPageStore } from './isolated-modules-list.store'
import { IsolatedModulesListPageState } from './isolated-modules-list.types'

export class IsolatedModulesListPageNgRxFacade
  extends BaseNgRxFacade<IsolatedModulesListPageStore>
  implements IsolatedModulesListPageFacade
{
  public readonly modules$: Observable<UIResource<IsolatedModuleInstalledMetadata[]>>
  public readonly filter$: Observable<string | undefined>

  constructor(store: IsolatedModulesListPageStore, uiEventService: UiEventService) {
    super(store, uiEventService)

    this.modules$ = this.store.select((state: IsolatedModulesListPageState) => state.modules)
    this.filter$ = this.store.select((state: IsolatedModulesListPageState) => state.filter)
  }

  public onViewInit() {
    this.store.onPageLoaded$()

    return super.onViewInit()
  }

  public onViewWillEnter(): void {
    this.store.onPageLoaded$()
  }

  public onFilterQueryChanged(query: string | undefined): void {
    this.store.setFilterQuery(query)
  }
}

export const isolatedModulesListPageNgRxFacade = (injector: Injector): IsolatedModulesListPageFacade => {
  return new IsolatedModulesListPageNgRxFacade(
    new IsolatedModulesListPageStore(injector.get(BaseModulesService)),
    injector.get(UiEventService)
  )
}
