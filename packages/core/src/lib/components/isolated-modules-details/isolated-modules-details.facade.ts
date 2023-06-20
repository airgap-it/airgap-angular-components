import { InjectionToken, Injector } from '@angular/core'
import { Observable } from 'rxjs'
import { BaseFacade } from '../../base/base.facade'
import { IsolatedModuleManifest } from '../../types/isolated-modules/IsolatedModuleManifest'
import { IsolatedModuleMetadata } from '../../types/isolated-modules/IsolatedModuleMetadata'
import { UIResource } from '../../types/ui/UIResource'

export const ISOLATED_MODULES_DETAILS_FACADE = new InjectionToken<IsolatedModulesDetailsFacade>('IsolatedModulesDetailsFacade')
export const ISOLATED_MODULES_DETAILS_FACADE_FACTORY = new InjectionToken<(injector: Injector) => IsolatedModulesDetailsFacade>(
  'IsolatedModulesDetailsFacadeFactory'
)
export type IsolatedModulesDetailsFacade<T extends BaseFacade = BaseFacade> = IIsolatedModulesListDetails & T

export interface IIsolatedModulesListDetails {
  readonly manifest$: Observable<UIResource<IsolatedModuleManifest>>
  readonly isVerified$: Observable<UIResource<boolean>>

  initWithData(metadata: IsolatedModuleMetadata | undefined): void
  onDataChanged(metadata: IsolatedModuleMetadata | undefined): void
}

export function isolatedModulesDetailsFacade(injector: Injector): IsolatedModulesDetailsFacade {
  return injector.get(ISOLATED_MODULES_DETAILS_FACADE_FACTORY)(injector)
}
