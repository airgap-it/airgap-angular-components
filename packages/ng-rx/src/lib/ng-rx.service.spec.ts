import { TestBed } from '@angular/core/testing'

import { NgRxService } from './ng-rx.service'

describe('NgRxService', () => {
  let service: NgRxService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(NgRxService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
