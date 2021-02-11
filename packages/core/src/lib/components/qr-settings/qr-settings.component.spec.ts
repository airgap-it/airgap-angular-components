import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { TestBedUtils } from '../../../../test/utils/test-bed'
import { QrSettingsComponent } from './qr-settings.component'

describe('QrSettingsComponent', () => {
  let component: QrSettingsComponent
  let fixture: ComponentFixture<QrSettingsComponent>

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    TestBed.configureTestingModule(testBedUtils.moduleDef({})).compileComponents().catch(console.error)
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(QrSettingsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
