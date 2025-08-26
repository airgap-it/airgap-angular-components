/* eslint-disable max-classes-per-file */
import { UREncoder } from '@ngraveio/bc-ur'
import * as bs58check from 'bs58check'
// import * as ecc from 'tiny-secp256k1'
import * as ecc from '@bitcoinerlab/secp256k1'

import { BIP32Factory } from 'bip32'
// import ecc from 'tiny-secp256k1'

import {
  CryptoKeypath,
  CryptoHDKey,
  CryptoOutput,
  ScriptExpressions,
  CryptoAccount,
  PathComponent,
  CryptoPSBT,
  patchTags
} from '@keystonehq/bc-ur-registry'
import { BitcoinSegwitTransactionSignResponse } from '@airgap/bitcoin'
import { bufferFrom, MainProtocolSymbols } from '@airgap/coinlib-core'
import { AccountShareResponse, IACMessageDefinitionObjectV3, IACMessageType } from '@airgap/serializer'

import { IACQrGenerator } from '../../iac/qr-generator'
import { ScriptExpression } from '@keystonehq/bc-ur-registry/dist/ScriptExpression'

class ExtendedPublicKey {
  private readonly rawKey: Buffer

  constructor(extendedPublicKey: string) {
    this.rawKey = bs58check.decode(extendedPublicKey).slice(4)
  }

  public toXpub() {
    return this.addPrefix('0488b21e')
  }

  public toYPub() {
    return this.addPrefix('049d7cb2')
  }

  public toZPub() {
    return this.addPrefix('04b24746')
  }

  public getRawKey() {
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
  private readonly bip32 = BIP32Factory(ecc)

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
        (element.protocol === MainProtocolSymbols.BTC_SEGWIT ||
          element.protocol === MainProtocolSymbols.BTC ||
          element.protocol === MainProtocolSymbols.BTC_TAPROOT) &&
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

    const extendedPublicKey = this.bip32.fromBase58(new ExtendedPublicKey(account.publicKey).toXpub())

    const cryptoKeyPathComponents = []
    for (const component of account.derivationPath.split('/')) {
      if (component === 'm') continue
      const index = parseInt(component, 10)
      const hardened = component.endsWith('h') || component.endsWith("'")
      cryptoKeyPathComponents.push(new PathComponent({ index, hardened }))
    }

    const parentFingerprint = Buffer.alloc(4)
    parentFingerprint.writeUInt32BE(extendedPublicKey.parentFingerprint, 0)

    const isTaproot = data.protocol === MainProtocolSymbols.BTC_TAPROOT
    const isSegwit = data.protocol === MainProtocolSymbols.BTC_SEGWIT

    let scriptExpressions: ScriptExpression[] = []

    if (isTaproot) {
      const TR = new ScriptExpression(409, 'tr')
      patchTags([409])
      scriptExpressions = [TR]
    } else if (isSegwit) {
      scriptExpressions = [ScriptExpressions.WITNESS_PUBLIC_KEY_HASH]
    } else {
      //default to legacy
      scriptExpressions = [ScriptExpressions.PUBLIC_KEY_HASH]
    }

    const cryptoAccount = new CryptoAccount(bufferFrom(account.masterFingerprint, 'hex'), [
      new CryptoOutput(
        scriptExpressions,
        new CryptoHDKey({
          isMaster: false,
          key: Buffer.from(extendedPublicKey.publicKey),
          chainCode: Buffer.from(extendedPublicKey.chainCode),
          origin: new CryptoKeypath(cryptoKeyPathComponents, Buffer.from(extendedPublicKey.fingerprint), extendedPublicKey.depth),
          parentFingerprint,
          name: account.groupLabel
        })
      )
    ])

    return cryptoAccount
  }

  private async generatePSBTMessage(data: IACMessageDefinitionObjectV3): Promise<CryptoPSBT> {
    const transaction = data.payload as BitcoinSegwitTransactionSignResponse

    const psbt = bufferFrom(transaction.transaction, 'hex')

    const cryptoPSBT = new CryptoPSBT(psbt)

    return cryptoPSBT
  }
}
