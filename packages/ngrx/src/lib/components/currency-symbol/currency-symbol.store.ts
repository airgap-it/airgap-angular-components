import { DEFAULT_CURRENCY_SYMBOL_URL, FilesystemService, SymbolInput, SymbolValue } from '@airgap/angular-core'
import { Injectable } from '@angular/core'
import { ComponentStore, tapResponse } from '@ngrx/component-store'
import { Observable, Subscriber } from 'rxjs'
import { map, repeat, switchMap, withLatestFrom } from 'rxjs/operators'

import { CurrencySymbolState } from './currency-symbol.types'

const initialStore: CurrencySymbolState = {
  src: DEFAULT_CURRENCY_SYMBOL_URL,

  input: undefined,
  fallbackInput: undefined,
  inputs: []
}

@Injectable()
export class CurrencySymbolStore extends ComponentStore<CurrencySymbolState> {
  constructor(private readonly filesystemService: FilesystemService) {
    super(initialStore)
  }

  public readonly onError$ = this.effect((props$: Observable<void>) => {
    return props$.pipe(
      withLatestFrom(this.state$),
      switchMap(([, state]: [void, CurrencySymbolState]) => {
        return this.loadFallbackImage(state).pipe(
          map((value: SymbolValue) => {
            if (value.kind === 'lazy' && value.url === undefined) {
              return !state.fallbackInput || value.symbolInput === state.fallbackInput
                ? { kind: 'default' }
                : { kind: 'asset', symbolInput: state.fallbackInput, extension: 'svg' } // try again with fallback symbol
            } else {
              return value
            }
          }),
          tapResponse(
            (value: SymbolValue) => this.setSrc(value),
            () => this.setSrc({ kind: 'default' })
          )
        )
      }),
      repeat()
    )
  })

  public readonly setInitialSrc = this.updater((state: CurrencySymbolState, inputs: SymbolInput[]) => {
    const input: SymbolInput | undefined = inputs[0]
    const fallbackInput: SymbolInput | undefined = inputs[1]

    return {
      ...state,
      src: input ? this.getSymbolAssetURL(input, 'svg') /* use .svg by default */ : state.src,
      fallbackType: input ? { kind: 'asset', symbolInput: input, extension: 'png' } /* use .png as a fallback */ : state.fallbackType,

      input,
      fallbackInput,
      inputs
    }
  })

  private readonly setSrc = this.updater((state: CurrencySymbolState, value: SymbolValue) => {
    switch (value.kind) {
      case 'default':
        return {
          ...state,
          src: DEFAULT_CURRENCY_SYMBOL_URL,

          input: undefined,
          fallbackInput: undefined
        }
      case 'asset':
        const { current: assetCurrent, fallback: assetFallback } = this.getNextInputs(state, value.symbolInput)

        return {
          ...state,
          src: this.getSymbolAssetURL(value.symbolInput, value.extension),
          fallbackType:
            value.extension === 'svg'
              ? { kind: 'asset', symbolInput: value.symbolInput, extension: 'png' } /* use .png as a fallback */
              : { kind: 'lazy', symbolInput: value.symbolInput } /* try loading external image as a fallback */,

          input: assetCurrent,
          fallbackInput: assetFallback
        }
      case 'lazy':
        const { current: lazyCurrent, fallback: lazyFallback } = this.getNextInputs(state, value.symbolInput)

        return {
          ...state,
          src: value.url ?? '',
          fallbackType:
            !state.fallbackInput || value.symbolInput === state.fallbackInput
              ? { kind: 'default' }
              : { kind: 'asset', symbolInput: state.fallbackInput, extension: 'svg' } /* try again with fallback symbol */,

          input: lazyCurrent,
          fallbackInput: lazyFallback
        }
      default:
        return state
    }
  })

  private getNextInputs(state: CurrencySymbolState, input?: SymbolInput): { current?: SymbolInput; fallback?: SymbolInput } {
    if (!input) {
      return {}
    }

    const index = state.inputs.indexOf(input)

    return index > -1 ? { current: state.inputs[index], fallback: state.inputs[index + 1] } : {}
  }

  private loadFallbackImage(state: CurrencySymbolState): Observable<SymbolValue> {
    return new Observable((subscriber: Subscriber<SymbolValue>) => {
      new Promise<void>(async (resolve, reject) => {
        try {
          subscriber.next({ kind: 'default' })
          if (state.fallbackType?.kind === 'asset') {
            subscriber.next({ kind: 'asset', symbolInput: state.fallbackType.symbolInput, extension: state.fallbackType.extension })
          } else if (state.fallbackType?.kind === 'lazy') {
            // try loading external image
            const imageURI: string | undefined = await this.loadLazyImage(state.fallbackType.symbolInput)
            subscriber.next({ kind: 'lazy', symbolInput: state.fallbackType.symbolInput, url: imageURI })
          } else {
            // no image was found for the symbol, use the generic image
            subscriber.next({ kind: 'default' })
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

  private async loadLazyImage(symbolInput: SymbolInput): Promise<string | undefined> {
    const imagePath: string = this.getSymbolImagePath(symbolInput)

    return this.filesystemService.readLazyImage(imagePath)
  }

  private getSymbolAssetURL(symbolInput: SymbolInput, extension: 'svg' | 'png'): string {
    return `./assets/symbols/${symbolInput.caseSensitive ? symbolInput.value : symbolInput.value.toLowerCase()}.${extension}`
  }

  private getSymbolImagePath(symbolInput: SymbolInput): string {
    return `/images/symbols/${symbolInput.caseSensitive ? symbolInput.value : symbolInput.value.toLowerCase()}`
  }
}
