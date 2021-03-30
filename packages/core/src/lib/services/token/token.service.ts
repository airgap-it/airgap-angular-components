import {
  EthereumERC20ProtocolConfig,
  EthereumERC20ProtocolOptions,
  EthereumProtocolNetwork,
  GenericERC20,
  IAirGapTransaction,
  SignedTransaction,
  SubProtocolSymbols,
  UnsignedTransaction
} from '@airgap/coinlib-core'
import { Injectable } from '@angular/core'

import { Token } from '../../types/Token'
import { ethTokens } from '../protocol/tokens'

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  public getRecipientToken(tx: IAirGapTransaction): Token | undefined {
    return ethTokens.find((token: Token) => token.contractAddress.toLowerCase() === tx.to[0].toLowerCase())
  }

  public async getTokenTransferDetailsFromSigned(
    tx: IAirGapTransaction,
    signedTransaction: SignedTransaction,
    recipientToken?: Token
  ): Promise<IAirGapTransaction> {
    const token: Token | undefined = recipientToken ?? this.getRecipientToken(tx)
    if (token !== undefined) {
      const genericErc20: GenericERC20 = new GenericERC20(
        new EthereumERC20ProtocolOptions(
          new EthereumProtocolNetwork(),
          new EthereumERC20ProtocolConfig(
            token.symbol,
            token.name,
            token.marketSymbol,
            token.identifier as SubProtocolSymbols,
            token.contractAddress,
            token.decimals
          )
        )
      )

      const transactions: IAirGapTransaction[] = await genericErc20.getTransactionDetailsFromSigned(signedTransaction)

      if (transactions.length !== 1) {
        throw Error('`getTransactionDetailsFromSigned` returned more than 1 transaction!')
      }

      return transactions[0]
    }

    return tx
  }

  public async getTokenTransferDetails(
    tx: IAirGapTransaction,
    unsignedTransaction: UnsignedTransaction,
    recipientToken?: Token
  ): Promise<IAirGapTransaction> {
    const token: Token | undefined = recipientToken ?? this.getRecipientToken(tx)
    if (token !== undefined) {
      const genericErc20: GenericERC20 = new GenericERC20(
        new EthereumERC20ProtocolOptions(
          new EthereumProtocolNetwork(),
          new EthereumERC20ProtocolConfig(
            token.symbol,
            token.name,
            token.marketSymbol,
            token.identifier as SubProtocolSymbols,
            token.contractAddress,
            token.decimals
          )
        )
      )

      const transactions: IAirGapTransaction[] = await genericErc20.getTransactionDetails(unsignedTransaction)

      if (transactions.length !== 1) {
        throw Error('`getTransactionDetails` returned more than 1 transaction!')
      }

      return transactions[0]
    }

    return tx
  }
}
