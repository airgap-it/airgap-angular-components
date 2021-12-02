import { ProtocolSymbols } from '@airgap/coinlib-core'
import { Component, Input } from '@angular/core'

@Component({
  selector: 'airgap-titled-address',
  templateUrl: './titled-address.component.html',
  styleUrls: ['./titled-address.component.scss']
})
export class TitledAddressComponent {
  @Input()
  public title: string | undefined

  @Input()
  public address: string | undefined

  @Input()
  public symbol: string | undefined

  @Input()
  public protocolIdentifier: ProtocolSymbols | undefined

  @Input()
  public hasSymbol: boolean = false
}
