import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { AccountItemComponent } from './account-item.component'

describe('AccountItemComponent', () => {
  let component: AccountItemComponent
  let fixture: ComponentFixture<AccountItemComponent>

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
    fixture = TestBed.createComponent(AccountItemComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
