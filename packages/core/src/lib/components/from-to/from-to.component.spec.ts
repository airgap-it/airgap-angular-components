import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { FromToComponent } from './from-to.component'

describe('FromToComponent', () => {
  let component: FromToComponent
  let fixture: ComponentFixture<FromToComponent>

  let testBedUtils: TestBedUtils

  beforeEach(
    waitForAsync(async () => {
      testBedUtils = new TestBedUtils()
      await TestBed.configureTestingModule(testBedUtils.moduleDef({})).compileComponents()
    })
  )

  beforeEach(() => {
    fixture = TestBed.createComponent(FromToComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
