import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { AccountSelectionComponent } from './account-selection.component'

describe('AccountSelectionComponent', () => {
  let component: AccountSelectionComponent
  let fixture: ComponentFixture<AccountSelectionComponent>

  let testBedUtils: TestBedUtils

  beforeEach(
    waitForAsync(async () => {
      testBedUtils = new TestBedUtils()
      await TestBed.configureTestingModule(
        testBedUtils.moduleDef({
          declarations: []
        })
      ).compileComponents()
    })
  )

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountSelectionComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
