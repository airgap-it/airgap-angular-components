import { UR, URDecoder, UREncoder } from '@ngraveio/bc-ur'
import * as bs58check from 'bs58check'
import { CryptoKeypath, CryptoPSBT } from '@keystonehq/bc-ur-registry'
import { EthSignRequest, DataType } from '@keystonehq/bc-ur-registry-eth'
import { Transaction, TransactionFactory } from '@ethereumjs/tx'
import { UnsignedBitcoinSegwitTransaction } from '@airgap/bitcoin'
import { MainProtocolSymbols } from '@airgap/coinlib-core'
import { IACMessageDefinitionObjectV3, SerializerV3, generateId, IACMessageType, MessageSignRequest } from '@airgap/serializer'
import { IACHandlerStatus, IACMessageHandler, IACMessageWrapper } from '../../iac/message-handler'

export class SerializerV3Handler implements IACMessageHandler<IACMessageDefinitionObjectV3[]> {
  public readonly name: string = 'SerializerV3Handler'
  private readonly serializer: SerializerV3
  private decoder: URDecoder = new URDecoder()

  private readonly callback: (data: IACMessageWrapper<IACMessageDefinitionObjectV3[]>) => void = (): void => undefined

  private parts: Set<string> = new Set()

  private combinedData: Buffer | undefined

  private resultCache: IACMessageWrapper<IACMessageDefinitionObjectV3[]> | undefined

  constructor(callback: (data: IACMessageWrapper<IACMessageDefinitionObjectV3[]>) => void = (): void => undefined) {
    this.serializer = new SerializerV3()
    this.callback = callback
    // completion callback
  }

  public async canHandle(data: string): Promise<boolean> {
    if (data.toUpperCase().startsWith('UR:')) {
      return true
    } else {
      try {
        const ur = this.getParsedData(data)

        return ur && ur.length > 0 ? true : false
      } catch (e) {
        return false
      }
    }
  }

  public getParsedData(data: string): string {
    if (data.toUpperCase().startsWith('UR:')) {
      return data
    }
    let ur: string | null = data
    try {
      const url = new URL(data)
      ur = `UR:BYTES/${url.searchParams.get('ur')}`
    } catch (e) {}

    return ur ?? ''
  }

  public async receive(_data: string): Promise<IACHandlerStatus> {
    const data = this.getParsedData(_data)
    if (this.parts.has(data)) {
      return IACHandlerStatus.PARTIAL
    }
    this.parts.add(data)
    const canHandle = await this.canHandle(data)
    if (!canHandle) {
      return IACHandlerStatus.UNSUPPORTED
    }

    try {
      const res = this.decoder.receivePart(data)
      if (!res) {
        // If we already have progress, but the scanner scans a "new set of QRs", it should reset itself and handle the part.
        this.reset()

        return this.receive(_data)
      }
    } catch (e) {
      return IACHandlerStatus.UNSUPPORTED
    }

    if (this.decoder.isComplete() && this.decoder.isSuccess()) {
      return IACHandlerStatus.SUCCESS
    }

    return IACHandlerStatus.PARTIAL
  }

  public async handleComplete(): Promise<IACMessageWrapper<IACMessageDefinitionObjectV3[]>> {
    const result = await this.getResult()
    if (!result) {
      throw new Error('Data not complete!')
    }
    this.callback(result)

    return result
  }

  public async getProgress(): Promise<number> {
    return Number(this.decoder.estimatedPercentComplete().toFixed(2))
  }

  public async getResult(): Promise<IACMessageWrapper<IACMessageDefinitionObjectV3[]> | undefined> {
    if (this.resultCache) {
      return this.resultCache
    }

    if (this.decoder.isComplete() && this.decoder.isSuccess()) {
      const decoded = this.decoder.resultUR()
      this.combinedData = decoded.decodeCBOR()
      console.log('TYPE ', decoded.type)
      if (decoded.type === 'crypto-psbt') {
        const cryptoPsbt = CryptoPSBT.fromCBOR(decoded.cbor)
        const psbt = cryptoPsbt.getPSBT().toString('hex')

        return this.convertPSBT(psbt)
      }

      if (decoded.type === 'eth-sign-request') {
        const signRequest = EthSignRequest.fromCBOR(decoded.cbor)

        return this.convertMetaMaskSignRequest(signRequest)
      }

      const resultUr = bs58check.encode(this.combinedData)

      return { result: await this.serializer.deserialize(resultUr), data: await this.getDataSingle() }
    }

    return undefined
  }

  /*
   * If we scan an animated QR, but the result is not a serializer message we get the result back
   */
  public async getDataSingle(): Promise<string | undefined> {
    if (!this.combinedData) {
      return undefined
    }
    const ur = UR.fromBuffer(this.combinedData)
    const part = new UREncoder(ur, Number.MAX_SAFE_INTEGER).nextPart()

    return part.toUpperCase()
  }

  public async reset(): Promise<void> {
    this.decoder = new URDecoder()
    this.parts = new Set()

    return
  }

  private async convertPSBT(psbt: string): Promise<IACMessageWrapper<IACMessageDefinitionObjectV3[]>> {
    const payload: UnsignedBitcoinSegwitTransaction = {
      transaction: { psbt },
      publicKey: ''
    }

    return {
      result: [
        {
          id: generateId(8),
          protocol: MainProtocolSymbols.BTC_SEGWIT,
          type: IACMessageType.TransactionSignRequest,
          payload
        }
      ],
      data: await this.getDataSingle()
    }
  }

  private async convertMetaMaskSignRequest(request: EthSignRequest): Promise<IACMessageWrapper<IACMessageDefinitionObjectV3[]>> {
    const data = request.getSignData()

    const sourceFingerprint = ((request as any).derivationPath as CryptoKeypath).getSourceFingerprint().toString('hex')

    const ownRequestId: number = generateId(8)

    const metamaskRequestId: string = request.getRequestId().toString('hex')

    // TODO: This should be moved to a higher level, probably the "iac.service", and properly store context for any kind of request.
    const IDs = JSON.parse(localStorage.getItem('TEMP-MM-REQUEST-IDS') ?? '{}')
    IDs[ownRequestId] = metamaskRequestId
    localStorage.setItem('TEMP-MM-REQUEST-IDS', JSON.stringify(IDs))

    const context = { requestId: metamaskRequestId, derivationPath: request.getDerivationPath(), sourceFingerprint }

    switch (request.getDataType()) {
      case DataType.transaction: {
        const ethTx = TransactionFactory.fromSerializedData(Buffer.from(data))

        const tx: Transaction = ethTx as Transaction

        return {
          result: [
            {
              id: ownRequestId,
              protocol: MainProtocolSymbols.ETH,
              type: IACMessageType.TransactionSignRequest,
              payload: {
                transaction: {
                  nonce: `0x${tx.nonce.toString(16)}`,
                  gasPrice: `0x${tx.gasPrice.toString(16)}`,
                  gasLimit: `0x${tx.gasLimit.toString(16)}`,
                  to: tx.to.toString(),
                  value: `0x${tx.value.toString(16)}`,
                  chainId: request.getChainId(),
                  data: `0x${tx.data.toString('hex')}`
                },
                publicKey: ''
              }
            }
          ],
          data: await this.getDataSingle(),
          context
        }
      }

      case DataType.typedData:
        const typedDataSignRequest: MessageSignRequest = {
          message: data.toString(),
          publicKey: ''
        }

        return {
          result: [
            {
              id: ownRequestId,
              protocol: MainProtocolSymbols.ETH,
              type: IACMessageType.MessageSignRequest,
              payload: typedDataSignRequest
            }
          ],
          data: await this.getDataSingle(),
          context
        }
      case DataType.personalMessage:
        const signRequest: MessageSignRequest = {
          message: `0x${data.toString('hex')}`,
          publicKey: ''
        }

        return {
          result: [
            {
              id: ownRequestId,
              protocol: MainProtocolSymbols.ETH,
              type: IACMessageType.MessageSignRequest,
              payload: signRequest
            }
          ],
          data: await this.getDataSingle(),
          context
        }

      case DataType.typedTransaction: {
        return {
          result: [
            {
              id: ownRequestId,
              protocol: MainProtocolSymbols.ETH,
              type: IACMessageType.TransactionSignRequest,
              payload: {
                transaction: {
                  serialized: data.toString('hex'),
                  derivationPath: request.getDerivationPath(),
                  masterFingerprint: sourceFingerprint
                },
                publicKey: ''
              }
            }
          ],
          data: await this.getDataSingle(),
          context
        }
      }

      default:
        throw new Error(`Unable to handle data type "${request.getDataType()}"`)
    }
  }
}
