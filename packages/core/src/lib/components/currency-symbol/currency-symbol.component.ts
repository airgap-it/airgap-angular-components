import { AfterViewInit, Component, Input, OnChanges } from '@angular/core'
import { UIResource, UIResourceStatus } from '../../../public-api'

const DEFAULT_SYMBOL_URL = './assets/symbols/generic-coin.svg'

@Component({
  selector: 'airgap-currency-symbol',
  templateUrl: './currency-symbol.component.html',
  styleUrls: ['./currency-symbol.component.scss']
})
export class CurrencySymbolComponent implements AfterViewInit, OnChanges {
  @Input()
  public symbol: string | undefined

  public symbolAsset: UIResource<string> = {
    status: UIResourceStatus.IDLE,
    value: DEFAULT_SYMBOL_URL
  }

  public ngAfterViewInit(): void {
    this.loadImage()
  }

  public ngOnChanges(): void {
    this.loadImage()
  }

  public onError(): void {
    this.symbolAsset = {
      status: UIResourceStatus.ERROR,
      value: this.symbolAsset.value
    }
    this.loadImage()
  }

  private loadImage(): void {
    if (this.symbol !== undefined) {
      this.symbolAsset = this.getSymbolAsset()
    }
  }

  private getSymbolAsset(): UIResource<string> {
    if (this.symbolAsset.status === UIResourceStatus.IDLE) {
      // try with .svg by default
      return {
        status: UIResourceStatus.SUCCESS,
        value: this.getSymbolURL('svg')
      }
    } else if (this.symbolAsset.status === UIResourceStatus.SUCCESS) {
      return this.symbolAsset
    } else if (this.symbolAsset.status === UIResourceStatus.ERROR && this.symbolAsset.value === this.getSymbolURL('svg')) {
      // .svg not found, use .png as a fallback
      return {
        status: UIResourceStatus.SUCCESS,
        value: this.getSymbolURL('png')
      }
    } else if (this.symbolAsset.status === UIResourceStatus.ERROR && this.symbolAsset.value === this.getSymbolURL('png')) {
      // no image was found for the symbol, use the generic image
      return {
        status: UIResourceStatus.SUCCESS,
        value: DEFAULT_SYMBOL_URL
      }
    }
  }

  private getSymbolURL(extension: 'svg' | 'png'): string {
    return `./assets/symbols/${this.symbol.toLowerCase()}.${extension}`
  }
}
