import { Component, Input } from '@angular/core'
import { IAirGapTransaction } from '@airgap/coinlib-core'
import { ClipboardService } from '../../services/clipboard/clipboard.service'

@Component({
  selector: 'airgap-from-to',
  templateUrl: './from-to.component.html',
  styleUrls: ['./from-to.component.scss']
})
export class FromToComponent {
  @Input()
  public transaction: IAirGapTransaction | undefined

  @Input()
  public displayRawData: boolean = false

  constructor(private readonly clipboardService: ClipboardService) {}

  public toggleDisplayRawData(): void {
    this.displayRawData = !this.displayRawData
  }

  public copyToClipboard(): void {
    this.clipboardService.copyAndShowToast(JSON.stringify(this.transaction.transactionDetails))
  }
}
