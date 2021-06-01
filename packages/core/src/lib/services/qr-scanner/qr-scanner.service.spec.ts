import { TestBed } from '@angular/core/testing'
import { BarcodeScannerMock } from '../../../../test/utils/plugins-mock'
import { TestBedUtils } from '../../../../test/utils/test-bed'
import { BARCODE_SCANNER_PLUGIN } from '../../capacitor-plugins/injection-tokens'

import { QrScannerService } from './qr-scanner.service'

describe('QrScannerService', () => {
  let service: QrScannerService

  let testBedUtils: TestBedUtils
  let barcodeScannerMock: BarcodeScannerMock

  beforeEach(() => {
    testBedUtils = new TestBedUtils()
    barcodeScannerMock = new BarcodeScannerMock()

    TestBed.configureTestingModule(
      testBedUtils.moduleDef({
        providers: [{ provide: BARCODE_SCANNER_PLUGIN, useValue: barcodeScannerMock }]
      })
    )
    service = TestBed.inject(QrScannerService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
