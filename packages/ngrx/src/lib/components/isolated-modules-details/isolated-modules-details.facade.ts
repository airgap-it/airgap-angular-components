import {
  IIsolatedModulesListDetails,
  IsolatedModuleManifest,
  IsolatedModuleMetadata,
  IsolatedModulesDetailsFacade,
  ISOLATED_MODULES_PLUGIN,
  UIResource
} from '@airgap/angular-core'
import { Injectable, Injector } from '@angular/core'
import { Observable } from 'rxjs'
import { BaseNgRxFacade } from '../../base/base-ngrx.facade'
import { IsolatedModulesDetailsStore } from './isolated-modules-details.store'

@Injectable()
export class IsolatedModulesDetailsNgRxFacade extends BaseNgRxFacade<IsolatedModulesDetailsStore> implements IIsolatedModulesListDetails {
  public readonly manifest$: Observable<UIResource<IsolatedModuleManifest>>
  public readonly isVerified$: Observable<UIResource<boolean>>

  constructor(store: IsolatedModulesDetailsStore) {
    super(store)

    this.manifest$ = this.store.select((state) => state.manifest)
    this.isVerified$ = this.store.select((state) => state.isVerified)
  }

  public initWithData(metadata: IsolatedModuleMetadata): void {
    this.store.loadModuleData(metadata)
  }

  public onDataChanged(metadata: IsolatedModuleMetadata): void {
    this.store.loadModuleData(metadata)
  }
}

export const isolatedModulesDetailsNgRxFacade = (injector: Injector): IsolatedModulesDetailsFacade => {
  return new IsolatedModulesDetailsNgRxFacade(new IsolatedModulesDetailsStore(injector.get(ISOLATED_MODULES_PLUGIN)))
}
