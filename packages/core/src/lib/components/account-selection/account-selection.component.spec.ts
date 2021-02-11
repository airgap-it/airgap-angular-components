import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { AccountSelectionComponent } from './account-selection.component'

describe('AccountSelectionComponent', () => {
  let component: AccountSelectionComponent
  let fixture: ComponentFixture<AccountSelectionComponent>

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
    fixture = TestBed.createComponent(AccountSelectionComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
