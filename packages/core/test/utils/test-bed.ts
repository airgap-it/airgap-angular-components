/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestModuleMetadata } from '@angular/core/testing'
import { CommonModule } from '@angular/common'
import { IonicModule } from '@ionic/angular'
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core'

import { QRCodeModule } from 'angularx-qrcode'
import { Storage } from '@ionic/storage'
import { ComponentsModule } from '../../src/lib/components/components.module'
import { PipesModule } from '../../src/lib/pipes/pipes.module'
import { APP_CONFIG, AppConfig } from '../../src/lib/config/app-config'
import { FILESYSTEM_PLUGIN, ISOLATED_MODULES_PLUGIN, ZIP_PLUGIN } from '../../src/lib/capacitor-plugins/injection-tokens'
import { IsolatedModules } from '../../src/lib/capacitor-plugins/isolated-modules/isolated-modules.plugin'
import { StorageMock } from './storage-mock'
import { FilesystemPluginMock, ZipPluginMock } from './plugins-mock'

export class TestBedUtils {
  public moduleDef(moduleMedatada: TestModuleMetadata, useIonicOnlyTestBed: boolean = false): TestModuleMetadata {
    const appConfig: AppConfig = {
      // Remember that translations use these keys as well
      app: {
        name: 'TestApp',
        urlScheme: 'testapp',
        universalLink: 'testapp.airgap.it'
      },
      otherApp: {
        name: 'OtherApp',
        urlScheme: 'otherapp',
        universalLink: 'otherapp.airgap.it'
      }
    }

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
    const mandatoryProviders: any[] = [
      { provide: Storage, useClass: StorageMock },
      { provide: APP_CONFIG, useValue: appConfig },
      { provide: ISOLATED_MODULES_PLUGIN, useValue: new IsolatedModules() },
      { provide: FILESYSTEM_PLUGIN, useValue: new FilesystemPluginMock() },
      { provide: ZIP_PLUGIN, useValue: new ZipPluginMock() }
    ]

    if (!useIonicOnlyTestBed) {
      mandatoryImports.push(PipesModule)
    }

    moduleMedatada.declarations = [...(moduleMedatada.declarations ?? []), ...mandatoryDeclarations]
    moduleMedatada.imports = [...(moduleMedatada.imports ?? []), ...mandatoryImports]
    moduleMedatada.providers = [...(moduleMedatada.providers ?? []), ...mandatoryProviders]

    return moduleMedatada
  }
}
