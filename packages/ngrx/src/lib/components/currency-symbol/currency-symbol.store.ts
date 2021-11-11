import { DEFAULT_CURRENCY_SYMBOL_URL, FilesystemService } from '@airgap/angular-core'
import { Injectable } from '@angular/core'
import { ComponentStore, tapResponse } from '@ngrx/component-store'
import { Observable, Subscriber } from 'rxjs'
import { repeat, switchMap, withLatestFrom } from 'rxjs/operators'

import { CurrencySymbolState } from './currency-symbol.types'

const initialStore: CurrencySymbolState = {
  symbol: undefined,
  imageSrc: DEFAULT_CURRENCY_SYMBOL_URL
}

@Injectable()
export class CurrencySymbolStore extends ComponentStore<CurrencySymbolState> {

  constructor(private readonly filesystemService: FilesystemService) {
    super(initialStore)
  }

  public readonly onError = this.effect((src$: Observable<string | undefined>) => {
    return src$.pipe(
      withLatestFrom(this.state$),
      switchMap(([src, state]: [string, CurrencySymbolState]) => {
        return this.loadFallbackImage(state, src).pipe(
          tapResponse(
            (src) => this.setImageSrc(src),
            () => this.setImageSrc(DEFAULT_CURRENCY_SYMBOL_URL)
          )
        )
      }),
      repeat()
    )
  })

  public readonly setSymbol = this.updater((state: CurrencySymbolState, symbol: string | undefined) => ({
    ...state,
    symbol,
    imageSrc: symbol ? this.getSymbolAssetURL(symbol, 'svg') /* use .svg by default */ : state.imageSrc
  }))

  private readonly setImageSrc = this.updater((state: CurrencySymbolState, imageSrc: string) => ({
    ...state,
    imageSrc
  }))

  private loadFallbackImage(state: CurrencySymbolState, src: string): Observable<string> {
    return new Observable((subscriber: Subscriber<string>) => {
      new Promise<void>(async (resolve, reject) => {
        try {
          subscriber.next(DEFAULT_CURRENCY_SYMBOL_URL)
          if (src === this.getSymbolAssetURL(state.symbol, 'svg')) {
            // .svg not found, use .png as a fallback
            subscriber.next(this.getSymbolAssetURL(state.symbol, 'png'))
          } else if (src === this.getSymbolAssetURL(state.symbol, 'png')) {
            // try loading external image
            await this.loadLazyImage(state.symbol, subscriber)
          } else {
            // no image was found for the symbol, use the generic image
            subscriber.next(DEFAULT_CURRENCY_SYMBOL_URL)
          }

          resolve()
        } catch (error) {
          reject(error)
        }
      }).finally(() => {
        subscriber.complete()
      })
    })
  }

  private async loadLazyImage(symbol: string, subscriber: Subscriber<string>): Promise<void> {
    subscriber.next(DEFAULT_CURRENCY_SYMBOL_URL)

    const imagePath: string = this.getSymbolImagePath(symbol)
    const imageURI: string | undefined = await this.filesystemService.readLazyImage(imagePath)

    subscriber.next(imageURI ?? DEFAULT_CURRENCY_SYMBOL_URL)
  }

  private getSymbolAssetURL(symbol: string, extension: 'svg' | 'png'): string {
    return `./assets/symbols/${symbol.toLowerCase()}.${extension}`
  }

  private getSymbolImagePath(symbol: string): string {
    return `/images/symbols/${symbol.toLowerCase()}`
  }
}