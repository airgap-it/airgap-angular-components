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

  @Input()
  public displayDetails: boolean = false

  @Input()
  public interactionData: any | undefined

  @Input()
  public hideNetwork: boolean = false

  public get type(): string | undefined {
    return this.transaction?.transactionDetails?.parameters?.entrypoint ?? this.transaction?.extra?.type
  }

  public get destination(): string | undefined {
    const result: string | undefined = this.transaction?.transactionDetails?.destination ?? this.transaction?.extra?.destination
    if (result && this.transaction?.to.includes(result)) {
      return undefined
    }
    return result
  }

  constructor(private readonly clipboardService: ClipboardService) { }

  public toggleDisplayRawData(): void {
    this.displayRawData = !this.displayRawData
  }

  public toggleDisplayDetails(): void {
    this.displayDetails = !this.displayDetails
  }

  public copyToClipboard(): void {
    if (this.transaction) {
      this.clipboardService.copyAndShowToast(JSON.stringify(this.transaction.transactionDetails))
    }
  }
}
