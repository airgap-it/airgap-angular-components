import {
  AddressWithCursor,
  AirGapOfflineProtocol,
  AirGapTransaction,
  CryptoConfiguration,
  CryptoDerivative,
  KeyPair,
  ProtocolMetadata,
  PublicKey,
  SecretKey,
  SignedTransaction,
  UnsignedTransaction
} from '@airgap/module-kit'
import { CallMethodOptions, IsolatedModulesPlugin, OfflineProtocolCallMethodOptions } from '../../capacitor-plugins/definitions'
import { IsolatedProtocol } from '../../types/isolated-modules/IsolatedModule'
import { IsolatedBase } from './base-isolated'

export class IsolatedAirGapOfflineProtocol extends IsolatedBase<AirGapOfflineProtocol> implements AirGapOfflineProtocol {
  constructor(isolatedModulesPlugin: IsolatedModulesPlugin, private readonly isolatedProtocol: IsolatedProtocol) {
    super(isolatedModulesPlugin, isolatedProtocol.methods)
  }

  public async getMetadata(): Promise<ProtocolMetadata> {
    return this.isolatedProtocol.protocolMetadata
  }

  public async getAddressFromPublicKey(publicKey: PublicKey): Promise<string | AddressWithCursor> {
    return this.callMethod('getAddressFromPublicKey', [publicKey])
  }

  public async getDetailsFromTransaction(
    transaction: SignedTransaction | UnsignedTransaction,
    publicKey: PublicKey
  ): Promise<AirGapTransaction[]> {
    return this.callMethod('getDetailsFromTransaction', [transaction, publicKey])
  }

  private cryptoConfiguration: CryptoConfiguration | undefined = this.isolatedProtocol.crypto
  public async getCryptoConfiguration(): Promise<CryptoConfiguration> {
    if (this.cryptoConfiguration === undefined) {
      this.cryptoConfiguration = await this.callMethod('getCryptoConfiguration')
    }

    return this.cryptoConfiguration
  }

  public async getKeyPairFromDerivative(derivative: CryptoDerivative): Promise<KeyPair> {
    return this.callMethod('getKeyPairFromDerivative', [derivative])
  }

  public async signTransactionWithSecretKey(transaction: UnsignedTransaction, secretKey: SecretKey): Promise<SignedTransaction> {
    return this.callMethod('signTransactionWithSecretKey', [transaction, secretKey])
  }

  protected async createCallOptions(method: OfflineProtocolCallMethodOptions['method'], args: unknown[]): Promise<CallMethodOptions> {
    return {
      target: 'offlineProtocol',
      method,
      args,
      protocolIdentifier: this.isolatedProtocol.identifier
    }
  }
}
