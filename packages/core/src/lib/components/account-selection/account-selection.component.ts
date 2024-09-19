import { Component, Input, EventEmitter, Output, SimpleChanges } from '@angular/core'
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

  @Output()
  private readonly walletSetEmitter: EventEmitter<AirGapWallet> = new EventEmitter()

  @Output()
  private readonly dismissEmitter: EventEmitter<void> = new EventEmitter()

  public symbolFilter: string | undefined

  public filteredWallets: AirGapWallet[] = []

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.wallets && changes.wallets.currentValue) {
      // Handle when wallets input changes or is set initially
      this.filteredWallets = [...this.wallets]
    }
  }

  public filterItems(event: Event): void {
    const value: unknown = this.isInputElement(event.target) ? event.target.value : undefined
    this.symbolFilter = this.isValidFilterQuery(value) ? value.trim().toLowerCase() : undefined
  }

  public filterWallet(event: Event): void {
    const value: unknown = this.isInputElement(event.target) ? event.target.value : undefined

    this.filteredWallets = this.isValidFilterQuery(value)
      ? this.wallets?.filter((wallet) => wallet.label?.trim().toLowerCase().startsWith(value.trim().toLowerCase())) || []
      : this.wallets
      ? [...this.wallets]
      : []
  }
  public selectAccount(wallet: AirGapWallet): void {
    this.walletSetEmitter.emit(wallet)
  }
  public dismiss(): void {
    this.dismissEmitter.emit()
  }

  private isInputElement(target: EventTarget | null): target is EventTarget & HTMLInputElement {
    return target !== null && 'value' in target
  }

  private isValidFilterQuery(data: unknown): data is string {
    return typeof data === 'string' && data.length > 0
  }
}
