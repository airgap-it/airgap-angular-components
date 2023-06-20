import { InjectionToken, Injector } from '@angular/core'
import { Observable } from 'rxjs'
import { BaseFacade } from '../../base/base.facade'
import { IsolatedModuleInstalledMetadata } from '../../types/isolated-modules/IsolatedModuleMetadata'
import { UIResource } from '../../types/ui/UIResource'

export const ISOLATED_MODULES_LIST_PAGE_FACADE = new InjectionToken<IsolatedModulesListPageFacade>('IsolatedModulesListPageFacade')
export const ISOLATED_MODULES_LIST_PAGE_FACADE_FACTORY = new InjectionToken<(injector: Injector) => IsolatedModulesListPageFacade>(
  'IsolatedModulesListPageFacadeFactory'
)
export type IsolatedModulesListPageFacade<T extends BaseFacade = BaseFacade> = IIsolatedModulesListPageFacade & T

export interface IIsolatedModulesListPageFacade {
  readonly modules$: Observable<UIResource<IsolatedModuleInstalledMetadata[]>>
  readonly filter$: Observable<string | undefined>

  onViewWillEnter(): void
  onFilterQueryChanged(query: string | undefined): void
}

export function isolatedModulesListPageFacade(injector: Injector): IsolatedModulesListPageFacade {
  return injector.get(ISOLATED_MODULES_LIST_PAGE_FACADE_FACTORY)(injector)
}
