import { NgModule } from '@angular/core'
import { CoreComponent } from './core.component'
import { ComponentsModule } from './components/components.module'

@NgModule({
  declarations: [CoreComponent],
  imports: [ComponentsModule],
  exports: [CoreComponent, ComponentsModule]
})
export class CoreModule {}
