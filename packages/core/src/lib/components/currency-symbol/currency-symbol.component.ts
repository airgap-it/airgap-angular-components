import { ProtocolSymbols } from '@airgap/coinlib-core'
import { Component, Inject, Injector, Input, OnChanges, SimpleChanges } from '@angular/core'
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'
import { Observable } from 'rxjs'
import { first, map } from 'rxjs/operators'
import { BaseComponent } from '../../base/base.component'
import { currencySymbolFacade, CurrencySymbolFacade, CURRENCY_SYMBOL_FACADE } from './currency-symbol.facade'

@Component({
  selector: 'airgap-currency-symbol',
  templateUrl: './currency-symbol.component.html',
  styleUrls: ['./currency-symbol.component.scss'],
  providers: [{ provide: CURRENCY_SYMBOL_FACADE, useFactory: currencySymbolFacade, deps: [Injector] }]
})
export class CurrencySymbolComponent extends BaseComponent<CurrencySymbolFacade> implements OnChanges {
  @Input()
  public symbol: string | undefined

  @Input()
  public protocolIdentifier: ProtocolSymbols | undefined

  public readonly symbolSrc$: Observable<SafeUrl>

  constructor(@Inject(CURRENCY_SYMBOL_FACADE) facade: CurrencySymbolFacade, private readonly domSanitizer: DomSanitizer) {
    super(facade)

    this.symbolSrc$ = facade.symbolSrc$.pipe(map((src: string) => this.domSanitizer.bypassSecurityTrustUrl(src)))
  }

  public ngOnInit() {
    this.facade.initWithSymbol(this.symbol, this.protocolIdentifier)

    return super.ngOnInit()
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.symbol === undefined || changes.protocolIdentifier === undefined) {
      return
    }

    if (
      changes.symbol.previousValue !== changes.symbol.currentValue ||
      changes.protocolIdentifier.previousValue !== changes.protocolIdentifier.currentValue
    ) {
      this.facade.onSymbolChanged(changes.symbol.currentValue, changes.protocolIdentifier.currentValue)
    }
  }

  public async onError(): Promise<void> {
    const symbolSrc = await this.facade.symbolSrc$.pipe(first()).toPromise()

    this.facade.onError(this.symbol, this.protocolIdentifier, symbolSrc)
  }
}
