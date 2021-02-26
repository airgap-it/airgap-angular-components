import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { TitledAddressComponent } from './titled-address.component'

describe('TitledAddressComponent', () => {
  let component: TitledAddressComponent
  let fixture: ComponentFixture<TitledAddressComponent>

  let testBedUtils: TestBedUtils

  beforeEach(
    waitForAsync(async () => {
      testBedUtils = new TestBedUtils()
      await TestBed.configureTestingModule(testBedUtils.moduleDef({})).compileComponents()
    })
  )

  beforeEach(() => {
    fixture = TestBed.createComponent(TitledAddressComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
