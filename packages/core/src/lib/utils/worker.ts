import { AirGapWallet } from '@airgap/coinlib-core'

export interface DeriveAddressesAsyncOptions {
  protocolIdentifier: string
  publicKey: string
  isExtendedPublicKey: boolean
  derivationPath: string
  addressIndex?: number
}

export type DerieveAddressesAsyncResult = Record<string, string[]>

async function convertDeriveAddressesWallet(wallet: AirGapWallet | DeriveAddressesAsyncOptions): Promise<DeriveAddressesAsyncOptions> {
  return wallet instanceof AirGapWallet
    ? {
        protocolIdentifier: await wallet.protocol.getIdentifier(),
        publicKey: wallet.publicKey,
        isExtendedPublicKey: wallet.isExtendedPublicKey,
        derivationPath: wallet.derivationPath,
        addressIndex: wallet.addressIndex
      }
    : wallet
}

export async function deriveAddressesAsync(
  walletOrWallets: AirGapWallet | AirGapWallet[] | DeriveAddressesAsyncOptions | DeriveAddressesAsyncOptions[],
  amount: number = 50
): Promise<DerieveAddressesAsyncResult> {
  const wallets: DeriveAddressesAsyncOptions[] = await Promise.all(
    Array.isArray(walletOrWallets)
      ? (walletOrWallets as (AirGapWallet | DeriveAddressesAsyncOptions)[]).map(convertDeriveAddressesWallet)
      : [convertDeriveAddressesWallet(walletOrWallets)]
  )

  if (wallets.length === 0) {
    return {}
  }

  const airGapWorker = new Worker('./assets/workers/airgap-coin-lib.js')

  return new Promise<DerieveAddressesAsyncResult>((resolve) => {
    airGapWorker.onmessage = (event) => {
      resolve(event.data)
    }

    airGapWorker.postMessage({ wallets, amount })
  })
}
