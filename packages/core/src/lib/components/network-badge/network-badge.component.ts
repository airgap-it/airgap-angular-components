import { Component, Input } from '@angular/core'
import { ProtocolNetwork, NetworkType } from '@airgap/coinlib-core'

@Component({
  selector: 'airgap-network-badge',
  templateUrl: './network-badge.component.html',
  styleUrls: ['./network-badge.component.scss']
})
export class NetworkBadgeComponent {
  @Input()
  public network: ProtocolNetwork | undefined

  public networkType: typeof NetworkType = NetworkType
}
