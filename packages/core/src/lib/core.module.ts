import { NgModule } from '@angular/core'
import { CoreComponent } from './core.component'
import { ComponentsModule } from './components/components.module'
import { PipesModule } from './pipes/pipes.module'

@NgModule({
  declarations: [CoreComponent],
  imports: [ComponentsModule, PipesModule],
  exports: [CoreComponent, ComponentsModule, PipesModule]
})
export class CoreModule {}
