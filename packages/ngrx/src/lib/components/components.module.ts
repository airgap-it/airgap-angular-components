import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from '@ionic/angular'
import { TranslateModule } from '@ngx-translate/core'
import { MomentModule } from 'ngx-moment'

import { QRCodeModule } from 'angularx-qrcode'
import { FormsModule } from '@angular/forms'

@NgModule({
  declarations: [],
  imports: [CommonModule, IonicModule, TranslateModule, MomentModule, QRCodeModule, FormsModule],
  exports: []
})
export class ComponentsModule {}
