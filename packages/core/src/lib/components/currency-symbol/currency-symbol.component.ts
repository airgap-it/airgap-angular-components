import { AfterViewInit, Component, Input, OnChanges } from '@angular/core'
@Component({
  selector: 'airgap-currency-symbol',
  templateUrl: './currency-symbol.component.html',
  styleUrls: ['./currency-symbol.component.scss']
})
export class CurrencySymbolComponent implements AfterViewInit, OnChanges {
  @Input()
  public readonly symbol: string | undefined

  public symbolURL: string = '../../../assets/symbols/generic-coin.svg'

  public ngAfterViewInit(): void {
    this.loadImage()
  }

  public ngOnChanges(): void {
    this.loadImage()
  }

  private loadImage(usefallBack: boolean = false): void {
    if (this.symbol !== undefined) {
      const imageURL: string = usefallBack
        ? `../../../assets/symbols/${this.symbol.toLowerCase()}.png`
        : `../../../assets/symbols/${this.symbol.toLowerCase()}.svg`
      const img: HTMLImageElement = new Image()
      this.symbolURL = imageURL
      img.src = imageURL
    }
  }

  public useFallBackImage(): void {
    this.loadImage(true)
  }
}
