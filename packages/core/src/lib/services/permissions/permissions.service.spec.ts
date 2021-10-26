import { TestBed } from '@angular/core/testing'
import { Diagnostic } from '@ionic-native/diagnostic/ngx'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { PermissionsPluginMock } from '../../../../test/utils/plugins-mock'
import { PermissionsService } from './permissions.service'

describe('PermissionsService', () => {
  let service: PermissionsService

  let testBedUtils: TestBedUtils

  beforeEach(() => {
    testBedUtils = new TestBedUtils()

    TestBed.configureTestingModule(
      testBedUtils.moduleDef({
        providers: [Diagnostic]
      })
    )
    service = TestBed.inject(PermissionsService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
