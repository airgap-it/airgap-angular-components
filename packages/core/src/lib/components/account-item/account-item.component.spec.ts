import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { AccountItemComponent } from './account-item.component'

describe('AccountItemComponent', () => {
  let component: AccountItemComponent
  let fixture: ComponentFixture<AccountItemComponent>

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
    fixture = TestBed.createComponent(AccountItemComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
