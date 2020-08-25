import { async, TestBed } from '@angular/core/testing'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { IACHistoryService } from './iac-history.service'

describe('IACHistoryService', () => {
  let service: IACHistoryService

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    TestBed.configureTestingModule(testBedUtils.moduleDef({}))
    service = TestBed.inject(IACHistoryService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
