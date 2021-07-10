import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { ClipboardMock } from '../../../../test/utils/plugins-mock'
import { CLIPBOARD_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { IACQrComponent } from './iac-qr.component'

describe('QrComponent', () => {
  let component: IACQrComponent
  let fixture: ComponentFixture<IACQrComponent>

  let testBedUtils: TestBedUtils

  let clipboardPluginMock: ClipboardMock

  beforeEach(
    waitForAsync(async () => {
      testBedUtils = new TestBedUtils()
      clipboardPluginMock = new ClipboardMock()

      await TestBed.configureTestingModule(
        testBedUtils.moduleDef({
          providers: [{ provide: CLIPBOARD_PLUGIN, useValue: clipboardPluginMock }]
        })
      ).compileComponents()
    })
  )

  beforeEach(() => {
    fixture = TestBed.createComponent(IACQrComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
