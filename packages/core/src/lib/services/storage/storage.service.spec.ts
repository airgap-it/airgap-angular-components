import { TestBed } from '@angular/core/testing'

import { InternalStorageService } from './storage.service'

describe('StorageService', () => {
  let service: InternalStorageService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(InternalStorageService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
