import { Component, Input, OnDestroy, Inject } from '@angular/core'

import { ClipboardService } from '../../services/clipboard/clipboard.service'
import { SerializerService } from '../../services/serializer/serializer.service'
import { serializedDataToUrlString } from '../../utils/utils'
import { APP_CONFIG, AppConfig } from '../../config/app-config'

@Component({
  selector: 'airgap-qr',
  templateUrl: './qr.component.html',
  styleUrls: ['./qr.component.scss']
})
export class QrComponent implements OnDestroy {
  @Input()
  public level: string = 'L'

  @Input()
  public size: number = 300

  @Input()
  public set qrdata(value: string | string[]) {
    this._rawValue = value
    this.convertToDataArray()
  }

  @Input()
  public set shouldPrefixSingleQrWithUrl(value: boolean) {
    this._shouldPrefixSingleQrWithUrl = value
    this.convertToDataArray()
  }

  public qrdataArray: string[] = ['']

  public activeChunk: number = 0

  private _rawValue: string | string[] = []
  private _shouldPrefixSingleQrWithUrl: boolean = true

  private readonly timeout: NodeJS.Timeout
  constructor(
    private readonly clipboardService: ClipboardService,
    private readonly serializerService: SerializerService,
    @Inject(APP_CONFIG) private readonly appConfig: AppConfig
  ) {
    this.timeout = setInterval(() => {
      this.activeChunk = ++this.activeChunk % this.qrdataArray.length
    }, this.serializerService.displayTimePerChunk)
  }

  public ngOnDestroy(): void {
    if (this.timeout) {
      clearInterval(this.timeout)
    }
  }

  public async copyToClipboard(): Promise<void> {
    let copyString: string = ''
    if (this._rawValue.length === 1) {
      const chunk: string = this._rawValue[0]
      const shouldPrefix: boolean = !chunk.includes('://') && this._shouldPrefixSingleQrWithUrl

      copyString = shouldPrefix ? serializedDataToUrlString(chunk, `${this.appConfig.otherApp.urlScheme}://`) : chunk
    } else {
      copyString = typeof this._rawValue === 'string' ? this._rawValue : this._rawValue.join(',')
    }

    await this.clipboardService.copyAndShowToast(copyString)
  }

  private convertToDataArray(): void {
    const array: string[] = Array.isArray(this._rawValue) ? this._rawValue : [this._rawValue]
    if (array.length === 1) {
      const chunk: string = array[0]
      const shouldPrefix: boolean = !chunk.includes('://') && this._shouldPrefixSingleQrWithUrl

      this.qrdataArray = [shouldPrefix ? serializedDataToUrlString(chunk, `${this.appConfig.otherApp.urlScheme}://`) : chunk]
    } else {
      this.qrdataArray = array
    }
  }
}
