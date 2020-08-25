import { TestBed, async } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { ClipboardService } from './clipboard.service'

describe('ClipboardService', () => {
  let service: ClipboardService
  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    TestBed.configureTestingModule(testBedUtils.moduleDef({}))
    service = TestBed.inject(ClipboardService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
