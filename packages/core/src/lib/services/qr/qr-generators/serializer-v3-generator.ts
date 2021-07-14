import { IACMessageDefinitionObjectV3, SerializerV3 } from '@airgap/coinlib-core'
import { IACQrGenerator } from '../../iac/qr-generator'
import { UR, UREncoder } from '@ngraveio/bc-ur'
import * as bs58check from 'bs58check'

export class SerializerV3Generator extends IACQrGenerator {
  private encoder: UREncoder | undefined

  private ur: UR | undefined

  constructor() {
    super()
  }

  public async create(data: IACMessageDefinitionObjectV3[], multiFragmentLength: number, singleFragmentLength: number): Promise<void> {
    const serializer = new SerializerV3()
    const serialized = await serializer.serialize(data)
    const buffer = bs58check.decode(serialized)
    this.ur = UR.fromBuffer(buffer)

    // We first try to create a larger "single chunk" fragment
    this.encoder = new UREncoder(this.ur, singleFragmentLength)

    // If this is not possible, we use the multiFragmentLength
    if (this.encoder.fragmentsLength !== 1) {
      this.encoder = new UREncoder(this.ur, multiFragmentLength)
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
}
