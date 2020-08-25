import { async, TestBed } from '@angular/core/testing'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { UiEventService } from './ui-event.service'

describe('UiEventService', () => {
  let service: UiEventService

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    TestBed.configureTestingModule(testBedUtils.moduleDef({}))
    service = TestBed.inject(UiEventService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
