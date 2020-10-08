import { TestBed } from '@angular/core/testing'
import { Diagnostic } from '@ionic-native/diagnostic/ngx'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { PERMISSIONS_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { PermissionsService } from './permissions.service'
import { PermissionsPluginMock } from '../../../../test/utils/plugins-mock'

describe('PermissionsService', () => {
  let service: PermissionsService

  let testBedUtils: TestBedUtils

  beforeEach(() => {
    testBedUtils = new TestBedUtils()

    TestBed.configureTestingModule(
      testBedUtils.moduleDef({
        providers: [Diagnostic, { provide: PERMISSIONS_PLUGIN, useClass: PermissionsPluginMock }]
      })
    )
    service = TestBed.inject(PermissionsService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
