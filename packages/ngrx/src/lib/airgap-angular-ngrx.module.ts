import { NgModule } from '@angular/core'
import { StoreModule } from '@ngrx/store'
import { ComponentsModule } from './components/components.module'

@NgModule({
  declarations: [],
  imports: [
    StoreModule.forFeature('shared', {}),
    ComponentsModule
  ],
  exports: [ComponentsModule]
})
export class AirGapAngularNgRxModule {}
