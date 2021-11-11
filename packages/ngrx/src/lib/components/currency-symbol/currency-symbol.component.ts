import { CurrencySymbolComponent, CurrencySymbolFacade, CURRENCY_SYMBOL_FACADE } from '@airgap/angular-core'
import { Component, Inject } from '@angular/core'
import { CurrencySymbolNgRxFacade } from './currency-symbol.facade'
import { CurrencySymbolStore } from './currency-symbol.store'

@Component({
  selector: 'airgap-ngrx-currency-symbol',
  templateUrl: './currency-symbol.component.html',
  styleUrls: ['./currency-symbol.component.scss'],
  providers: [
    { provide: CURRENCY_SYMBOL_FACADE, useClass: CurrencySymbolNgRxFacade },
    CurrencySymbolStore
  ]
})
export class CurrencySymbolNgRxComponent extends CurrencySymbolComponent {
  
  public constructor(@Inject(CURRENCY_SYMBOL_FACADE) facade: CurrencySymbolFacade) {
    super(facade)
  }
}
