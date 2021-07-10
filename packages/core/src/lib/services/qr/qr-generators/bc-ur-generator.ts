import { bufferFrom, AccountShareResponse, IACMessageDefinitionObjectV3, UnsignedBitcoinTransaction } from '@airgap/coinlib-core'
import { IACQrGenerator } from '../../iac/qr-generator'
import { UR, UREncoder } from '@ngraveio/bc-ur'
import * as bs58check from 'bs58check'
import * as bip32 from 'bip32'

import { CryptoHDKey, CryptoOutput, ScriptExpressions, CryptoAccount, PathComponent, CryptoPSBT } from '@keystonehq/bc-ur-registry'
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

export class BCURTypesGenerator extends IACQrGenerator {
  private encoder: UREncoder | undefined

  private ur: UR | undefined

  constructor() {
    super()
  }

  public async create(data: IACMessageDefinitionObjectV3[], multiFragmentLength: number, singleFragmentLength: number): Promise<void> {
    if (data.length > 1) {
      return
    }

    const element = data[0]

    let result: CryptoAccount | CryptoPSBT
    if (element.type === IACMessageType.AccountShareResponse) {
      result = await this.generateCryptoAccountMessage(element)
    } else if (element.type === IACMessageType.TransactionSignResponse) {
      result = await this.generatePSBTMessage(element)
    } else {
      throw new Error('Not Supported')
    }

    // We first try to create a larger "single chunk" fragment
    this.encoder = result.toUREncoder(singleFragmentLength)

    // If this is not possible, we use the multiFragmentLength
    if (this.encoder.fragmentsLength !== 1) {
      this.encoder = result.toUREncoder(multiFragmentLength)
    }
  }

  public async nextPart(): Promise<string> {
    if (this.encoder) {
      return this.encoder.nextPart().toUpperCase()
    } else {
      return ''
    }
  }

  public async getSingle(prefix: string): Promise<string> {
    if (this.ur) {
      const part = new UREncoder(this.ur, Number.MAX_SAFE_INTEGER).nextPart()
      const regex = /([^/]+$)/g
      const match = part.match(regex)
      const data = match && match[0] ? match[0] : part
      return this.prefixSingle(data.toUpperCase(), prefix, 'ur')
    } else {
      return ''
    }
  }

  public async getNumberOfParts(): Promise<number> {
    return this.encoder?.fragmentsLength ?? 0
  }

  private async generateCryptoAccountMessage(data: IACMessageDefinitionObjectV3) {
    const account = data.payload as AccountShareResponse

    const key = new ExtendedPublicKey(account.publicKey)
    console.log('key.getRawKey()', bufferFrom(key.getRawKey(), undefined))
    const x = bip32.fromBase58(new ExtendedPublicKey(account.publicKey).toXpub())

    const cryptoKeyPathComponents = []
    for (const component of account.derivationPath.split('/')) {
      if (component === 'm') continue
      const index = parseInt(component)
      const hardened = component.endsWith('h') || component.endsWith("'")
      cryptoKeyPathComponents.push(new PathComponent({ index, hardened }))
    }

    console.log('account.masterFingerprint', bufferFrom(account.masterFingerprint, 'hex'))
    console.log('x.publicKey', x.publicKey)
    console.log('x.chainCode', x.chainCode)
    console.log('x.parentFingerprint', x.parentFingerprint, bufferFrom(new Int32Array([x.parentFingerprint]).buffer, undefined))

    // console.log('details', details)

    const cryptoAccount = new CryptoAccount(bufferFrom(account.masterFingerprint, 'hex'), [
      new CryptoOutput(
        [ScriptExpressions.WITNESS_PUBLIC_KEY_HASH],
        new CryptoHDKey({
          isMaster: false,
          key: x.publicKey
          //   chainCode: x.chainCode,
          //   origin: new CryptoKeypath(cryptoKeyPathComponents, x.fingerprint, x.depth),
          //   parentFingerprint: bufferFrom(new Int32Array([x.parentFingerprint]).buffer),
          //   name: account.groupLabel
        })
      )
    ])

    return cryptoAccount
  }

  private async generatePSBTMessage(data: IACMessageDefinitionObjectV3): Promise<CryptoPSBT> {
    const transaction = data.payload as UnsignedBitcoinTransaction // TODO: BitcoinSegwit

    const psbt = bufferFrom(transaction.transaction as any, 'hex')
    const cryptoPSBT = new CryptoPSBT(psbt)

    return cryptoPSBT
  }
}
