import { TestBed } from '@angular/core/testing'
import { Storage } from '@ionic/storage'
import { StorageMock } from '../../../../test/utils/storage-mock'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { SerializerService } from './serializer.service'

describe('SerializerService', () => {
  let service: SerializerService
  let testBedUtils: TestBedUtils

  beforeEach(() => {
    testBedUtils = new TestBedUtils()

    TestBed.configureTestingModule(testBedUtils.moduleDef({ providers: [{ provide: Storage, useValue: StorageMock }] }))
    service = TestBed.inject(SerializerService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
