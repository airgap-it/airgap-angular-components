import {
  bufferFrom,
  AccountShareResponse,
  IACMessageDefinitionObjectV3,
  UnsignedBitcoinTransaction,
  MainProtocolSymbols
} from '@airgap/coinlib-core'
import { IACQrGenerator } from '../../iac/qr-generator'
import { UR, UREncoder } from '@ngraveio/bc-ur'
import * as bs58check from 'bs58check'
import * as bip32 from 'bip32'

import {
  CryptoKeypath,
  CryptoHDKey,
  CryptoOutput,
  ScriptExpressions,
  CryptoAccount,
  PathComponent,
  CryptoPSBT
} from '@keystonehq/bc-ur-registry'
import { IACMessageType } from '@airgap/coinlib-core/serializer-v3/interfaces'
import { UnsignedBitcoinSegwitTransaction } from '@airgap/coinlib-core/serializer-v3/schemas/definitions/unsigned-transaction-bitcoin-segwit' // TODO: Use import from index

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

  private data: CryptoAccount | CryptoPSBT | undefined

  constructor() {
    super()
  }

  public async create(data: IACMessageDefinitionObjectV3[], multiFragmentLength: number, singleFragmentLength: number): Promise<void> {
    if (!(await BCURTypesGenerator.canHandle(data))) {
      return
    }

    const element = data[0]

    if (element.type === IACMessageType.AccountShareResponse) {
      this.data = await this.generateCryptoAccountMessage(element)
    } else if (element.type === IACMessageType.TransactionSignResponse) {
      this.data = await this.generatePSBTMessage(element)
    } else {
      throw new Error('Not Supported')
    }

    // We first try to create a larger "single chunk" fragment
    this.encoder = this.data.toUREncoder(singleFragmentLength)

    // If this is not possible, we use the multiFragmentLength
    if (this.encoder.fragmentsLength !== 1) {
      this.encoder = this.data.toUREncoder(multiFragmentLength)
    }
  }

  public static async canHandle(data: IACMessageDefinitionObjectV3[]): Promise<boolean> {
    if (data.length === 1) {
      const element = data[0]
      return (
        element.protocol === MainProtocolSymbols.BTC_SEGWIT &&
        [IACMessageType.AccountShareResponse, IACMessageType.TransactionSignResponse].includes(element.type)
      )
    }

    return false
  }

  public async nextPart(): Promise<string> {
    if (this.encoder) {
      return this.encoder.nextPart().toUpperCase()
    } else {
      return ''
    }
  }

  public async getSingle(): Promise<string> {
    if (this.data) {
      return this.data.toUREncoder(Number.MAX_SAFE_INTEGER).nextPart()
    } else {
      return ''
    }
  }

  public async getNumberOfParts(): Promise<number> {
    return this.encoder?.fragmentsLength ?? 0
  }

  private async generateCryptoAccountMessage(data: IACMessageDefinitionObjectV3) {
    const account = data.payload as AccountShareResponse

    const extendedPublicKey = bip32.fromBase58(new ExtendedPublicKey(account.publicKey).toXpub())

    const cryptoKeyPathComponents = []
    for (const component of account.derivationPath.split('/')) {
      if (component === 'm') continue
      const index = parseInt(component)
      const hardened = component.endsWith('h') || component.endsWith("'")
      cryptoKeyPathComponents.push(new PathComponent({ index, hardened }))
    }

    const cryptoAccount = new CryptoAccount(bufferFrom(account.masterFingerprint, 'hex'), [
      new CryptoOutput(
        [ScriptExpressions.WITNESS_PUBLIC_KEY_HASH],
        new CryptoHDKey({
          isMaster: false,
          key: extendedPublicKey.publicKey,
          chainCode: extendedPublicKey.chainCode,
          origin: new CryptoKeypath(cryptoKeyPathComponents, extendedPublicKey.fingerprint, extendedPublicKey.depth),
          parentFingerprint: bufferFrom(new Int32Array([extendedPublicKey.parentFingerprint]).buffer, undefined),
          name: account.groupLabel
        })
      )
    ])

    return cryptoAccount
  }

  private async generatePSBTMessage(data: IACMessageDefinitionObjectV3): Promise<CryptoPSBT> {
    const transaction = data.payload as UnsignedBitcoinSegwitTransaction

    const psbt = bufferFrom(transaction.transaction.psbt, 'hex')

    const cryptoPSBT = new CryptoPSBT(psbt)

    return cryptoPSBT
  }
}
