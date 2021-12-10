import { BaseFacade, UIAction, UIActionStatus, UiEventService } from '@airgap/angular-core'
import { ToastOptions } from '@ionic/core'
import { ComponentStore } from '@ngrx/component-store'
import { Store } from '@ngrx/store'

export interface FacadeTypes {
  Toast: any
}

export abstract class BaseNgRxFacade<S extends Store | ComponentStore<any>, T extends FacadeTypes = any> extends BaseFacade {
  protected toastElement: HTMLIonToastElement | undefined

  constructor(protected readonly store: S, protected readonly uiEventService?: UiEventService) {
    super()
  }

  protected async showOrHideToast(toast: UIAction<T['Toast']> | undefined): Promise<void> {
    if (this.uiEventService === undefined) {
      return
    }

    // TODO: Move error sentries to common components and catch toast errors

    this.toastElement?.dismiss()
    if (toast?.status === UIActionStatus.PENDING) {
      const defaultToastOptions: ToastOptions = {
        duration: 3000,
        position: 'bottom'
      }
      this.toastElement = await this.uiEventService.getTranslatedToast({ ...defaultToastOptions, ...this.getToastData(toast.value) })
      this.toastElement.present()

      return this.toastElement.onWillDismiss().then(() => {
        this.onToastDismissed(toast)
      })
    } else {
      this.toastElement = undefined
    }
  }

  protected onToastDismissed(_toast: UIAction<T['Toast']>): void {
    throw new Error('`onToastDismissed` not implemented')
  }

  protected getToastData(_toast: T['Toast']): ToastOptions {
    throw new Error('`getToastData` not implemented')
  }
}
