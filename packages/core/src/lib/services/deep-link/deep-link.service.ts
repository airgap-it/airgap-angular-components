import { Injectable, Inject } from '@angular/core'
import { AppPlugin } from '@capacitor/core'

import { AppConfig, APP_CONFIG } from '../../config/app-config'
import { APP_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { serializedDataToUrlString } from '../../utils/utils'
import { UiEventElementsService } from '../ui-event-elements/ui-event-elements.service'
// import { ErrorCategory, handleErrorLocal } from '../error-handler/error-handler.service'

@Injectable({
  providedIn: 'root'
})
export class DeepLinkService {
  constructor(
    private readonly uiEventElementsService: UiEventElementsService,
    @Inject(APP_PLUGIN) private readonly app: AppPlugin,
    @Inject(APP_CONFIG) private readonly appConfig: AppConfig
  ) {}

  public sameDeviceDeeplink(url: string = `${this.appConfig.otherApp.urlScheme}://`): Promise<void> {
    const deeplinkUrl: string = typeof url === 'string' && url.includes('://') ? url : serializedDataToUrlString(url)

    return new Promise((resolve, reject) => {
      this.app
        .openUrl({ url: deeplinkUrl })
        .then(() => {
          console.log('Deeplink called')
          resolve()
        })
        .catch((error) => {
          console.error('deeplink error', deeplinkUrl, error)
          this.uiEventElementsService.showOtherAppNotFoundAlert().catch(console.error)

          reject()
        })
    })
  }
}
