import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { UrlSerializer } from '@angular/router'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { QrSettingsComponent } from './qr-settings.component'

describe('QrSettingsComponent', () => {
  let component: QrSettingsComponent
  let fixture: ComponentFixture<QrSettingsComponent>

  let testBedUtils: TestBedUtils

  beforeEach(
    waitForAsync(async () => {
      testBedUtils = new TestBedUtils()
      await TestBed.configureTestingModule(
        testBedUtils.moduleDef({
          providers: [UrlSerializer]
        })
      ).compileComponents()
    })
  )

  beforeEach(() => {
    fixture = TestBed.createComponent(QrSettingsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
