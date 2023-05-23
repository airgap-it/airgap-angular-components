import { TestBed, waitForAsync } from '@angular/core/testing'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { TransactionService } from './transaction.service'

describe('TransactionService', () => {
  let service: TransactionService

  let testBedUtils: TestBedUtils

  beforeEach(waitForAsync(async () => {
    testBedUtils = new TestBedUtils()
    await TestBed.configureTestingModule(testBedUtils.moduleDef({})).compileComponents()
    service = TestBed.inject(TransactionService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
