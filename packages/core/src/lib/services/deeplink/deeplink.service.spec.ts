import { TestBed } from '@angular/core/testing'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { APP_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { AppPluginMock } from '../../../../test/utils/plugins-mock'
import { DeeplinkService } from './deeplink.service'

describe('DeeplinkService', () => {
  let service: DeeplinkService

  let testBedUtils: TestBedUtils

  beforeEach(() => {
    testBedUtils = new TestBedUtils()

    TestBed.configureTestingModule(
      testBedUtils.moduleDef({
        providers: [{ provide: APP_PLUGIN, useValue: new AppPluginMock() }]
      })
    )
    service = TestBed.inject(DeeplinkService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
