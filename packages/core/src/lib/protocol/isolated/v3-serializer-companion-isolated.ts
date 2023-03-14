import { AirGapV3SerializerCompanion, SignedTransaction, UnsignedTransaction, V3SchemaConfiguration } from '@airgap/module-kit'
import { TransactionSignRequest, TransactionSignResponse } from '@airgap/serializer'
import { CallMethodOptions, IsolatedModulesPlugin, V3SerializerCompanionCallMethodOptions } from '../../capacitor-plugins/definitions'
import { IsolatedBase } from './base-isolated'

export class IsolatedAirGapV3SerializerCompanion extends IsolatedBase<AirGapV3SerializerCompanion> implements AirGapV3SerializerCompanion {
  constructor(
    isolatedModulesPlugin: IsolatedModulesPlugin,
    public readonly schemas: V3SchemaConfiguration[],
    private readonly moduleIdentifier: string
  ) {
    super(isolatedModulesPlugin)
  }

  public async toTransactionSignRequest(
    identifier: string,
    unsignedTransaction: UnsignedTransaction,
    publicKey: string,
    callbackUrl?: string
  ): Promise<TransactionSignRequest> {
    return this.callMethod('toTransactionSignRequest', [identifier, unsignedTransaction, publicKey, callbackUrl])
  }

  public async fromTransactionSignRequest(
    identifier: string,
    transactionSignRequest: TransactionSignRequest
  ): Promise<UnsignedTransaction> {
    return this.callMethod('fromTransactionSignRequest', [identifier, transactionSignRequest])
  }

  public async validateTransactionSignRequest(identifier: string, transactionSignRequest: TransactionSignRequest): Promise<boolean> {
    return this.callMethod('validateTransactionSignRequest', [identifier, transactionSignRequest])
  }

  public async toTransactionSignResponse(
    identifier: string,
    signedTransaction: SignedTransaction,
    accountIdentifier: string
  ): Promise<TransactionSignResponse> {
    return this.callMethod('toTransactionSignResponse', [identifier, signedTransaction, accountIdentifier])
  }

  public async fromTransactionSignResponse(
    identifier: string,
    transactionSignResponse: TransactionSignResponse
  ): Promise<SignedTransaction> {
    return this.callMethod('fromTransactionSignResponse', [identifier, transactionSignResponse])
  }

  public async validateTransactionSignResponse(identifier: string, transactionSignResponse: TransactionSignResponse): Promise<boolean> {
    return this.callMethod('validateTransactionSignResponse', [identifier, transactionSignResponse])
  }

  protected async createCallOptions(method: V3SerializerCompanionCallMethodOptions['method'], args: unknown[]): Promise<CallMethodOptions> {
    return {
      target: 'v3SerializerCompanion',
      method,
      args,
      moduleIdentifier: this.moduleIdentifier
    }
  }
}
