import { ProtocolSymbols } from '@airgap/coinlib-core'
import { InjectionToken, Injector } from '@angular/core'
import { Observable } from 'rxjs'

import { AirGapAngularCoreModule } from '../../airgap-angular-core.module'
import { BaseFacade } from '../../base/base.facade'

export const DEFAULT_CURRENCY_SYMBOL_URL = './assets/symbols/generic-coin.svg'

export const CURRENCY_SYMBOL_FACADE = new InjectionToken<CurrencySymbolFacade>('CurrencySymbolFacade')
export type CurrencySymbolFacade<T extends BaseFacade = BaseFacade> = ICurrencySymbolFacade & T
export interface ICurrencySymbolFacade {
  readonly symbolSrc$: Observable<string>

  initWithSymbol(symbol: string | undefined, protocolIdentifier: ProtocolSymbols | undefined): void
  onSymbolChanged(symbol: string | undefined, protocolIdentifier: ProtocolSymbols | undefined): void
  onError(symbol: string | undefined, protocolIdentifier: ProtocolSymbols | undefined, src?: string): void
}

export const currencySymbolFacade = (injector: Injector): CurrencySymbolFacade => {
  const factory = AirGapAngularCoreModule.factories?.currencySymbolFacade
  if (!factory) {
    throw new Error('Factory for `CurrencySymbolFacade` not found.')
  }

  return factory(injector)
}
