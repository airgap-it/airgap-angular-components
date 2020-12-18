import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { QrSettingsPage } from './qr-settings.page'

describe('QrSettingsPage', () => {
  let component: QrSettingsPage
  let fixture: ComponentFixture<QrSettingsPage>

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    TestBed.configureTestingModule(testBedUtils.moduleDef({})).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(QrSettingsPage)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
