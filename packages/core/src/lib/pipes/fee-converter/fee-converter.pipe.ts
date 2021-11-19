import { Pipe, PipeTransform } from '@angular/core'
import BigNumber from 'bignumber.js'
import { ICoinProtocol, ProtocolNetwork, ProtocolSymbols } from '@airgap/coinlib-core'
import { ProtocolService } from '../../services/protocol/protocol.service'

type FeeConverterValue = BigNumber | string | number | null | undefined

interface FeeConverterArgs {
  protocol: ICoinProtocol | ProtocolSymbols | undefined | null
  dropSymbol?: boolean
  reverse?: boolean
  network?: ProtocolNetwork | string
}

@Pipe({
  name: 'feeConverter'
})
export class FeeConverterPipe implements PipeTransform {
  constructor(private readonly protocolsService: ProtocolService) { }

  public async transform(value: FeeConverterValue, args: FeeConverterArgs): Promise<string> {
    if (args.protocol === undefined || !args.protocol) {
      throw new Error('Invalid protocol')
    }

    if (!(typeof value === 'string' || typeof value === 'number' || BigNumber.isBigNumber(value))) {
      throw new Error('Invalid fee amount')
    }

    const protocol: ICoinProtocol = await this.protocolsService.getProtocol(args.protocol, args.network)
    const reverse = args.reverse !== undefined && args.reverse

    const shiftDirection: number = !reverse ? -1 : 1

    const fee: BigNumber = new BigNumber(value).shiftedBy(shiftDirection * protocol.feeDecimals)

    if (fee.isNaN()) {
      throw new Error('Invalid fee amount')
    }

    return `${fee.toFixed()}${args.dropSymbol ? '' : ' ' + protocol?.feeSymbol.toUpperCase()}`
  }
}
