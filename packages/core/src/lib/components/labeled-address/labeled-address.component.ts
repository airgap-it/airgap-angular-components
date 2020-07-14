import { Component, Input } from '@angular/core'

@Component({
  selector: 'airgap-labeled-address',
  templateUrl: './labeled-address.component.html',
  styleUrls: ['./labeled-address.component.scss']
})
export class LabeledAddressComponent {
  @Input()
  public readonly label: string | undefined

  @Input()
  public readonly address: string | undefined

  @Input()
  public readonly symbol: string | undefined

  @Input()
  public readonly hasSymbol: boolean = false
}
