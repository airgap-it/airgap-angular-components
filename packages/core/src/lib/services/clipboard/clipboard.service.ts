import { Injectable, Inject } from '@angular/core'
import { ClipboardPlugin } from '@capacitor/clipboard'

// TODO: import { ErrorCategory, handleErrorLocal } from './../error-handler/error-handler.service'
import { CLIPBOARD_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { UiEventElementsService } from '../ui-event-elements/ui-event-elements.service'

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  constructor(
    private readonly uiEventElementService: UiEventElementsService,
    @Inject(CLIPBOARD_PLUGIN) private readonly clipboard: ClipboardPlugin
  ) {}

  public async copy(text: string): Promise<void> {
    return this.clipboard.write({
      // eslint-disable-next-line id-blacklist
      string: text
    })
  }

  public async copyAndShowToast(text: string, toastMessage?: string): Promise<void> {
    try {
      await this.copy(text)
      await this.uiEventElementService.showSuccessfullyCopiedToClipboardToast(toastMessage)
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
}
