import { Component, Input } from '@angular/core'

@Component({
  selector: 'airgap-labeled-address',
  templateUrl: './labeled-address.component.html',
  styleUrls: ['./labeled-address.component.scss']
})
export class LabeledAddressComponent {
  @Input()
  public readonly label: string

  @Input()
  public readonly address: string

  @Input()
  public readonly symbol: string

  @Input()
  public readonly hasSymbol: boolean = false
}
