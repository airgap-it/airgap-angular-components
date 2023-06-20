import { IACMessageDefinitionObjectV3 } from '@airgap/serializer'
import { Injectable } from '@angular/core'
import { serializedDataToUrlString } from '../../utils/utils'

@Injectable()
export abstract class IACQrGenerator {
  abstract create(data: IACMessageDefinitionObjectV3[], multiFragmentLength?: number, singleFragmentLength?: number): Promise<void>
  abstract nextPart(): Promise<string> // handle complete
  abstract getSingle(prefix: string): Promise<string>
  abstract getNumberOfParts(): Promise<number>

  protected async prefixSingle(data: string, prefix: string, parameter: string): Promise<string> {
    return serializedDataToUrlString(data, `${prefix}://`, parameter)
  }

  public static async canHandle(_data: IACMessageDefinitionObjectV3[]): Promise<boolean> {
    return true
  }
}
