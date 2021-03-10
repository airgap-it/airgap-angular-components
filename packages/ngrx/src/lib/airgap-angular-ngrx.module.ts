import { NgModule } from '@angular/core'
import { StoreModule } from '@ngrx/store'

@NgModule({
  declarations: [],
  imports: [StoreModule.forFeature('shared', {})],
  exports: []
})
export class AirGapAngularNgRxModule {}
