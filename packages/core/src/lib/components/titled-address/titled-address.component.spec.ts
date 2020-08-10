import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { TitledAddressComponent } from './titled-address.component'

describe('TitledAddressComponent', () => {
  let component: TitledAddressComponent
  let fixture: ComponentFixture<TitledAddressComponent>

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    TestBed.configureTestingModule(
      testBedUtils.moduleDef({
        declarations: []
      })
    ).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(TitledAddressComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
