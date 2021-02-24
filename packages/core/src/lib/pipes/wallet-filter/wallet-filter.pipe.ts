import { Pipe, PipeTransform } from '@angular/core'
import { AirGapWallet } from '@airgap/coinlib-core'

@Pipe({
  name: 'walletFilter'
})
export class WalletFilterPipe implements PipeTransform {
  public transform(items: AirGapWallet[], args: { symbol: string | undefined }): AirGapWallet[] {
    if (items.length === 0) {
      return []
    }

    const symbol: string | undefined = args.symbol
    if (symbol === undefined) {
      return items
    } else {
      return items.filter(
        (wallet) => wallet.protocol.symbol.toLowerCase().includes(symbol) || wallet.protocol.name.toLowerCase().includes(symbol)
      )
    }
  }
}
