import { TestBed, waitForAsync } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { ClipboardMock } from '../../../../test/utils/plugins-mock'
import { CLIPBOARD_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { ClipboardService } from './clipboard.service'

describe('ClipboardService', () => {
  let service: ClipboardService
  let testBedUtils: TestBedUtils

  let clipboardPluginMock: ClipboardMock

  beforeEach(
    waitForAsync(() => {
      testBedUtils = new TestBedUtils()
      clipboardPluginMock = new ClipboardMock()
      TestBed.configureTestingModule(
        testBedUtils.moduleDef({
          providers: [{ provide: CLIPBOARD_PLUGIN, useValue: clipboardPluginMock }]
        })
      )
      service = TestBed.inject(ClipboardService)
    })
  )

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('paste from clipboard', async () => {
    const text: string = await service.paste()
    expect(text).toEqual('text-from-clipboard')
    expect(clipboardPluginMock.read).toHaveBeenCalledTimes(1)
  })

  it('copy to clipboard', async () => {
    const myText = 'text123'
    await service.copy(myText)
    expect(clipboardPluginMock.write).toHaveBeenCalledTimes(1)
    // eslint-disable-next-line id-blacklist
    expect(clipboardPluginMock.write).toHaveBeenCalledWith({ string: myText })
  })
})
