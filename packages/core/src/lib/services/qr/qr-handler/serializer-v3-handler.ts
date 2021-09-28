import { generateId, IACMessageDefinitionObjectV3, IACMessageType, MainProtocolSymbols, SerializerV3 } from '@airgap/coinlib-core'
import { UR, URDecoder, UREncoder } from '@ngraveio/bc-ur'
import * as bs58check from 'bs58check'
import { IACHandlerStatus, IACMessageHandler } from '../../iac/message-handler'
import { CryptoPSBT } from '@keystonehq/bc-ur-registry'

export class SerializerV3Handler implements IACMessageHandler<IACMessageDefinitionObjectV3[]> {
  public readonly name: string = 'SerializerV3Handler'
  private readonly serializer: SerializerV3
  private decoder: URDecoder = new URDecoder()

  private readonly callback: any = (): void => undefined

  private parts: Set<string> = new Set()

  private combinedData: Buffer | undefined

  constructor(callback: any = (): void => undefined) {
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

  public async handleComplete(): Promise<IACMessageDefinitionObjectV3[]> {
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

  public async getResult(): Promise<IACMessageDefinitionObjectV3[] | undefined> {
    if (this.decoder.isComplete() && this.decoder.isSuccess()) {
      const decoded = this.decoder.resultUR()
      this.combinedData = decoded.decodeCBOR()
      console.log('TYPE ', decoded.type)
      if (decoded.type === 'crypto-psbt') {
        const cryptoPsbt = CryptoPSBT.fromCBOR(decoded.cbor)
        const psbt = cryptoPsbt.getPSBT().toString('hex')
        return [this.convertPSBT(psbt)]
      }

      const resultUr = bs58check.encode(this.combinedData)
      return await this.serializer.deserialize(resultUr)
    }

    return undefined
  }

  /*
   * If we scan an animated QR, but the result is not a serializer message we get the result back
   */
  public async getDataSingle(): Promise<string | undefined> {
    if (!this.combinedData) {
      return
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

  private convertPSBT(psbt: string): IACMessageDefinitionObjectV3 {
    return {
      id: generateId(8),
      protocol: MainProtocolSymbols.BTC_SEGWIT,
      type: IACMessageType.TransactionSignRequest,
      payload: {
        transaction: psbt,
        accountIdentifier: ''
      }
    }
  }
}
