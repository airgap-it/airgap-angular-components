import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { QrComponent } from './qr.component'

describe('QrComponent', () => {
  let component: QrComponent
  let fixture: ComponentFixture<QrComponent>

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    TestBed.configureTestingModule(testBedUtils.moduleDef({})).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(QrComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
