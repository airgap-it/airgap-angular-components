import { TestBed, async } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { ClipboardMock } from '../../../../test/utils/plugins-mock'
import { CLIPBOARD_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { ClipboardService } from './clipboard.service'

describe('ClipboardService', () => {
  let service: ClipboardService
  let testBedUtils: TestBedUtils

  const clipboardPluginMock = new ClipboardMock()

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    TestBed.configureTestingModule(
      testBedUtils.moduleDef({
        providers: [{ provide: CLIPBOARD_PLUGIN, useValue: clipboardPluginMock }]
      })
    )
    service = TestBed.inject(ClipboardService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
