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
import { AccountItemComponent } from './account-item/account-item.component'
import { AccountSelectionComponent } from './account-selection/account-selection.component'
import { QrComponent } from './qr/qr.component'
import { QRCodeModule } from 'angularx-qrcode'
import { FormsModule } from '@angular/forms'

@NgModule({
  declarations: [
    FromToComponent,
    IdenticonComponent,
    TitledTextComponent,
    TitledAddressComponent,
    CurrencySymbolComponent,
    NetworkBadgeComponent,
    QrComponent,
    AccountItemComponent,
    AccountSelectionComponent
  ],
  imports: [CommonModule, IonicModule, TranslateModule, MomentModule, PipesModule, QRCodeModule, FormsModule],
  exports: [
    FromToComponent,
    IdenticonComponent,
    TitledTextComponent,
    TitledAddressComponent,
    CurrencySymbolComponent,
    NetworkBadgeComponent,
    AccountItemComponent,
    AccountSelectionComponent,
    QrComponent
  ]
})
export class ComponentsModule { }
