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

  public fromTransactions: { name?: string; address: string }[] = []
  public toTransactions: { name?: string; address: string }[] = []

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

  constructor(private readonly clipboardService: ClipboardService) {}

  ngOnChanges(): void {
    if (this.transaction) {
      this.fromTransactions = []
      for (let i = 0; i < this.transaction.from.length; i++) {
        const from = this.transaction.from[i]
        if (this.transaction.extra?.names && this.transaction.extra?.names?.[from]) {
          this.fromTransactions.push({ name: this.transaction.extra.names[from], address: from })
        } else this.fromTransactions.push({ address: from })
      }
      this.toTransactions = []
      for (let i = 0; i < this.transaction.to.length; i++) {
        const to = this.transaction.to[i]
        if (this.transaction.extra?.names && this.transaction.extra?.names?.[to]) {
          this.toTransactions.push({ name: this.transaction.extra.names[to], address: to })
        } else this.toTransactions.push({ address: to })
      }
    }
  }

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
