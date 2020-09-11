import { TestBed } from '@angular/core/testing'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { APP_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { AppPluginMock } from '../../../../test/utils/plugins-mock'
import { DeepLinkService } from './deep-link.service'

describe('DeepLinkService', () => {
  let service: DeepLinkService

  let testBedUtils: TestBedUtils

  beforeEach(() => {
    testBedUtils = new TestBedUtils()

    TestBed.configureTestingModule(
      testBedUtils.moduleDef({
        providers: [{ provide: APP_PLUGIN, useValue: new AppPluginMock() }]
      })
    )
    service = TestBed.inject(DeepLinkService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
