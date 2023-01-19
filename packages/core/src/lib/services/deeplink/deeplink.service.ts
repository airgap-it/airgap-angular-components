import { IACMessageDefinitionObjectV3 } from '@airgap/serializer'
import { Injectable, Inject } from '@angular/core'
import { AppLauncherPlugin } from '@capacitor/app-launcher'

import { AppConfig, APP_CONFIG } from '../../config/app-config'
import { APP_LAUNCHER_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { UiEventElementsService } from '../ui-event-elements/ui-event-elements.service'
import { IACQrGenerator } from '../iac/qr-generator'
import { SerializerV3Generator } from '../qr/qr-generators/serializer-v3-generator'
import { SerializerService } from '../serializer/serializer.service'
import { SerializerV2Generator } from '../qr/qr-generators/serializer-v2-generator'

@Injectable({
  providedIn: 'root'
})
export class DeeplinkService {
  constructor(
    private readonly uiEventElementsService: UiEventElementsService,
    private readonly serializerService: SerializerService,
    @Inject(APP_LAUNCHER_PLUGIN) private readonly appLauncher: AppLauncherPlugin,
    @Inject(APP_CONFIG) private readonly appConfig: AppConfig
  ) {}

  public async sameDeviceDeeplink(data: string | IACMessageDefinitionObjectV3[]): Promise<void> {
    const deeplinkUrl = await this.generateDeepLinkUrl(data)

    return new Promise((resolve, reject) => {
      this.appLauncher
        .openUrl({ url: deeplinkUrl })
        .then(() => {
          // eslint-disable-next-line no-console
          console.log('Deeplink called', deeplinkUrl)
          resolve()
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('deeplink error', deeplinkUrl, error)
          // eslint-disable-next-line no-console
          this.uiEventElementsService.showOtherAppNotFoundAlert().catch(console.error)

          reject()
        })
    })
  }

  public async generateDeepLinkUrl(data: string | IACMessageDefinitionObjectV3[]): Promise<string> {
    let generator: IACQrGenerator
    if (data && typeof data !== 'string') {
      try {
        generator = this.serializerService.useV3 ? new SerializerV3Generator() : new SerializerV2Generator()
        await generator.create(data, Number.MAX_SAFE_INTEGER)
      } catch (error) {
        try {
          generator = this.serializerService.useV3 ? new SerializerV2Generator() : new SerializerV3Generator()
          await generator.create(data, Number.MAX_SAFE_INTEGER)
        } catch (error) {
          this.uiEventElementsService.invalidDeeplinkAlert().catch(console.error)
        }
      }

      return await generator!.getSingle(this.appConfig.otherApp.urlScheme)
    } else if (typeof data === 'string') {
      return data
    }

    return ''
  }
}
