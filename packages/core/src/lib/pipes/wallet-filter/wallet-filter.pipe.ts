import { Pipe, PipeTransform } from '@angular/core'
import { AirGapWallet, AirGapWalletStatus, ProtocolNetwork } from '@airgap/coinlib-core'

interface WalletFilterPipeArgs {
  symbol?: string
  status?: AirGapWalletStatus | AirGapWalletStatus[]
  network?: string | ProtocolNetwork
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
    const network: string | ProtocolNetwork | undefined = args?.network

    if (!symbol && !status && !network) {
      return items
    } else {
      return items.filter((wallet: AirGapWallet) => {
        const symbolCompliant: boolean =
          !symbol ||
          wallet.protocol.symbol.toLowerCase().includes(symbol) ||
          wallet.protocol.name.toLowerCase().includes(symbol)
        const statusCompliant: boolean =
          !status || (Array.isArray(status) ? status.includes(wallet.status) : wallet.status === status)
        const networkCompliant: boolean =
          !network || wallet.protocol.options.network.identifier === (typeof network === 'string' ? network : network.identifier)

        return symbolCompliant && statusCompliant && networkCompliant
      })
    }
  }
}
