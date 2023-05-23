import { IAirGapTransaction, ICoinProtocol, SignedTransaction, UnsignedTransaction } from '@airgap/coinlib-core'
import { ERC20TokenMetadata, erc20Tokens } from '@airgap/ethereum'
import { Injectable } from '@angular/core'

import { Token } from '../../types/Token'
import { createV0ERC20Token } from '../../utils/protocol/protocol-v0-adapter'

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  public getRecipientToken(tx: IAirGapTransaction): Token | undefined {
    return Object.values(erc20Tokens).find((token: ERC20TokenMetadata) => token.contractAddress.toLowerCase() === tx.to[0].toLowerCase())
  }

  public async getTokenTransferDetailsFromSigned(
    tx: IAirGapTransaction,
    signedTransaction: SignedTransaction,
    recipientToken?: Token
  ): Promise<IAirGapTransaction> {
    const token: Token | undefined = recipientToken ?? this.getRecipientToken(tx)
    if (token !== undefined) {
      const genericErc20: ICoinProtocol = await createV0ERC20Token(token)

      try {
        const transactions: IAirGapTransaction[] = await genericErc20.getTransactionDetailsFromSigned(signedTransaction)

        if (transactions.length !== 1) {
          throw Error('`getTransactionDetailsFromSigned` returned more than 1 transaction!')
        }

        return transactions[0]
      } catch (error) {}
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
      const genericErc20: ICoinProtocol = await createV0ERC20Token(token)

      try {
        const transactions: IAirGapTransaction[] = await genericErc20.getTransactionDetails(unsignedTransaction)
        if (transactions.length !== 1) {
          throw Error('`getTransactionDetails` returned more than 1 transaction!')
        }

        return transactions[0]
      } catch (error) {}
    }

    return tx
  }
}
