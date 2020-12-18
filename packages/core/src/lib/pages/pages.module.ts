import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { IonicModule } from '@ionic/angular'
import { TranslateModule } from '@ngx-translate/core'
import { PipesModule } from '../pipes/pipes.module'
import { FormsModule } from '@angular/forms'
import { QrSettingsPage } from '../pages/qr-settings/qr-settings.page'

@NgModule({
  declarations: [QrSettingsPage],
  imports: [CommonModule, IonicModule, TranslateModule, PipesModule, FormsModule],
  exports: [QrSettingsPage]
})
export class PagesModule {}
