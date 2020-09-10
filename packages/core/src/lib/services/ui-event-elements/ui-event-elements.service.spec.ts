import { async, TestBed } from '@angular/core/testing'
import { AlertController, LoadingController, ToastController } from '@ionic/angular'
import { AlertControllerMock, LoadingControllerMock, ToastControllerMock } from '../../../../test/utils/ionic-mocks'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { UiEventElementsService } from './ui-event-elements.service'

describe('UiEventElementsService', () => {
  let service: UiEventElementsService

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
    service = TestBed.inject(UiEventElementsService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  // TODO: Enable this and test that every alert/toast/loader has all its properties translated to all languages
  // it('should not have untranslated strings', async () => {
  //   const showToastSpy = spyOn((service as any).uiEventService, 'showTranslatedToast')

  //   await service.showSuccessfullyCopiedToClipboardToast()
  //   expect(showToastSpy).toHaveBeenCalledTimes(1)
  //   expect(toastControllerMock.create).toHaveBeenCalledTimes(1)
  //   const [optionsBefore] = showToastSpy.calls.argsFor(0)
  //   const [optionsAfter] = toastControllerMock.create.calls.argsFor(0)
  //   expect((optionsBefore as any).message).not.toBe(optionsAfter.message)
  // })
})
