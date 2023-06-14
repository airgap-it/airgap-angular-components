import { InjectionToken, Injector } from '@angular/core'
import { Observable } from 'rxjs'
import { AirGapAngularCoreModule } from '../../airgap-angular-core.module'
import { BaseFacade } from '../../base/base.facade'
import { IsolatedModuleManifest } from '../../types/isolated-modules/IsolatedModuleManifest'
import { IsolatedModuleMetadata } from '../../types/isolated-modules/IsolatedModuleMetadata'
import { UIResource } from '../../types/ui/UIResource'

export const ISOLATED_MODULES_DETAILS_FACADE = new InjectionToken<IsolatedModulesDetailsFacade>('IsolatedModulesDetailsFacade')
export type IsolatedModulesDetailsFacade<T extends BaseFacade = BaseFacade> = IIsolatedModulesListDetails & T

export interface IIsolatedModulesListDetails {
  readonly manifest$: Observable<UIResource<IsolatedModuleManifest>>
  readonly isVerified$: Observable<UIResource<boolean>>

  initWithData(metadata: IsolatedModuleMetadata | undefined): void
  onDataChanged(metadata: IsolatedModuleMetadata | undefined): void
}

export const isolatedModulesDetailsFacade = (injector: Injector): IsolatedModulesDetailsFacade => {
  const factory = AirGapAngularCoreModule.factories?.isolatedModulesDetailsFacade
  if (!factory) {
    throw new Error('Factory for `IsolatedModulesDetailsFacade` not found.')
  }

  return factory(injector)
}
