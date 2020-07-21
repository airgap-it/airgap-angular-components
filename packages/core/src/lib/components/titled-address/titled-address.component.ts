import { Component, Input } from '@angular/core'

@Component({
  selector: 'airgap-titled-address',
  templateUrl: './titled-address.component.html',
  styleUrls: ['./titled-address.component.scss']
})
export class TitledAddressComponent {
  @Input()
  public readonly title: string | undefined

  @Input()
  public readonly address: string | undefined

  @Input()
  public readonly symbol: string | undefined

  @Input()
  public readonly hasSymbol: boolean = false
}
