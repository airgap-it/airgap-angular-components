import { NgModule } from '@angular/core'
import { TranslateModule } from '@ngx-translate/core'
import { QRCodeModule } from 'angularx-qrcode'

import { ComponentsModule } from './components/components.module'
import { PipesModule } from './pipes/pipes.module'
import { AmountConverterPipe } from './pipes/amount-converter/amount-converter.pipe'
import { QrComponent } from './components/qr/qr.component'

@NgModule({
  declarations: [QrComponent],
  imports: [
    TranslateModule.forChild({
      extend: true,
      isolate: false
    }),
    ComponentsModule,
    PipesModule,
    QRCodeModule
  ],
  exports: [ComponentsModule, PipesModule],
  providers: [AmountConverterPipe]
})
export class AirGapAngularCoreModule {}
