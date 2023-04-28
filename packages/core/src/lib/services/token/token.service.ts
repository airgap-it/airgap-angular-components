import { IAirGapTransaction, SignedTransaction, SubProtocolSymbols, UnsignedTransaction } from '@airgap/coinlib-core'
import { GenericERC20, EthereumERC20ProtocolOptions, EthereumProtocolNetwork, EthereumERC20ProtocolConfig } from '@airgap/ethereum'
import { RskERC20ProtocolConfig, RskERC20ProtocolOptions, RskProtocolNetwork, GenericRskERC20 } from '@airgap/rsk'
import { Injectable } from '@angular/core'

import { Token } from '../../types/Token'
import { ethTokens, rskTokens } from '../protocol/tokens'

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  public getRecipientToken(tx: IAirGapTransaction): Token | undefined {
    const tokens = ethTokens.concat(rskTokens)

    return tokens.find((token: Token) => token.contractAddress.toLowerCase() === tx.to[0].toLowerCase())
  }

  public async getTokenTransferDetailsFromSigned(
    tx: IAirGapTransaction,
    signedTransaction: SignedTransaction,
    recipientToken?: Token
  ): Promise<IAirGapTransaction> {
    const token: Token | undefined = recipientToken ?? this.getRecipientToken(tx)
    const hasMatched = rskTokens.some(rskToken => rskToken.symbol === token?.symbol)

    if (token && hasMatched) {
      const genericRskERC20: GenericRskERC20 = new GenericRskERC20(
        new RskERC20ProtocolOptions(
          new RskProtocolNetwork(),
          new RskERC20ProtocolConfig(
            token.symbol,
            token.name,
            token.marketSymbol,
            token.identifier as SubProtocolSymbols,
            token.contractAddress,
            token.decimals
          )
        )
      )

      const transactions: IAirGapTransaction[] = await genericRskERC20.getTransactionDetailsFromSigned(signedTransaction)

      if (transactions.length !== 1) {
        throw Error('`getTransactionDetailsFromSigned` returned more than 1 transaction!')
      }

      return transactions[0]
    } else if (token !== undefined) {
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

      try {
        const transactions: IAirGapTransaction[] = await genericErc20.getTransactionDetailsFromSigned(signedTransaction)

        if (transactions.length !== 1) {
          throw Error('`getTransactionDetailsFromSigned` returned more than 1 transaction!')
        }

        return transactions[0]
      } catch (error) { }
    }

    return tx
  }

  public async getTokenTransferDetails(
    tx: IAirGapTransaction,
    unsignedTransaction: UnsignedTransaction,
    recipientToken?: Token
  ): Promise<IAirGapTransaction> {
    const token: Token | undefined = recipientToken ?? this.getRecipientToken(tx)
    const hasMatched = rskTokens.some(rskToken => rskToken.symbol === token?.symbol)

    if (token && hasMatched) {
      const genericRskERC20: GenericRskERC20 = new GenericRskERC20(
        new RskERC20ProtocolOptions(
          new RskProtocolNetwork(),
          new RskERC20ProtocolConfig(
            token.symbol,
            token.name,
            token.marketSymbol,
            token.identifier as SubProtocolSymbols,
            token.contractAddress,
            token.decimals
          )
        )
      )

      const transactions: IAirGapTransaction[] = await genericRskERC20.getTransactionDetails(unsignedTransaction)

      if (transactions.length !== 1) {
        throw Error('`getTransactionDetails` returned more than 1 transaction!')
      }

      return transactions[0]
    } else if (token !== undefined) {      
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
      try {
        const transactions: IAirGapTransaction[] = await genericErc20.getTransactionDetails(unsignedTransaction)
        if (transactions.length !== 1) {
          throw Error('`getTransactionDetails` returned more than 1 transaction!')
        }

        return transactions[0]
      } catch (error) { }

    }

    return tx
  }
}
