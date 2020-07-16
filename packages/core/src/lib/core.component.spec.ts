import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { TestBedUtils } from '../../test/utils/test-bed'
import { CoreComponent } from './core.component'

describe('CoreComponent', () => {
  let component: CoreComponent
  let fixture: ComponentFixture<CoreComponent>

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    TestBed.configureTestingModule(
      testBedUtils.moduleDef({
        declarations: [CoreComponent]
      })
    ).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(CoreComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
