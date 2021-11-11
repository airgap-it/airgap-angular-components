import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { CurrencySymbolNgRxComponent } from './currency-symbol.component'

describe('CurrencySymbolComponent', () => {
  let component: CurrencySymbolNgRxComponent
  let fixture: ComponentFixture<CurrencySymbolNgRxComponent>

  let testBedUtils: TestBedUtils

  beforeEach(
    waitForAsync(async () => {
      testBedUtils = new TestBedUtils()
      await TestBed.configureTestingModule(testBedUtils.moduleDef({})).compileComponents()
    })
  )

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrencySymbolNgRxComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
