import { async, TestBed } from '@angular/core/testing'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { SerializerService } from './serializer.service'

describe('SerializerService', () => {
  let service: SerializerService

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    TestBed.configureTestingModule(testBedUtils.moduleDef({}))
    service = TestBed.inject(SerializerService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
