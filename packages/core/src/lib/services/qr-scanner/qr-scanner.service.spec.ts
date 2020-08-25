import { async, TestBed } from '@angular/core/testing'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { QrScannerService } from './qr-scanner.service'

describe('QrScannerService', () => {
  let service: QrScannerService

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    TestBed.configureTestingModule(testBedUtils.moduleDef({}))
    service = TestBed.inject(QrScannerService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
