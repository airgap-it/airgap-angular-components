import { NgModule } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'

import { ComponentsModule } from './components/components.module'
import { PipesModule } from './pipes/pipes.module'
import { AmountConverterPipe } from './pipes/amount-converter/amount-converter.pipe'
import { PagesModule } from './pages/pages.module'

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
  exports: [ComponentsModule, PipesModule, PagesModule],
  providers: [AmountConverterPipe]
})
export class AirGapAngularCoreModule {}
