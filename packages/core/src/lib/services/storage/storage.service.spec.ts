import { async, TestBed } from '@angular/core/testing'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { InternalStorageService } from './storage.service'

describe('InternalStorageService', () => {
  let service: InternalStorageService

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    TestBed.configureTestingModule(testBedUtils.moduleDef({}))
    service = TestBed.inject(InternalStorageService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
