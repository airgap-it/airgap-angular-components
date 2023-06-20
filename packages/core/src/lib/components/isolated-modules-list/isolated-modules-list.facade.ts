import { InjectionToken, Injector } from '@angular/core'
import { Observable } from 'rxjs'
import { BaseFacade } from '../../base/base.facade'
import { IsolatedModuleInstalledMetadata } from '../../types/isolated-modules/IsolatedModuleMetadata'
import { UIResource } from '../../types/ui/UIResource'

export const ISOLATED_MODULES_LIST_FACADE = new InjectionToken<IsolatedModulesListFacade>('IsolatedModulesListFacade')
export const ISOLATED_MODULES_LIST_FACADE_FACTORY = new InjectionToken<(injector: Injector) => IsolatedModulesListFacade>(
  'IsolatedModulesListFacadeFactory'
)
export type IsolatedModulesListFacade<T extends BaseFacade = BaseFacade> = IIsolatedModulesListFacade & T

export interface IIsolatedModulesListFacade {
  readonly modules$: Observable<UIResource<IsolatedModuleInstalledMetadata[]>>

  updateModules(modules: UIResource<IsolatedModuleInstalledMetadata[]>, query: string | undefined)
  filterModules(query: string | undefined): void
}

export function isolatedModulesListFacade(injector: Injector): IsolatedModulesListFacade {
  return injector.get(ISOLATED_MODULES_LIST_FACADE_FACTORY)(injector)
}
