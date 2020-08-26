import { Injectable, Inject } from '@angular/core'
import { ClipboardPlugin } from '@capacitor/core'

// TODO: import { ErrorCategory, handleErrorLocal } from './../error-handler/error-handler.service'
import { CLIPBOARD_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { UiEventService } from '../ui-event/ui-event.service'

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  constructor(private readonly uiEventService: UiEventService, @Inject(CLIPBOARD_PLUGIN) private readonly clipboard: ClipboardPlugin) {}

  public async copy(text: string): Promise<void> {
    return this.clipboard.write({
      // eslint-disable-next-line id-blacklist
      string: text
    })
  }

  public async copyAndShowToast(text: string, toastMessage: string = 'clipboard.toast.success_text'): Promise<void> {
    try {
      await this.copy(text)
      await this.showToast(toastMessage)
    } catch (copyError) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy: ', copyError)
    }
  }

  public async paste(): Promise<string> {
    try {
      const text = await this.clipboard.read()

      return text.value
    } catch (pasteError) {
      // eslint-disable-next-line no-console
      console.error('Failed to paste: ', pasteError)
      throw pasteError
    }
  }

  private async showToast(message: string) {
    await this.uiEventService.showTranslatedToast({
      message,
      duration: 1000,
      position: 'top',
      buttons: [
        {
          text: 'clipboard.toast.ok_label',
          role: 'cancel'
        }
      ]
    })
  }
}
