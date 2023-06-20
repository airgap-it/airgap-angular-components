import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { TranslateModule } from '@ngx-translate/core'
import { QRCodeModule } from 'angularx-qrcode'
import { MomentModule } from 'ngx-moment'

@NgModule({
  declarations: [],
  imports: [CommonModule, IonicModule, TranslateModule, MomentModule, QRCodeModule, FormsModule],
  exports: []
})
export class ComponentsModule {}
