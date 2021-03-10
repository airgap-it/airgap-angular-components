import { AirGapWallet, ICoinProtocol, MessageSignRequest, UnsignedTransaction } from '@airgap/coinlib-core'
import { Injectable } from '@angular/core'

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
    derivationPath: string = protocol.standardDerivationPath
  ): Promise<string> {
    if (!(await this.checkPassword(protocol, unsigned, mnemonic, derivationPath, password))) {
      throw new Error('Invalid BIP-39 passphrase')
    }

    if (withExtendedPrivateKey && this.isUnsignedTransaction(unsigned)) {
      const extendedPrivateKey: string = await protocol.getExtendedPrivateKeyFromMnemonic(
        mnemonic,
        derivationPath,
        password
      )

      return protocol.signWithExtendedPrivateKey(extendedPrivateKey, unsigned.transaction)
    } else {
      const privateKey: Buffer = await protocol.getPrivateKeyFromMnemonic(mnemonic, derivationPath, password)

      return this.isUnsignedTransaction(unsigned)
        ? protocol.signWithPrivateKey(privateKey, unsigned.transaction)
        : protocol.signMessage(unsigned.message, { privateKey })
    }
  }

  public async checkPassword(
    protocol: ICoinProtocol,
    unsigned: Unsigned,
    mnemonic: string,
    derivationPath: string,
    password: string
  ): Promise<boolean> {
    if (unsigned.publicKey.length === 0) {
      // the password can't be verified
      return true
    }

    const publicKey: string = await protocol.getPublicKeyFromMnemonic(mnemonic, derivationPath, password)

    return publicKey === unsigned.publicKey
  }

  private isUnsignedTransaction(unsigned: Unsigned): unsigned is UnsignedTransaction {
    return 'transaction' in unsigned
  }
}
