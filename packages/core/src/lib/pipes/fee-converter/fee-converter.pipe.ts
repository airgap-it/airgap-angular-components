import { Pipe, PipeTransform } from '@angular/core'
import BigNumber from 'bignumber.js'
import { ICoinProtocol } from 'airgap-coin-lib'
import { ProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { ProtocolService } from '../../services/protocol/protocol.service'

type FeeConverterValue = BigNumber | string | number | null | undefined

interface FeeConverterArgs {
  protocol: ICoinProtocol | ProtocolSymbols | undefined | null
}

@Pipe({
  name: 'feeConverter'
})
export class FeeConverterPipe implements PipeTransform {
  constructor(private readonly protocolsService: ProtocolService) {}

  public async transform(value: FeeConverterValue, args: FeeConverterArgs): Promise<string> {
    if (args.protocol === undefined || !args.protocol) {
      throw new Error('Invalid protocol')
    }

    if (!(typeof value === 'string' || typeof value === 'number' || BigNumber.isBigNumber(value))) {
      throw new Error('Invalid fee amount')
    }

    const protocol: ICoinProtocol = await this.protocolsService.getProtocol(args.protocol)
    const fee: BigNumber = new BigNumber(value).shiftedBy(-protocol.feeDecimals)

    if (fee.isNaN()) {
      throw new Error('Invalid fee amount')
    }

    return `${fee.toFixed()} ${protocol?.feeSymbol.toUpperCase()}`
  }
}
