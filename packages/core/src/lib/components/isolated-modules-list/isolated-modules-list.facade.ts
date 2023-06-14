import { InjectionToken, Injector } from '@angular/core'
import { Observable } from 'rxjs'
import { AirGapAngularCoreModule } from '../../airgap-angular-core.module'
import { BaseFacade } from '../../base/base.facade'
import { IsolatedModuleInstalledMetadata } from '../../types/isolated-modules/IsolatedModuleMetadata'
import { UIResource } from '../../types/ui/UIResource'

export const ISOLATED_MODULES_LIST_FACADE = new InjectionToken<IsolatedModulesListFacade>('IsolatedModulesListFacade')
export type IsolatedModulesListFacade<T extends BaseFacade = BaseFacade> = IIsolatedModulesListFacade & T

export interface IIsolatedModulesListFacade {
  readonly modules$: Observable<UIResource<IsolatedModuleInstalledMetadata[]>>

  updateModules(modules: UIResource<IsolatedModuleInstalledMetadata[]>, query: string | undefined)
  filterModules(query: string | undefined): void
}

export const isolatedModulesListFacade = (injector: Injector): IsolatedModulesListFacade => {
  const factory = AirGapAngularCoreModule.factories?.isolatedModulesListFacade
  if (!factory) {
    throw new Error('Factory for `IsolatedModulesListFacade` not found.')
  }

  return factory(injector)
}
