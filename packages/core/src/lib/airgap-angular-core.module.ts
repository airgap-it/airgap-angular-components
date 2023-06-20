import { Injector, ModuleWithProviders, NgModule } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'

import { ComponentsModule } from './components/components.module'
import { PipesModule } from './pipes/pipes.module'
import { AmountConverterPipe } from './pipes/amount-converter/amount-converter.pipe'
import { CurrencySymbolFacade, CURRENCY_SYMBOL_FACADE_FACTORY } from './components/currency-symbol/currency-symbol.facade'
import {
  IsolatedModulesDetailsFacade,
  ISOLATED_MODULES_DETAILS_FACADE_FACTORY
} from './components/isolated-modules-details/isolated-modules-details.facade'
import {
  IsolatedModulesListFacade,
  ISOLATED_MODULES_LIST_FACADE_FACTORY
} from './components/isolated-modules-list/isolated-modules-list.facade'
import {
  IsolatedModulesListPageFacade,
  ISOLATED_MODULES_LIST_PAGE_FACADE_FACTORY
} from './pages/isolated-modules-list/isolated-modules-list.facade'

export interface AirGapAngularCoreModuleConfig {
  factories?: {
    currencySymbolFacade?: (injector: Injector) => CurrencySymbolFacade

    isolatedModulesDetailsFacade?: (injector: Injector) => IsolatedModulesDetailsFacade

    isolatedModulesListFacade?: (injector: Injector) => IsolatedModulesListFacade
    isolatedModulesListPageFacade?: (injector: Injector) => IsolatedModulesListPageFacade
  }
}

@NgModule({
  declarations: [],
  imports: [
    TranslateModule.forChild({
      extend: true,
      isolate: false
    }),
    ComponentsModule,
    PipesModule
  ],
  exports: [ComponentsModule, PipesModule],
  providers: [AmountConverterPipe]
})
export class AirGapAngularCoreModule {
  public static factories: AirGapAngularCoreModuleConfig['factories'] = {}

  public static forRoot(config: AirGapAngularCoreModuleConfig = {}): ModuleWithProviders<AirGapAngularCoreModule> {
    const createFactoryPlaceholder = (target: keyof AirGapAngularCoreModuleConfig['factories']) => {
      return (_injector: Injector) => {
        throw new Error(`Factory for \`${target.charAt(0).toUpperCase() + target.slice(1)}\` not found.`)
      }
    }

    AirGapAngularCoreModule.factories = {
      currencySymbolFacade: createFactoryPlaceholder('currencySymbolFacade'),
      isolatedModulesDetailsFacade: createFactoryPlaceholder('isolatedModulesDetailsFacade'),
      isolatedModulesListFacade: createFactoryPlaceholder('isolatedModulesListFacade'),
      isolatedModulesListPageFacade: createFactoryPlaceholder('isolatedModulesListPageFacade'),
      ...(config?.factories ?? {})
    }

    return {
      ngModule: AirGapAngularCoreModule,
      providers: [
        { provide: CURRENCY_SYMBOL_FACADE_FACTORY, useValue: AirGapAngularCoreModule.factories.currencySymbolFacade },
        { provide: ISOLATED_MODULES_DETAILS_FACADE_FACTORY, useValue: AirGapAngularCoreModule.factories.isolatedModulesDetailsFacade },
        { provide: ISOLATED_MODULES_LIST_FACADE_FACTORY, useValue: AirGapAngularCoreModule.factories.isolatedModulesListFacade },
        { provide: ISOLATED_MODULES_LIST_PAGE_FACADE_FACTORY, useValue: AirGapAngularCoreModule.factories.isolatedModulesListPageFacade }
      ]
    }
  }
}
