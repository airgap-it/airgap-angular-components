import { async, TestBed } from '@angular/core/testing'
import { AlertController, LoadingController, ToastController } from '@ionic/angular'
import { AlertOptions, LoadingOptions, ToastOptions } from '@ionic/core'
import { AlertControllerMock, LoadingControllerMock, ToastControllerMock } from '../../../../test/utils/ionic-mocks'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { UiEventService } from './ui-event.service'

const defaultToastOptions = {
  duration: 2000
}
const defaultLoadingOptions = {
  backdropDismiss: false
}
const defaultAlertOptions = {
  backdropDismiss: true
}

describe('UiEventService', () => {
  let service: UiEventService

  let testBedUtils: TestBedUtils

  let alertControllerMock: AlertControllerMock
  let toastControllerMock: ToastControllerMock
  let loadingControllerMock: LoadingControllerMock

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    alertControllerMock = new AlertControllerMock()
    toastControllerMock = new ToastControllerMock()
    loadingControllerMock = new LoadingControllerMock()

    TestBed.configureTestingModule(
      testBedUtils.moduleDef({
        providers: [
          { provide: AlertController, useValue: alertControllerMock },
          { provide: ToastController, useValue: toastControllerMock },
          { provide: LoadingController, useValue: loadingControllerMock }
        ]
      })
    )
    service = TestBed.inject(UiEventService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('TranslatedToast', () => {
    it('should show a toast when options are empty', async () => {
      const options: ToastOptions = {}
      await service.showTranslatedToast(options)
      expect(toastControllerMock.create).toHaveBeenCalledTimes(1)
      expect(toastControllerMock.create).toHaveBeenCalledWith({ ...defaultToastOptions, ...options })
    })

    it('should show a partial toast', async () => {
      const options: ToastOptions = { header: 'source', message: 'source' }
      const translatedOptions: ToastOptions = {
        ...options,
        header: 'translated',
        message: 'translated'
      }
      await service.showTranslatedToast(options)
      expect(toastControllerMock.create).toHaveBeenCalledTimes(1)
      expect(toastControllerMock.create).toHaveBeenCalledWith({ ...defaultToastOptions, ...translatedOptions })
    })

    it('should show a fully translated toast', async () => {
      const options: ToastOptions = { header: 'source', message: 'source', buttons: ['source', { text: 'source' }] }
      const translatedOptions: ToastOptions = {
        ...options,
        header: 'translated',
        message: 'translated',
        buttons: ['translated', { text: 'translated' }]
      }
      await service.showTranslatedToast(options)
      expect(toastControllerMock.create).toHaveBeenCalledTimes(1)
      expect(toastControllerMock.create).toHaveBeenCalledWith({ ...defaultToastOptions, ...translatedOptions })
    })

    it('should show an untranslatable toast', async () => {
      const options: ToastOptions = { header: 'unknown', message: 'unknown', buttons: ['unknown', { text: 'unknown' }] }
      const translatedOptions: ToastOptions = {
        ...options,
        header: 'unknown',
        message: 'unknown',
        buttons: ['unknown', { text: 'unknown' }]
      }
      await service.showTranslatedToast(options)
      expect(toastControllerMock.create).toHaveBeenCalledTimes(1)
      expect(toastControllerMock.create).toHaveBeenCalledWith({ ...defaultToastOptions, ...translatedOptions })
    })
  })

  describe('TranslatedLoader', () => {
    it('should show a loader when options are empty', async () => {
      const options: LoadingOptions = {}
      await service.showTranslatedLoader(options)
      expect(loadingControllerMock.create).toHaveBeenCalledTimes(1)
      expect(loadingControllerMock.create).toHaveBeenCalledWith({ ...defaultLoadingOptions, ...options })
    })

    it('should show a partially loader', async () => {
      const options: LoadingOptions = { message: 'source' }
      const translatedOptions: ToastOptions = {
        ...options,
        message: 'translated'
      }
      await service.showTranslatedLoader(options)
      expect(loadingControllerMock.create).toHaveBeenCalledTimes(1)
      expect(loadingControllerMock.create).toHaveBeenCalledWith({ ...defaultLoadingOptions, ...translatedOptions })
    })

    it('should show a translated loader', async () => {
      const options: LoadingOptions = { message: 'source' }
      const translatedOptions: ToastOptions = {
        ...options,
        message: 'translated'
      }
      await service.showTranslatedLoader(options)
      expect(loadingControllerMock.create).toHaveBeenCalledTimes(1)
      expect(loadingControllerMock.create).toHaveBeenCalledWith({ ...defaultLoadingOptions, ...translatedOptions })
    })

    it('should show an untranslatable loader', async () => {
      const options: LoadingOptions = { message: 'unknown' }
      const translatedOptions: ToastOptions = {
        ...options,
        message: 'unknown'
      }
      await service.showTranslatedLoader(options)
      expect(loadingControllerMock.create).toHaveBeenCalledTimes(1)
      expect(loadingControllerMock.create).toHaveBeenCalledWith({ ...defaultLoadingOptions, ...translatedOptions })
    })
  })

  describe('TranslatedAlert', () => {
    it('should show an alert when options are empty', async () => {
      const options: LoadingOptions = {}
      await service.showTranslatedAlert(options)
      expect(alertControllerMock.create).toHaveBeenCalledTimes(1)
      expect(alertControllerMock.create).toHaveBeenCalledWith({ ...defaultAlertOptions, ...options })
    })

    it('should show a partially translated alert', async () => {
      const options: AlertOptions = {
        header: 'source',
        subHeader: 'source',
        message: 'source'
      }
      const translatedOptions: AlertOptions = {
        ...options,
        header: 'translated',
        subHeader: 'translated',
        message: 'translated'
      }
      await service.showTranslatedAlert(options)
      expect(alertControllerMock.create).toHaveBeenCalledTimes(1)
      expect(alertControllerMock.create).toHaveBeenCalledWith({ ...defaultAlertOptions, ...translatedOptions })
    })
  })

  it('should show a fully translated alert', async () => {
    const options: AlertOptions = {
      header: 'source',
      subHeader: 'source',
      message: 'source',
      inputs: [{ name: 'source', placeholder: 'source', value: 'source', label: 'source' }],
      buttons: ['source', { text: 'source' }]
    }
    const translatedOptions: AlertOptions = {
      ...options,
      header: 'translated',
      subHeader: 'translated',
      message: 'translated',
      inputs: [{ name: 'translated', placeholder: 'translated', value: 'translated', label: 'translated' }],
      buttons: ['translated', { text: 'translated' }]
    }
    await service.showTranslatedAlert(options)
    expect(alertControllerMock.create).toHaveBeenCalledTimes(1)
    expect(alertControllerMock.create).toHaveBeenCalledWith({ ...defaultAlertOptions, ...translatedOptions })
  })

  it('should show an untranslatable alert', async () => {
    const options: AlertOptions = {
      header: 'unknown',
      subHeader: 'unknown',
      message: 'unknown',
      inputs: [{ name: 'unknown', placeholder: 'unknown', value: 'unknown', label: 'unknown' }],
      buttons: ['unknown', { text: 'unknown' }]
    }
    const translatedOptions: AlertOptions = {
      ...options,
      header: 'unknown',
      subHeader: 'unknown',
      message: 'unknown',
      inputs: [{ name: 'unknown', placeholder: 'unknown', value: 'unknown', label: 'unknown' }],
      buttons: ['unknown', { text: 'unknown' }]
    }
    await service.showTranslatedAlert(options)
    expect(alertControllerMock.create).toHaveBeenCalledTimes(1)
    expect(alertControllerMock.create).toHaveBeenCalledWith({ ...defaultAlertOptions, ...translatedOptions })
  })
})
