import { TestBed } from '@angular/core/testing'

import { KeyPairService } from './key-pair.service'

describe('KeypairService', () => {
  let service: KeyPairService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(KeyPairService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
