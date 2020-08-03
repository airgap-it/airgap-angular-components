import { NgModule } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core'
import { ComponentsModule } from './components/components.module'
import { PipesModule } from './pipes/pipes.module'
import { AmountConverterPipe } from './pipes/amount-converter/amount-converter.pipe'
import { AirGapCommonTranslateLoader } from './translation/AirGapCommonTranslateLoader'

export function createTranslateLoader(httpClient: HttpClient): AirGapCommonTranslateLoader {
  return new AirGapCommonTranslateLoader(httpClient)
}

@NgModule({
  declarations: [],
  imports: [
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      },
      isolate: false
    }),
    ComponentsModule, 
    PipesModule
  ],
  exports: [ComponentsModule, PipesModule],
  providers: [AmountConverterPipe]
})
export class AirGapCommonCoreModule {}
