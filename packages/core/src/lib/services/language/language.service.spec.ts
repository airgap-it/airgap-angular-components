import { TestBed, async } from '@angular/core/testing'

import { LanguageService } from './language.service'
import { TestBedUtils } from '../../../../test/utils/test-bed'

describe('LanguageService', () => {
  let service: LanguageService

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    TestBed.configureTestingModule(testBedUtils.moduleDef({}))
    service = TestBed.inject(LanguageService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
