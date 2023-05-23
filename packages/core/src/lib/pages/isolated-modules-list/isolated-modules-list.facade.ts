import { InjectionToken, Injector } from '@angular/core'
import { Observable } from 'rxjs'
import { AirGapAngularCoreModule } from '../../airgap-angular-core.module'
import { BaseFacade } from '../../base/base.facade'
import { IsolatedModuleInstalledMetadata } from '../../types/isolated-modules/IsolatedModuleMetadata'
import { UIResource } from '../../types/ui/UIResource'

export const ISOLATED_MODULES_LIST_PAGE_FACADE = new InjectionToken<IsolatedModulesListPageFacade>('IsolatedModulesListPageFacade')
export type IsolatedModulesListPageFacade<T extends BaseFacade = BaseFacade> = IIsolatedModulesListPageFacade & T

export interface IIsolatedModulesListPageFacade {
  readonly modules$: Observable<UIResource<IsolatedModuleInstalledMetadata[]>>
  readonly filter$: Observable<string | undefined>

  onViewWillEnter(): void
  onFilterQueryChanged(query: string | undefined): void
}

export const isolatedModulesListPageFacade = (injector: Injector): IsolatedModulesListPageFacade => {
  const factory = AirGapAngularCoreModule.factories?.isolatedModulesListPageFacade
  if (!factory) {
    throw new Error('Factory for `IsolatedModulesListPageFacade` not found.')
  }

  return factory(injector)
}
