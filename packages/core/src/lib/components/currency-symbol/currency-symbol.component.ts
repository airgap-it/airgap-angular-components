import { AfterViewInit, Component, Input, OnChanges } from '@angular/core'
@Component({
  selector: 'airgap-currency-symbol',
  templateUrl: './currency-symbol.component.html',
  styleUrls: ['./currency-symbol.component.scss']
})
export class CurrencySymbolComponent implements AfterViewInit, OnChanges {
  @Input()
  public readonly symbol: string | undefined

  public symbolURL: string = './assets/symbols/generic-coin.svg'

  public ngAfterViewInit(): void {
    this.loadImage()
  }

  public ngOnChanges(): void {
    this.loadImage()
  }

  public useFallbackImage(): void {
    this.loadImage(true)
  }

  private loadImage(useFallback: boolean = false): void {
    if (this.symbol !== undefined) {
      const imageURL: string = useFallback
        ? `./assets/symbols/${this.symbol.toLowerCase()}.png`
        : `./assets/symbols/${this.symbol.toLowerCase()}.svg`
      this.symbolURL = imageURL
    }
  }
}
