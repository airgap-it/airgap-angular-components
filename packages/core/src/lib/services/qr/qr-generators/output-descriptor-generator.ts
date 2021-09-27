import { bufferFrom, AccountShareResponse, IACMessageDefinitionObjectV3, MainProtocolSymbols } from '@airgap/coinlib-core'
import { IACQrGenerator } from '../../iac/qr-generator'
import * as bs58check from 'bs58check'

import { IACMessageType } from '@airgap/coinlib-core/serializer-v3/interfaces'

class ExtendedPublicKey {
  private readonly rawKey: Buffer
  constructor(extendedPublicKey: string) {
    this.rawKey = bs58check.decode(extendedPublicKey).slice(4)
  }

  toXpub() {
    return this.addPrefix('0488b21e')
  }

  toYPub() {
    return this.addPrefix('049d7cb2')
  }

  toZPub() {
    return this.addPrefix('04b24746')
  }

  getRawKey() {
    return this.rawKey
  }

  private addPrefix(prefix: string) {
    const data = Buffer.concat([bufferFrom(prefix, 'hex'), this.rawKey])
    return bs58check.encode(data)
  }
}

export class OutputDescriptorGenerator extends IACQrGenerator {
  private data: string | undefined

  constructor() {
    super()
  }

  public async create(data: IACMessageDefinitionObjectV3[], _multiFragmentLength: number, _singleFragmentLength: number): Promise<void> {
    if (!(await OutputDescriptorGenerator.canHandle(data))) {
      return
    }

    const element = data[0]

    if (element.type === IACMessageType.AccountShareResponse) {
      this.data = await this.generateOutputDescriptor(element)
    } else {
      throw new Error('Not Supported')
    }
  }

  public static async canHandle(data: IACMessageDefinitionObjectV3[]): Promise<boolean> {
    if (data.length === 1) {
      const element = data[0]
      return element.protocol === MainProtocolSymbols.BTC_SEGWIT && [IACMessageType.AccountShareResponse].includes(element.type)
    }

    return false
  }

  public async nextPart(): Promise<string> {
    return this.data ?? ''
  }

  public async getSingle(): Promise<string> {
    return this.data ?? ''
  }

  public async getNumberOfParts(): Promise<number> {
    return this.data ? 1 : 0
  }

  private async generateOutputDescriptor(data: IACMessageDefinitionObjectV3): Promise<string> {
    // DESC="wpkh([0f056943/84h/1h/0h]tpubDC7jGaaSE66Pn4dgtbAAstde4bCyhSUs4r3P8WhMVvPByvcRrzrwqSvpF9Ghx83Z1LfVugGRrSBko5UEKELCz9HoMv5qKmGq3fqnnbS5E9r/0/*)#erexmnep"

    const account = data.payload as AccountShareResponse

    // const key = new ExtendedPublicKey(account.publicKey)
    // console.log('key.getRawKey()', bufferFrom(key.getRawKey(), undefined))
    // const x = bip32.fromBase58(new ExtendedPublicKey(account.publicKey).toXpub())

    const dpWithoutPrefix = account.derivationPath.slice(1)
    const dpWithoutUnhardened = dpWithoutPrefix.slice(0, dpWithoutPrefix.lastIndexOf("'") + 1)

    return `wpkh([${account.masterFingerprint}${dpWithoutUnhardened}]${account.publicKey}/0/*)`
  }
}
