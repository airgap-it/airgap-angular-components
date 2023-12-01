import { BitcoinSegwitTransactionSignRequest } from '@airgap/bitcoin'
import { MainProtocolSymbols } from '@airgap/coinlib-core'
import { IACMessageDefinitionObjectV3, generateId, IACMessageType } from '@airgap/serializer'
import { CryptoPSBT } from '@keystonehq/bc-ur-registry'
import { UR, URDecoder, UREncoder } from '@ngraveio/bc-ur'
import { IACHandlerStatus, IACMessageHandler, IACMessageWrapper } from '../../iac/message-handler'
import { QRType } from '../../../components/iac-qr/iac-qr.component'
import {TEMP_BTC_REQUEST_IDS} from "../../../utils/utils"

export class BCURTypesHandler implements IACMessageHandler<IACMessageDefinitionObjectV3[]> {
  public readonly name: string = 'BCURTypesHandler'
  private decoder: URDecoder = new URDecoder()

  private readonly callback: (data: IACMessageWrapper<IACMessageDefinitionObjectV3[]>) => void = (): void => undefined

  private parts: Set<string> = new Set()

  private combinedData: Buffer | undefined

  constructor(callback: (data: IACMessageWrapper<IACMessageDefinitionObjectV3[]>) => void = (): void => undefined) {
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
    return Number(this.decoder.getProgress().toFixed(2))
  }

  public async getResult(): Promise<IACMessageWrapper<IACMessageDefinitionObjectV3[]> | undefined> {
    if (this.decoder.isComplete() && this.decoder.isSuccess()) {
      const decoded = this.decoder.resultUR()
      this.combinedData = decoded.cbor

      if (decoded.type === 'crypto-psbt') {
        const cryptoPsbt = CryptoPSBT.fromCBOR(decoded.cbor)
        const psbt = cryptoPsbt.getPSBT().toString('hex')
        return this.convertPSBT(psbt)
      }

      // TODO: This will be needed in the future to import other accounts, eg. for a multisig setup

      // if (decoded.type === 'bytes') {
      //   const b = Bytes.fromCBOR(decoded.cbor);
      //   return b.getData();
      // }

      // const cryptoAccount = CryptoAccount.fromCBOR(decoded.cbor)

      // console.log('cryptoAccount', cryptoAccount)

      // return [this.convertCryptoAccount(cryptoAccount)]
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

  // TODO: This will be necessary to import other accounts, eg. for a multisig setup

  // private convertCryptoAccount(cryptoAccount: CryptoAccount): IACMessageDefinitionObjectV3 {
  //   const descriptor = cryptoAccount.getOutputDescriptors()[0]

  //   // now, crafting zpub out of data we have
  //   const hdKey = descriptor.getCryptoKey()
  //   if (!(hdKey instanceof CryptoHDKey)) {
  //     return undefined
  //   }
  //   const derivationPath = 'm/' + hdKey.getOrigin().getPath()
  //   // const script = descriptor.getScriptExpressions()[0].getExpression()
  //   const isMultisig = false
  //   const version = Buffer.from(isMultisig ? '02aa7ed3' : '04b24746', 'hex')
  //   const parentFingerprint = hdKey.getParentFingerprint()
  //   const depth = hdKey.getOrigin().getDepth()
  //   const depthBuf = Buffer.alloc(1)
  //   depthBuf.writeUInt8(depth)
  //   const components = hdKey.getOrigin().getComponents()
  //   const lastComponents = components[components.length - 1]
  //   const index = lastComponents.isHardened() ? lastComponents.getIndex() + 0x80000000 : lastComponents.getIndex()
  //   const indexBuf = Buffer.alloc(4)
  //   indexBuf.writeUInt32BE(index)
  //   const chainCode = hdKey.getChainCode()
  //   const key = hdKey.getKey()
  //   const data = Buffer.concat([version, depthBuf, parentFingerprint, indexBuf, chainCode, key])

  //   const zpub = b58.encode(data)

  //   const result = {}
  //   result.ExtPubKey = zpub
  //   result.MasterFingerprint = cryptoAccount.getMasterFingerprint().toString('hex').toUpperCase()
  //   result.AccountKeyPath = derivationPath

  //   const str = JSON.stringify(result)
  //   return Buffer.from(str, 'ascii').toString('hex') // we are expected to return hex-encoded string

  //   return {
  //     id: generateId(8),
  //     protocol: MainProtocolSymbols.BTC_SEGWIT,
  //     type: IACMessageType.AccountShareResponse,
  //     payload: {
  //       publicKey: 'zpub6s1D4v39zP2hNjAtAFRZ7J59W8tK9txcqgSM1STVQHq2AyUoM3eyXqCfXbweMCT5c69EQCz4rMgZQeMyKWfCvfeQVLCGQeCsGVdWkmQ3D4F',
  //       isExtendedPublicKey: true,
  //       derivationPath: "m/84'/0'/0'/0/1",
  //       masterFingerprint: cryptoAccount.getMasterFingerprint().toString('hex'),
  //       isActive: true,
  //       groupId: cryptoAccount.getMasterFingerprint().toString('hex'),
  //       groupLabel: descriptor.getCryptoKey()
  //     }
  //   }
  // }

  private async convertPSBT(psbt: string): Promise<IACMessageWrapper<IACMessageDefinitionObjectV3[]>> {
    const payload: BitcoinSegwitTransactionSignRequest = {
      transaction: { psbt },
      publicKey: ''
    }

    const ownRequestId: number = generateId(8)
    const IDs = JSON.parse(localStorage.getItem(TEMP_BTC_REQUEST_IDS) ?? '{}')
    IDs[ownRequestId] = { qrType: QRType.BC_UR }
    localStorage.setItem(TEMP_BTC_REQUEST_IDS, JSON.stringify(IDs))

    return {
      result: [
        {
          id: ownRequestId,
          protocol: MainProtocolSymbols.BTC_SEGWIT,
          type: IACMessageType.TransactionSignRequest,
          payload
        }
      ],
      data: await this.getDataSingle()
    }
  }
}
