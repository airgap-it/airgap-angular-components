import { AirGapWallet, ICoinProtocol, MainProtocolSymbols, UnsignedTransaction } from '@airgap/coinlib-core'
import { MessageSignRequest } from '@airgap/serializer'
import { Injectable } from '@angular/core'
import { ICoinProtocolAdapter } from '../../protocol/protocol-v0-adapter'

type Unsigned = UnsignedTransaction | MessageSignRequest

@Injectable({
  providedIn: 'root'
})
export class KeyPairService {
  public async signWithWallet(wallet: AirGapWallet, unsigned: Unsigned, mnemonic: string, password: string): Promise<string> {
    return this.signWithProtocol(wallet.protocol, unsigned, mnemonic, password, wallet.isExtendedPublicKey, wallet.derivationPath)
  }

  public async signWithProtocol(
    protocol: ICoinProtocol,
    unsigned: Unsigned,
    mnemonic: string,
    password: string,
    withExtendedPrivateKey: boolean = false,
    optionalDerivationPath?: string,
    childDerivationPath?: string
  ): Promise<string> {
    const derivationPath: string = optionalDerivationPath ?? (await protocol.getStandardDerivationPath())
    if (!(await this.checkPassword(protocol, unsigned, mnemonic, withExtendedPrivateKey, derivationPath, password))) {
      throw new Error('Invalid BIP-39 passphrase')
    }

    if (withExtendedPrivateKey) {
      const extendedPrivateKey: string = await protocol.getExtendedPrivateKeyFromMnemonic(mnemonic, derivationPath, password)

      if (this.isUnsignedTransaction(unsigned)) {
        return protocol.signWithExtendedPrivateKey(extendedPrivateKey, unsigned.transaction, childDerivationPath)
      } else {
        const privateKey = (await protocol.getIdentifier()).startsWith(MainProtocolSymbols.ETH)
          ? protocol instanceof ICoinProtocolAdapter
            ? await protocol.getPrivateKeyFromExtendedPrivateKey(extendedPrivateKey, childDerivationPath)
            : await (protocol as any).getPrivateKeyFromExtendedPrivateKey(extendedPrivateKey, childDerivationPath) // This only exists on ETH
          : extendedPrivateKey

        return protocol.signMessage(unsigned.message, { privateKey })
      }
    } else {
      const privateKey: string = await protocol.getPrivateKeyFromMnemonic(mnemonic, derivationPath, password)

      return this.isUnsignedTransaction(unsigned)
        ? protocol.signWithPrivateKey(privateKey, unsigned.transaction)
        : protocol.signMessage(unsigned.message, { privateKey })
    }
  }

  public async checkPassword(
    protocol: ICoinProtocol,
    unsigned: Unsigned,
    mnemonic: string,
    withExtendedPrivateKey: boolean = false,
    derivationPath: string,
    password: string
  ): Promise<boolean> {
    if (unsigned.publicKey.length === 0) {
      // the password can't be verified
      return true
    }

    const publicKey: string =
      withExtendedPrivateKey && (await protocol.getSupportsHD())
        ? await protocol.getExtendedPublicKeyFromMnemonic(mnemonic, derivationPath, password)
        : await protocol.getPublicKeyFromMnemonic(mnemonic, derivationPath, password)

    return publicKey === unsigned.publicKey
  }

  private isUnsignedTransaction(unsigned: Unsigned): unsigned is UnsignedTransaction {
    return 'transaction' in unsigned
  }
}
