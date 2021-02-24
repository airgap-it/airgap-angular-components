import { Component, Input } from '@angular/core'
import { IAirGapTransaction } from '@airgap/coinlib-core'

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

  public toggleDisplayRawData(): void {
    this.displayRawData = !this.displayRawData
  }
}
