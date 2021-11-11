import { AfterViewInit, Component, Inject, Input, OnChanges, SimpleChanges } from '@angular/core'
import { first } from 'rxjs/operators'
import { CurrencySymbolCoreFacade, CurrencySymbolFacade, CURRENCY_SYMBOL_FACADE } from './currency-symbol.facade'

@Component({
  selector: 'airgap-currency-symbol',
  templateUrl: './currency-symbol.component.html',
  styleUrls: ['./currency-symbol.component.scss'],
  providers: [
    { provide: CURRENCY_SYMBOL_FACADE, useClass: CurrencySymbolCoreFacade },
  ]
})
export class CurrencySymbolComponent implements AfterViewInit, OnChanges {
  @Input()
  public symbol: string | undefined

  public constructor(@Inject(CURRENCY_SYMBOL_FACADE) public readonly facade: CurrencySymbolFacade) {}
  
  public ngAfterViewInit(): void {
    this.facade.onInit(this.symbol)
  }
  
  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.symbol.previousValue !== changes.symbol.currentValue) {
      this.facade.onSymbolChanged(changes.symbol.currentValue)
    }
  }

  public async onError(): Promise<void> {
    const symbolSrc = await this.facade.symbolSrc$
      .pipe(first())
      .toPromise()

    this.facade.onError(this.symbol, symbolSrc)
  }
}
