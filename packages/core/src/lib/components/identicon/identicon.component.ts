import { Component, Input } from '@angular/core'
import { createIcon } from '@download/blockies'
import { BigNumber } from 'bignumber.js'
import { toDataUrl } from 'myetherwallet-blockies'

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

    if (value.startsWith('ak_')) {
      this.identicon = createIcon({ seed: value }).toDataURL()
    } else if (value.startsWith('tz') || value.startsWith('kt')) {
      this.identicon = createIcon({
        seed: `0${this.b582int(value)}`,
        spotcolor: '#000'
      }).toDataURL()
    } else {
      this.identicon = toDataUrl(value.toLowerCase())
    }
  }

  public identicon: string | undefined

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
