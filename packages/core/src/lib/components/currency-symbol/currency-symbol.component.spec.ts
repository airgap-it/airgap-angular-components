import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { CurrencySymbolComponent } from './currency-symbol.component'

describe('CurrencySymbolComponent', () => {
  let component: CurrencySymbolComponent
  let fixture: ComponentFixture<CurrencySymbolComponent>

  let testBedUtils: TestBedUtils

  beforeEach(
    waitForAsync(async () => {
      testBedUtils = new TestBedUtils()
      await TestBed.configureTestingModule(testBedUtils.moduleDef({})).compileComponents()
    })
  )

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrencySymbolComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
