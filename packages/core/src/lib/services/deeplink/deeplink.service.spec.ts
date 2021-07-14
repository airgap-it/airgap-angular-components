import { TestBed } from '@angular/core/testing'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { APP_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { AppPluginMock } from '../../../../test/utils/plugins-mock'
import { DeeplinkService } from './deeplink.service'
import { IACMessageDefinitionObjectV3, MainProtocolSymbols } from '@airgap/coinlib-core'

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
    const obj: IACMessageDefinitionObjectV3 = {
      id: 59603142,
      protocol: 'xtz' as MainProtocolSymbols,
      type: 5,
      payload: {
        publicKey: '9430c2ac8fe1403c6cbbee3a98b19f3f3bbdd89d0659b3eb6e4106a5cbe41351',
        transaction: {
          binaryTransaction:
            '28d002bb013534db9fb47ca511ccddf73864e764821588f4b2239053712381c56c0016e64994c2ddbd293695b63e4cade029d3c8b5e3f103a0b13a930b00e0cb06000016e64994c2ddbd293695b63e4cade029d3c8b5e300'
        },
        callbackURL: 'airgap-wallet://?d='
      }
    }

    service.sameDeviceDeeplink([obj])
  })
})
