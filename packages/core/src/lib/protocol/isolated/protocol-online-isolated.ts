import {
  AddressWithCursor,
  AirGapOnlineProtocol,
  AirGapTransaction,
  AirGapTransactionsWithCursor,
  Amount,
  Balance,
  FeeEstimation,
  ProtocolMetadata,
  ProtocolNetwork,
  protocolNetworkIdentifier,
  PublicKey,
  SignedTransaction,
  TransactionConfiguration,
  TransactionCursor,
  TransactionDetails,
  UnsignedTransaction
} from '@airgap/module-kit'
import { CallMethodOptions, IsolatedModulesPlugin, OnlineProtocolCallMethodOptions } from '../../capacitor-plugins/definitions'
import { IsolatedProtocol } from '../../types/isolated-modules/IsolatedModule'
import { IsolatedBase } from './base-isolated'

export class IsolatedAirGapOnlineProtocol extends IsolatedBase<AirGapOnlineProtocol> implements AirGapOnlineProtocol {
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

  public async getNetwork(): Promise<ProtocolNetwork> {
    return this.isolatedProtocol.network ?? this.callMethod('getNetwork')
  }

  public async getTransactionsForPublicKey(
    publicKey: PublicKey,
    limit: number,
    cursor?: TransactionCursor
  ): Promise<AirGapTransactionsWithCursor> {
    return this.callMethod('getTransactionsForPublicKey', [publicKey, limit, cursor])
  }

  public async getBalanceOfPublicKey(publicKey: PublicKey, configuration?: any): Promise<Balance> {
    return this.callMethod('getBalanceOfPublicKey', [publicKey, configuration])
  }

  public async getTransactionMaxAmountWithPublicKey(
    publicKey: PublicKey,
    to: string[],
    configuration?: TransactionConfiguration
  ): Promise<Amount> {
    return this.callMethod('getTransactionMaxAmountWithPublicKey', [publicKey, to, configuration])
  }

  public async getTransactionFeeWithPublicKey(publicKey: PublicKey, details: TransactionDetails[]): Promise<FeeEstimation> {
    return this.callMethod('getTransactionFeeWithPublicKey', [publicKey, details])
  }

  public async prepareTransactionWithPublicKey(
    publicKey: PublicKey,
    details: TransactionDetails[],
    configuration?: TransactionConfiguration
  ): Promise<UnsignedTransaction> {
    return this.callMethod('prepareTransactionWithPublicKey', [publicKey, details, configuration])
  }

  public async broadcastTransaction(transaction: SignedTransaction): Promise<string> {
    return this.callMethod('broadcastTransaction', [transaction])
  }

  protected async createCallOptions(method: OnlineProtocolCallMethodOptions['method'], args: unknown[]): Promise<CallMethodOptions> {
    return {
      target: 'onlineProtocol',
      method,
      args,
      protocolIdentifier: this.isolatedProtocol.identifier,
      networkId: protocolNetworkIdentifier(this.isolatedProtocol.network ?? (await this.getNetwork()))
    }
  }
}
