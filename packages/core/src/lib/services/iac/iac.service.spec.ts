import { async, TestBed } from '@angular/core/testing'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { IACService } from './iac.service'

describe('IACService', () => {
  let service: IACService

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    TestBed.configureTestingModule(testBedUtils.moduleDef({}))
    service = TestBed.inject(IACService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
