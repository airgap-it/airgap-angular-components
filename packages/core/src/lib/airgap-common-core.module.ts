import { NgModule } from '@angular/core'
import { ComponentsModule } from './components/components.module'
import { PipesModule } from './pipes/pipes.module'
import { ProtocolService } from './services/protocol/protocol.service'
import { AmountConverterPipe } from './pipes/amount-converter/amount-converter.pipe'

@NgModule({
  declarations: [],
  imports: [ComponentsModule, PipesModule],
  exports: [ComponentsModule, PipesModule],
  providers: [
    ProtocolService,
    AmountConverterPipe
  ]
})
export class AirGapCommonCoreModule {}
