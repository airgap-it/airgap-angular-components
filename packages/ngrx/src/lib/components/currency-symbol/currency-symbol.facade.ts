import { FilesystemService, ICurrencySymbolFacade, ProtocolService, SymbolInput } from '@airgap/angular-core'
import { ProtocolSymbols } from '@airgap/coinlib-core'
import { Injectable, Injector } from '@angular/core'
import { Observable } from 'rxjs'
import { BaseNgRxFacade } from '../../base/base-ngrx.facade'

import { CurrencySymbolStore } from './currency-symbol.store'

@Injectable()
export class CurrencySymbolNgRxFacade extends BaseNgRxFacade<CurrencySymbolStore> implements ICurrencySymbolFacade {
  public readonly symbolSrc$: Observable<string>

  constructor(store: CurrencySymbolStore, private readonly protocolService: ProtocolService) {
    super(store)
    this.symbolSrc$ = this.store.select((state) => state.src)
  }

  public initWithSymbol(symbol: string | undefined, protocolIdentifier: ProtocolSymbols | undefined): void {
    this.store.setInitialSrc(this.getSymbolInputs(symbol, protocolIdentifier))
  }

  public onSymbolChanged(symbol: string | undefined, protocolIdentifier: ProtocolSymbols | undefined): void {
    this.store.setInitialSrc(this.getSymbolInputs(symbol, protocolIdentifier))
  }

  public onError(_symbol: string | undefined, _protocolIdentifier: ProtocolSymbols | undefined, _src?: string): void {
    this.store.onError$()
  }

  private getSymbolInputs(symbol: string | undefined, protocolIdentifier: ProtocolSymbols | undefined): SymbolInput[] {
    const symbolInput: SymbolInput | undefined = symbol ? { value: symbol, caseSensitive: false } : undefined
    const protocolIdentifierInput: SymbolInput | undefined = protocolIdentifier
      ? { value: protocolIdentifier, caseSensitive: true }
      : undefined

    const symbolInputs: (SymbolInput | undefined)[] =
      protocolIdentifier && this.protocolService.isKnownProtocolSymbol(protocolIdentifier)
        ? [symbolInput, protocolIdentifierInput]
        : [protocolIdentifierInput, symbolInput]

    return symbolInputs.filter((symbolInputOrUndefined: SymbolInput | undefined) => symbolInputOrUndefined !== undefined)
  }
}

export const currencySymbolNgRxFacade = (injector: Injector): CurrencySymbolNgRxFacade => {
  return new CurrencySymbolNgRxFacade(new CurrencySymbolStore(injector.get(FilesystemService)), injector.get(ProtocolService))
}
