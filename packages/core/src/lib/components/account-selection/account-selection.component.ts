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
  public labels: string[] = []

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

  public filterItems(event: Event): void {
    const value: unknown = this.isInputElement(event.target) ? event.target.value : undefined
    this.symbolFilter = this.isValidFilterQuery(value) ? value.trim().toLowerCase() : undefined
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
