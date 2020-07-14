import { Component, Input, AfterViewInit } from '@angular/core'
import { ProtocolNetwork, NetworkType } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { NetworkInfo, getNetworkInfo } from '../../utils/network'

@Component({
  selector: 'airgap-network-badge',
  templateUrl: './network-badge.component.html',
  styleUrls: ['./network-badge.component.scss']
})
export class NetworkBadgeComponent implements AfterViewInit {
  @Input()
  public readonly network: ProtocolNetwork | undefined

  public readonly networkType: typeof NetworkType = NetworkType
  public networkInfo: NetworkInfo | undefined

  public ngAfterViewInit(): void {
    if (this.network) {
      this.networkInfo = getNetworkInfo(this.network)
    }
  }
}
