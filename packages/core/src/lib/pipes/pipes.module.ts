import { NgModule } from '@angular/core'
import { AmountConverterPipe } from './amount-converter/amount-converter.pipe';
import { FeeConverterPipe } from './fee-converter/fee-converter.pipe'

@NgModule({
  declarations: [AmountConverterPipe, FeeConverterPipe],
  imports: [],
  exports: [AmountConverterPipe, FeeConverterPipe]
})
export class PipesModule {}