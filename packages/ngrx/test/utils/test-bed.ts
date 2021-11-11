/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestModuleMetadata } from '@angular/core/testing'
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular'
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core'

import { QRCodeModule } from 'angularx-qrcode'
import { Storage } from '@ionic/storage'

import { ComponentsModule } from '../../src/lib/components/components.module'

export class TestBedUtils {
  public moduleDef(moduleMedatada: TestModuleMetadata, useIonicOnlyTestBed: boolean = false): TestModuleMetadata {
    const mandatoryDeclarations: any[] = []
    const mandatoryImports: any[] = [
      CommonModule,
      IonicModule,
      ComponentsModule,
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
      }),
      QRCodeModule
    ]
    const mandatoryProviders: any[] = []

    moduleMedatada.declarations = [...(moduleMedatada.declarations ?? []), ...mandatoryDeclarations]
    moduleMedatada.imports = [...(moduleMedatada.imports ?? []), ...mandatoryImports]
    moduleMedatada.providers = [...(moduleMedatada.providers ?? []), ...mandatoryProviders]

    return moduleMedatada
  }
}
