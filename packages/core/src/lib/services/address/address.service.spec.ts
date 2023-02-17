import { TestBed } from '@angular/core/testing'
import { ISOLATED_MODULES_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { IsolatedModules } from '../../capacitor-plugins/isolated-modules/isolated-modules.plugin'

import { AddressService } from './address.service'

describe('AddressService', () => {
  let service: AddressService

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ISOLATED_MODULES_PLUGIN, useValue: new IsolatedModules() }]
    })
    service = TestBed.inject(AddressService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
