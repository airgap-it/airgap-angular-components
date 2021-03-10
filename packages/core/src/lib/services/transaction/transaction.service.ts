import {
  IACMessageDefinitionObject,
  IACMessageType,
  IAirGapTransaction,
  ICoinProtocol,
  SignedTransaction,
  UnsignedTransaction
} from '@airgap/coinlib-core'
import { Injectable } from '@angular/core'

import { Token } from '../../types/Token'
import { flattened } from '../../utils/array'
import { ProtocolService } from '../protocol/protocol.service'
import { TokenService } from '../token/token.service'

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  constructor(private readonly protocolService: ProtocolService, private readonly tokenService: TokenService) {}

  public async getDetailsFromIACMessages(messages: IACMessageDefinitionObject[]): Promise<IAirGapTransaction[]> {
    const supportedMessageTypes: IACMessageType[] = [IACMessageType.TransactionSignRequest, IACMessageType.TransactionSignResponse]
    const details: IAirGapTransaction[][] = await Promise.all(
      messages.map(async (message: IACMessageDefinitionObject) => {
        if (!supportedMessageTypes.includes(message.type)) {
          return []
        }

        const protocol: ICoinProtocol = await this.protocolService.getProtocol(message.protocol)

        switch (message.type) {
          case IACMessageType.TransactionSignRequest:
            return this.getDetailsFromUnsigned(protocol, message.payload as UnsignedTransaction)
          case IACMessageType.TransactionSignResponse:
            return this.getDetailsFromSigned(protocol, message.payload as SignedTransaction)
          default:
            return []
        }
      })
    )

    return flattened(details)
  }

  private async getDetailsFromUnsigned(protocol: ICoinProtocol, unsignedTransaction: UnsignedTransaction): Promise<IAirGapTransaction[]> {
    const unsignedDetails: IAirGapTransaction[] = await protocol.getTransactionDetails(unsignedTransaction)

    return Promise.all(
      unsignedDetails.map((details: IAirGapTransaction) => {
        const token: Token | undefined = this.tokenService.getRecipientToken(details)
        if (token !== undefined) {
          return this.tokenService.getTokenTransferDetails(details, unsignedTransaction, token)
        } else {
          return details
        }
      })
    )
  }

  private async getDetailsFromSigned(protocol: ICoinProtocol, signedTransaction: SignedTransaction): Promise<IAirGapTransaction[]> {
    const unsignedDetails: IAirGapTransaction[] = await protocol.getTransactionDetailsFromSigned(signedTransaction)

    return Promise.all(
      unsignedDetails.map((details: IAirGapTransaction) => {
        const token: Token | undefined = this.tokenService.getRecipientToken(details)
        if (token !== undefined) {
          return this.tokenService.getTokenTransferDetailsFromSigned(details, signedTransaction, token)
        } else {
          return details
        }
      })
    )
  }
}
