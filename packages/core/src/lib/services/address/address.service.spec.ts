import { TestBed, waitForAsync } from '@angular/core/testing'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { AddressService } from './address.service'

describe('AddressService', () => {
  let service: AddressService

  let testBedUtils: TestBedUtils
  beforeEach(waitForAsync(async () => {
    testBedUtils = new TestBedUtils()
    await TestBed.configureTestingModule(testBedUtils.moduleDef({})).compileComponents()
    service = TestBed.inject(AddressService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
