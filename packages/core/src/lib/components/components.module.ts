import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from '@ionic/angular'
import { TranslateModule } from '@ngx-translate/core'
import { MomentModule } from 'ngx-moment'

import { PipesModule } from '../pipes/pipes.module'
import { CurrencySymbolComponent } from './currency-symbol/currency-symbol.component'
import { FromToComponent } from './from-to/from-to.component'
import { IdenticonComponent } from './identicon/identicon.component'
import { NetworkBadgeComponent } from './network-badge/network-badge.component'
import { TitledAddressComponent } from './titled-address/titled-address.component'
import { TitledTextComponent } from './titled-text/titled-text.component'
import { QrComponent } from './qr/qr.component'
import { QRCodeModule } from 'angularx-qrcode'

@NgModule({
  declarations: [
    FromToComponent,
    IdenticonComponent,
    TitledTextComponent,
    TitledAddressComponent,
    CurrencySymbolComponent,
    NetworkBadgeComponent,
    QrComponent
  ],
  imports: [CommonModule, IonicModule, TranslateModule, MomentModule, PipesModule, QRCodeModule],
  exports: [
    FromToComponent,
    IdenticonComponent,
    TitledTextComponent,
    TitledAddressComponent,
    CurrencySymbolComponent,
    NetworkBadgeComponent,
    QrComponent
  ]
})
export class ComponentsModule {}
