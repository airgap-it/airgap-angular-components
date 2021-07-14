import { IACMessageDefinitionObjectV3 } from '@airgap/coinlib-core'
import { serializedDataToUrlString } from '../../utils/utils'

export abstract class IACQrGenerator {
  abstract create(data: IACMessageDefinitionObjectV3[], multiFragmentLength?: number, singleFragmentLength?: number): Promise<void>
  abstract nextPart(): Promise<string> // handle complete
  abstract getSingle(prefix: string): Promise<string>
  abstract getNumberOfParts(): Promise<number>

  protected async prefixSingle(data: string, prefix: string, parameter: string): Promise<string> {
    return serializedDataToUrlString(data, `${prefix}://`, parameter)
  }
}
