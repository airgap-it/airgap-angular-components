import { Injector, ModuleWithProviders, NgModule } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'

import { ComponentsModule } from './components/components.module'
import { PipesModule } from './pipes/pipes.module'
import { AmountConverterPipe } from './pipes/amount-converter/amount-converter.pipe'
import { CurrencySymbolFacade } from './components/currency-symbol/currency-symbol.facade'

export interface AirGapAngularCoreModuleConfig {
  factories?: {
    currencySymbolFacade?: (injector: Injector) => CurrencySymbolFacade
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
    AirGapAngularCoreModule.factories = config?.factories ?? {}

    return {
      ngModule: AirGapAngularCoreModule
    }
  }
}
