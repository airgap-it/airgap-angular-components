import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { AirGapWallet, ProtocolSymbols } from '@airgap/coinlib-core'

@Component({
  selector: 'airgap-account-item',
  templateUrl: './account-item.component.html',
  styleUrls: ['./account-item.component.scss']
})
export class AccountItemComponent implements OnChanges {
  @Input()
  public wallet: AirGapWallet | undefined

  public address: string | undefined

  public protocolSymbol: string | undefined
  public protocolIdentifier: ProtocolSymbols | undefined
  public protocolName: string | undefined

  public async ngOnChanges(_changes: SimpleChanges): Promise<void> {
    this.address = this.wallet?.receivingPublicAddress

    const [protocolSymbol, protocolIdentifier, protocolName]: [string, ProtocolSymbols, string] = await Promise.all([
      this.wallet?.protocol.getSymbol() ?? Promise.resolve(undefined),
      this.wallet?.protocol.getIdentifier() ?? Promise.resolve(undefined),
      this.wallet?.protocol.getName() ?? Promise.resolve(undefined)
    ])

    this.protocolSymbol = protocolSymbol
    this.protocolIdentifier = protocolIdentifier
    this.protocolName = protocolName
  }
}
