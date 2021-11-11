import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { FilesystemPluginMock } from '../../../../test/utils/plugins-mock'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { FILESYSTEM_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { CurrencySymbolComponent } from './currency-symbol.component'

describe('CurrencySymbolComponent', () => {
  let component: CurrencySymbolComponent
  let fixture: ComponentFixture<CurrencySymbolComponent>

  let testBedUtils: TestBedUtils

  let filesystemPluginMock: FilesystemPluginMock

  beforeEach(
    waitForAsync(async () => {
      testBedUtils = new TestBedUtils()
      filesystemPluginMock = new FilesystemPluginMock()
      await TestBed.configureTestingModule(testBedUtils.moduleDef({
        providers: [{ provide: FILESYSTEM_PLUGIN, useValue: filesystemPluginMock }]
      })).compileComponents()
    })
  )

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrencySymbolComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
