import { UREncoder } from '@ngraveio/bc-ur'
import * as bip32 from 'bip32'
import * as uuid from 'uuid'

import { CryptoKeypath, PathComponent, CryptoHDKey } from '@keystonehq/bc-ur-registry'
import { ETHSignature } from '@keystonehq/bc-ur-registry-eth'
import { TransactionFactory } from '@ethereumjs/tx'
import { MainProtocolSymbols } from '@airgap/coinlib-core'
import { EthereumTransactionSignResponse } from '@airgap/ethereum'
import { AccountShareResponse, IACMessageDefinitionObjectV3, IACMessageType, MessageSignResponse } from '@airgap/serializer'

import { IACQrGenerator } from '../../iac/qr-generator'

export class MetamaskGenerator extends IACQrGenerator {
  private encoder: UREncoder | undefined

  private data: CryptoHDKey | ETHSignature | undefined

  constructor() {
    super()
  }

  public async create(data: IACMessageDefinitionObjectV3[], multiFragmentLength: number, singleFragmentLength: number): Promise<void> {
    if (!(await MetamaskGenerator.canHandle(data))) {
      return
    }

    const element = data[0]

    if (element.type === IACMessageType.AccountShareResponse) {
      this.data = await this.generateCryptoAccountMessage(element)
    } else if (element.type === IACMessageType.TransactionSignResponse) {
      this.data = await this.generateMessage(element)
    } else if (element.type === IACMessageType.MessageSignResponse) {
      this.data = await this.generateMessage(element)
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
        (element.protocol === MainProtocolSymbols.ETH || element.protocol === MainProtocolSymbols.OPTIMISM) &&
        [IACMessageType.AccountShareResponse, IACMessageType.TransactionSignResponse, IACMessageType.MessageSignResponse].includes(
          element.type
        )
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

  private async generateCryptoAccountMessage(data: IACMessageDefinitionObjectV3): Promise<CryptoHDKey> {
    const account = data.payload as AccountShareResponse
    const extendedPublicKey = bip32.fromBase58(account.publicKey)

    const cryptoKeyPathComponents = []
    for (const component of account.derivationPath.split('/')) {
      if (component === 'm') continue
      const index = parseInt(component, 10)
      const hardened = component.endsWith('h') || component.endsWith("'")
      cryptoKeyPathComponents.push(new PathComponent({ index, hardened }))
    }

    const cryptoHDKey = new CryptoHDKey({
      isMaster: false,
      key: extendedPublicKey.publicKey,
      chainCode: extendedPublicKey.chainCode,
      origin: new CryptoKeypath(cryptoKeyPathComponents, extendedPublicKey.fingerprint), // TODO: Define which FP we use
      parentFingerprint: Buffer.from(account.masterFingerprint),
      name: `AirGap - ${account.groupLabel}`
    })

    return cryptoHDKey
  }

  private async generateMessage(data: IACMessageDefinitionObjectV3): Promise<ETHSignature> {
    let rlpSignatureData: Buffer | undefined

    if ((data.payload as any).transaction) {
      const transaction = data.payload as EthereumTransactionSignResponse

      const tx = TransactionFactory.fromSerializedData(Buffer.from(transaction.transaction, 'hex'))

      const r = Buffer.from(tx.r?.toString(16, 32), 'hex')
      const s = Buffer.from(tx.s?.toString(16, 32), 'hex')
      const v = Buffer.from(tx.v?.toString(16, 2), 'hex')

      rlpSignatureData = Buffer.concat([r, s, v])
    } else {
      const transaction = data.payload as MessageSignResponse

      rlpSignatureData = Buffer.from(transaction.signature.slice(2), 'hex')
    }

    if (!rlpSignatureData) {
      throw new Error('Empty signature')
    }

    // TODO: This should be moved to a higher level, probably the "iac.service", and properly store context for any kind of request.
    const IDs = JSON.parse(localStorage.getItem('TEMP-MM-REQUEST-IDS') ?? '{}')
    const id = IDs[data.id]

    // TODO: We cannot immediately delete the ID because this method might be called multiple times
    // delete IDs[data.id]
    // localStorage.setItem('TEMP-MM-REQUEST-IDS', JSON.stringify(IDs))

    const idBuffer = id ? Buffer.from(id, 'hex') : (uuid.parse(uuid.v4()) as Uint8Array)

    const ethSignature = new ETHSignature(rlpSignatureData, Buffer.from(idBuffer))

    return ethSignature
  }
}
