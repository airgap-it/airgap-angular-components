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
  public async transform(items: AirGapWallet[], args: WalletFilterPipeArgs): Promise<AirGapWallet[]> {
    if (items === null || items?.length === 0) {
      return []
    }

    const symbol: string | undefined = args?.symbol
    const status: AirGapWalletStatus | AirGapWalletStatus[] | undefined = args?.status
    const network: string | ProtocolNetwork | undefined = args?.network

    if (!symbol && !status && !network) {
      return items
    } else {
      const filtered: (AirGapWallet | undefined)[] = await Promise.all(
        items.map(async (wallet: AirGapWallet) => {
          const symbolCompliant: boolean =
            !symbol ||
            (await wallet.protocol.getSymbol()).toLowerCase().includes(symbol) ||
            (await wallet.protocol.getName()).toLowerCase().includes(symbol)
          const statusCompliant: boolean = !status || (Array.isArray(status) ? status.includes(wallet.status) : wallet.status === status)
          const networkCompliant: boolean =
            !network ||
            (await wallet.protocol.getOptions()).network.identifier === (typeof network === 'string' ? network : network.identifier)

          return symbolCompliant && statusCompliant && networkCompliant ? wallet : undefined
        })
      )

      return filtered.filter((wallet: AirGapWallet | undefined) => wallet !== undefined)
    }
  }
}
