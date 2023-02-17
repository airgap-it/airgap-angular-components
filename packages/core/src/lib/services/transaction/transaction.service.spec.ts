import { TestBed } from '@angular/core/testing'

import { ISOLATED_MODULES_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { IsolatedModules } from '../../capacitor-plugins/isolated-modules/isolated-modules.plugin'

import { TransactionService } from './transaction.service'

describe('TransactionService', () => {
  let service: TransactionService

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ISOLATED_MODULES_PLUGIN, useValue: new IsolatedModules() }]
    })
    service = TestBed.inject(TransactionService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
