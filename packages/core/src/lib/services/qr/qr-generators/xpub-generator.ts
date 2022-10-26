import { MainProtocolSymbols } from '@airgap/coinlib-core'
import { AccountShareResponse, IACMessageDefinitionObjectV3, IACMessageType } from '@airgap/serializer'

import { IACQrGenerator } from '../../iac/qr-generator'

export class XPubGenerator extends IACQrGenerator {
  private data: string | undefined

  constructor() {
    super()
  }

  public async create(data: IACMessageDefinitionObjectV3[], _multiFragmentLength: number, _singleFragmentLength: number): Promise<void> {
    if (!(await XPubGenerator.canHandle(data))) {
      return
    }

    const element = data[0]

    if (element.type === IACMessageType.AccountShareResponse) {
      this.data = (element.payload as AccountShareResponse).publicKey
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
}
