import { ProtocolSymbols } from '@airgap/coinlib-core'
import { InjectionToken, Injector } from '@angular/core'
import { Observable } from 'rxjs'

import { BaseFacade } from '../../base/base.facade'

export const DEFAULT_CURRENCY_SYMBOL_URL = './assets/symbols/generic-coin.svg'

export const CURRENCY_SYMBOL_FACADE = new InjectionToken<CurrencySymbolFacade>('CurrencySymbolFacade')
export const CURRENCY_SYMBOL_FACADE_FACTORY = new InjectionToken<(injector: Injector) => CurrencySymbolFacade>(
  'CurrencySymbolFacadeFactory'
)
export type CurrencySymbolFacade<T extends BaseFacade = BaseFacade> = ICurrencySymbolFacade & T
export interface ICurrencySymbolFacade {
  readonly symbolSrc$: Observable<string>

  initWithSymbol(symbol: string | undefined, protocolIdentifier: ProtocolSymbols | undefined): void
  onSymbolChanged(symbol: string | undefined, protocolIdentifier: ProtocolSymbols | undefined): void
  onError(symbol: string | undefined, protocolIdentifier: ProtocolSymbols | undefined, src?: string): void
}

export function currencySymbolFacade(injector: Injector): CurrencySymbolFacade {
  return injector.get(CURRENCY_SYMBOL_FACADE_FACTORY)(injector)
}
