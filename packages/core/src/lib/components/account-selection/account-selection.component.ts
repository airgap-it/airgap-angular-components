import { Component, Input, EventEmitter, Output } from '@angular/core'
import { AirGapWallet } from '@airgap/coinlib-core'
@Component({
  selector: 'airgap-account-selection',
  templateUrl: './account-selection.component.html',
  styleUrls: ['./account-selection.component.scss']
})
export class AccountSelectionComponent {
  @Input()
  public title: string | undefined

  @Input()
  public heading: string | undefined

  @Input()
  public placeholder: string | undefined

  @Input()
  public wallets: AirGapWallet[] | undefined
  public symbolFilter: string | undefined

  @Output()
  private readonly walletSetEmitter: EventEmitter<AirGapWallet> = new EventEmitter()

  @Output()
  private readonly dismissEmitter: EventEmitter<void> = new EventEmitter()

  constructor() {}

  public filterItems(event: any): void {
    function isValidSymbol(data: unknown): data is string {
      return data && typeof data === 'string' && data !== ''
    }

    const value: unknown = event.target.value

    this.symbolFilter = isValidSymbol(value) ? value.trim().toLowerCase() : undefined
  }

  public selectAccount(wallet: AirGapWallet) {
    this.walletSetEmitter.emit(wallet)
  }
  public dismiss() {
    this.dismissEmitter.emit()
  }
}
