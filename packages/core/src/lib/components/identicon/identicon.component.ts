import { Component, Input } from '@angular/core'
import { createIcon } from '@download/blockies'
import { BigNumber } from 'bignumber.js'
import { toDataUrl } from 'myetherwallet-blockies'
import { MainProtocolSymbols } from '@airgap/coinlib-core'
import { ProtocolService } from '../../services/protocol/protocol.service'

@Component({
  selector: 'airgap-identicon',
  templateUrl: './identicon.component.html',
  styleUrls: ['./identicon.component.scss']
})
export class IdenticonComponent {
  private static readonly b52Characters = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

  @Input()
  public set address(value: string | undefined | null) {
    if (!value) {
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.setAddress(value)
  }

  public identicon: string | undefined

  constructor(private readonly protocolService: ProtocolService) { }

  private async setAddress(value: string): Promise<void> {
    if (await this.protocolService.isAddressOfProtocol(MainProtocolSymbols.AE, value)) {
      this.identicon = createIcon({ seed: value }).toDataURL()
    } else if (await this.protocolService.isAddressOfProtocol(MainProtocolSymbols.XTZ, value)) {
      this.identicon = createIcon({
        seed: `0${this.b582int(value)}`,
        spotcolor: '#000'
      }).toDataURL()
    } else {
      this.identicon = toDataUrl(value.toLowerCase())
    }
  }

  private b582int(v: string): string {
    let rv = new BigNumber(0)
    for (let i = 0; i < v.length; i++) {
      rv = rv.plus(
        new BigNumber(IdenticonComponent.b52Characters.indexOf(v[v.length - 1 - i])).multipliedBy(
          new BigNumber(IdenticonComponent.b52Characters.length).exponentiatedBy(i)
        )
      )
    }

    return rv.toString(16)
  }
}
