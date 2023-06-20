import { Component, Input } from '@angular/core'
import { QRCodeErrorCorrectionLevel } from 'qrcode'

import { ClipboardService } from '../../services/clipboard/clipboard.service'

@Component({
  selector: 'airgap-qr',
  templateUrl: './qr.component.html',
  styleUrls: ['./qr.component.scss']
})
export class QrComponent {
  @Input()
  public level: QRCodeErrorCorrectionLevel = 'L'

  @Input()
  public size: number = 300

  @Input()
  public margin: number = 1

  @Input()
  public qrdata: string = ''

  @Input()
  public disableClipboard: boolean = false

  constructor(private readonly clipboardService: ClipboardService) {}

  public async copyToClipboard(): Promise<void> {
    if (!this.disableClipboard) {
      await this.clipboardService.copyAndShowToast(this.qrdata)
    }
  }
}
