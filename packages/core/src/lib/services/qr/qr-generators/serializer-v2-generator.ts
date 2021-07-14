import { IACMessageDefinitionObject, IACMessageDefinitionObjectV3, Serializer } from '@airgap/coinlib-core'
import { IACQrGenerator } from '../../iac/qr-generator'
import { convertV3ToV2 } from '../../serializer/serializer.service'

const serializer = new Serializer()
export class SerializerV2Generator extends IACQrGenerator {
  private counter: number = 0
  private parts: string[] = []

  private data: IACMessageDefinitionObject[] = []

  constructor() {
    super()
  }

  public async create(data: IACMessageDefinitionObjectV3[], multiFragmentLength: number, singleFragmentLength: number): Promise<void> {
    this.counter = 0
    this.data = await convertV3ToV2(data)

    this.parts = await serializer.serialize(this.data, singleFragmentLength, multiFragmentLength)
  }

  public async nextPart(): Promise<string> {
    const next = this.parts[this.counter % this.parts.length]
    this.counter += 1
    return next
  }

  public async getSingle(prefix: string): Promise<string> {
    const part = this.parts.length === 1 ? this.parts[0] : (await serializer.serialize(this.data))[0]
    return this.prefixSingle(part, prefix, 'd')
  }

  public async getNumberOfParts(): Promise<number> {
    return this.parts.length
  }
}
