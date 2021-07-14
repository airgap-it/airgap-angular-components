import { Pipe, PipeTransform } from '@angular/core'
import { AirGapWallet, AirGapWalletStatus } from '@airgap/coinlib-core'

interface WalletFilterPipeArgs {
  symbol?: string
  status?: AirGapWalletStatus | AirGapWalletStatus[]
}

@Pipe({
  name: 'walletFilter'
})
export class WalletFilterPipe implements PipeTransform {
  public transform(items: AirGapWallet[], args: WalletFilterPipeArgs): AirGapWallet[] {
    if (items === null || items?.length === 0) {
      return []
    }

    const symbol: string | undefined = args?.symbol
    const status: AirGapWalletStatus | AirGapWalletStatus[] | undefined = args?.status

    if (symbol === undefined && status === undefined) {
      return items
    } else {
      return items.filter((wallet: AirGapWallet) => {
        const symbolCompliant: boolean =
          symbol === undefined ||
          wallet.protocol.symbol.toLowerCase().includes(symbol) ||
          wallet.protocol.name.toLowerCase().includes(symbol)
        const statusCompliant: boolean =
          status === undefined || (Array.isArray(status) ? status.includes(wallet.status) : wallet.status === status)

        return symbolCompliant && statusCompliant
      })
    }
  }
}
