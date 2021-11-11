import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { CurrencySymbolFacade } from '@airgap/angular-core'
import { CurrencySymbolStore } from './currency-symbol.store'

@Injectable()
export class CurrencySymbolNgRxFacade implements CurrencySymbolFacade {
  public readonly symbolSrc$: Observable<string>

  public constructor(private readonly store: CurrencySymbolStore) {
    this.symbolSrc$ = this.store.select((state) => state.imageSrc)
  }

  public onInit(symbol: string | undefined): void {
    this.store.setSymbol(symbol)
  }

  public onSymbolChanged(symbol: string | undefined): void {
    this.store.setSymbol(symbol)
  }

  public onError(_symbol: string | undefined, src: string | undefined): void {
    this.store.onError(src)
  }
}