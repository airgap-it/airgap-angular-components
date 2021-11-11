import { Injectable, InjectionToken } from '@angular/core'
import { BehaviorSubject, Observable } from 'rxjs'
import { FilesystemService } from '../../services/filesystem/filesystem.service'
import { UIResource } from '../../types/ui/UIResource'

export const DEFAULT_CURRENCY_SYMBOL_URL = './assets/symbols/generic-coin.svg'

export const CURRENCY_SYMBOL_FACADE = new InjectionToken<CurrencySymbolFacade>('CurrencySymbolFacade')
export interface CurrencySymbolFacade {
  readonly symbolSrc$: Observable<string>
  onInit(symbol: string | undefined): void
  onSymbolChanged(symbol: string | undefined): void
  onError(symbol: string | undefined, src: string | undefined): void
}

@Injectable()
export class CurrencySymbolCoreFacade implements CurrencySymbolFacade {
  private readonly _symbolSrc$: BehaviorSubject<string> = new BehaviorSubject(DEFAULT_CURRENCY_SYMBOL_URL)
  public readonly symbolSrc$: Observable<string> = this._symbolSrc$.asObservable()

  public constructor(private readonly filesystemService: FilesystemService) {}

  public onInit(symbol: string | undefined): void {
    this.onSymbolChanged(symbol)
  }

  public onSymbolChanged(symbol: string | undefined): void {
    if (symbol !== undefined) {
      this.setSymbol(symbol)
    }
  }

  public onError(symbol: string | undefined, src: string | undefined): void {
    if (symbol !== undefined) {
      this.loadFallbackImage(symbol, src)
    }
  }

  private setSymbol(symbol: string): void {
    // use .svg by default
    this._symbolSrc$.next(this.getSymbolAssetURL(symbol, 'svg'))
  }

  private async loadFallbackImage(symbol: string, src: string | undefined): Promise<void> {
    if (src === this.getSymbolAssetURL(symbol, 'svg')) {
      // .svg not found, use .png as a fallback
      this._symbolSrc$.next(this.getSymbolAssetURL(symbol, 'png'))
    } else if (src === this.getSymbolAssetURL(symbol, 'png')) {
      // try loading external image
      await this.loadLazyImage(symbol)  
    } else {
      // no image was found for the symbol, use the generic image
      this._symbolSrc$.next(DEFAULT_CURRENCY_SYMBOL_URL)
    }
  }

  private async loadLazyImage(symbol: string): Promise<void> {
    this._symbolSrc$.next(DEFAULT_CURRENCY_SYMBOL_URL)

    const imagePath: string = this.getSymbolImagePath(symbol)
    const imageURI: string | undefined = await this.filesystemService.readLazyImage(imagePath)

    this._symbolSrc$.next(imageURI ?? DEFAULT_CURRENCY_SYMBOL_URL)
  }

  private getSymbolAssetURL(symbol: string, extension: 'svg' | 'png'): string {
    return `./assets/symbols/${symbol.toLowerCase()}.${extension}`
  }

  private getSymbolImagePath(symbol: string): string {
    return `/images/symbols/${symbol.toLowerCase()}`
  }
}