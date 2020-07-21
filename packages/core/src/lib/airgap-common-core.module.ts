import { NgModule } from '@angular/core'
import { ComponentsModule } from './components/components.module'
import { PipesModule } from './pipes/pipes.module'
import { AmountConverterPipe } from './pipes/amount-converter/amount-converter.pipe'

@NgModule({
  declarations: [],
  imports: [
    ComponentsModule, 
    PipesModule
  ],
  exports: [ComponentsModule, PipesModule],
  providers: [AmountConverterPipe]
})
export class AirGapCommonCoreModule {}
