import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { TitledTextComponent } from './titled-text.component'

describe('TitledTextComponent', () => {
  let component: TitledTextComponent
  let fixture: ComponentFixture<TitledTextComponent>

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    TestBed.configureTestingModule(
      testBedUtils.moduleDef({
        declarations: [TitledTextComponent]
      })
    ).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(TitledTextComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
