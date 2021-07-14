import { Injectable, Inject } from '@angular/core'
import { AppPlugin } from '@capacitor/core'

import { AppConfig, APP_CONFIG } from '../../config/app-config'
import { APP_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { UiEventElementsService } from '../ui-event-elements/ui-event-elements.service'
import { IACMessageDefinitionObjectV3 } from '@airgap/coinlib-core'
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
    @Inject(APP_PLUGIN) private readonly app: AppPlugin,
    @Inject(APP_CONFIG) private readonly appConfig: AppConfig
  ) {}

  public async sameDeviceDeeplink(data: string | IACMessageDefinitionObjectV3[]): Promise<void> {
    let deeplinkUrl = ''
    if (data && typeof data !== 'string') {
      const generator: IACQrGenerator = this.serializerService.useV3 ? new SerializerV3Generator() : new SerializerV2Generator()
      await generator.create(data, Number.MAX_SAFE_INTEGER)
      deeplinkUrl = await generator.getSingle(this.appConfig.otherApp.urlScheme)
    } else if (typeof data === 'string') {
      deeplinkUrl = data
    }

    return new Promise((resolve, reject) => {
      this.app
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
}
