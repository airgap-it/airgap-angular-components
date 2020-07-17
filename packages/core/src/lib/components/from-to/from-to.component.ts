import { Component, Input } from '@angular/core'
import * as moment from 'moment'
import { IAirGapTransaction } from 'airgap-coin-lib'
import { AmountConverterPipe } from '../../pipes/amount-converter/amount-converter.pipe'

@Component({
  selector: 'airgap-from-to',
  templateUrl: './from-to.component.html',
  styleUrls: ['./from-to.component.scss']
})
export class FromToComponent {
  @Input()
  public readonly transaction: IAirGapTransaction | undefined
  
  @Input()
  public displayRawData: boolean = false

  public get transactionAmount(): string {
    return this.amountConverterPipe.transform(this.transaction?.amount, { protocol: this.transaction?.protocolIdentifier })
  }

  public get transactionFee(): string {
    return this.amountConverterPipe.transform(this.transaction?.fee, { protocol: this.transaction?.protocolIdentifier })
  }

  public get transactionTimestamp(): string {
    return this.transaction !== undefined && this.transaction.timestamp !== undefined
      ? moment.unix(this.transaction.timestamp).calendar(null, {
          sameDay: '[Today at] HH:mm',
          sameElse: 'HH:mm [on] LL'
        })
      : ''
  }

  constructor(private readonly amountConverterPipe: AmountConverterPipe) {}

  public toggleDisplayRawData(): void {
    this.displayRawData = !this.displayRawData
  }
}
