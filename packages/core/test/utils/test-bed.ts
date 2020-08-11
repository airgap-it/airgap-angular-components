/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestModuleMetadata } from '@angular/core/testing'
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular'
import { TranslateModule } from '@ngx-translate/core'

import { ComponentsModule } from '../../src/lib/components/components.module'
import { PipesModule } from '../../src/lib/pipes/pipes.module'

export class TestBedUtils {
  public moduleDef(moduleMedatada: TestModuleMetadata, useIonicOnlyTestBed: boolean = false): TestModuleMetadata {
    const mandatoryDeclarations: any[] = []
    const mandatoryImports: any[] = [CommonModule, IonicModule, ComponentsModule, TranslateModule.forRoot()]
    const mandatoryProviders: any[] = []

    if (!useIonicOnlyTestBed) {
      mandatoryImports.push(PipesModule)
    }

    moduleMedatada.declarations = [...(moduleMedatada.declarations ?? []), ...mandatoryDeclarations]
    moduleMedatada.imports = [...(moduleMedatada.imports ?? []), ...mandatoryImports]
    moduleMedatada.providers = [...(moduleMedatada.providers ?? []), ...mandatoryProviders]

    return moduleMedatada
  }
}
