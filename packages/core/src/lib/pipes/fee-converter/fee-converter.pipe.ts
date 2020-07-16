import { Pipe, PipeTransform } from '@angular/core'
import BigNumber from 'bignumber.js'
import { ICoinProtocol } from 'airgap-coin-lib'
import { ProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { ProtocolsService } from 'src/lib/services/protocols/protocols.service'

type FeeConverterValue = BigNumber | string | number | null | undefined

interface FeeConverterArgs {
  protocol: ICoinProtocol | ProtocolSymbols | undefined
}

@Pipe({
  name: 'feeConverter'
})
export class FeeConverterPipe implements PipeTransform {

  constructor(private readonly protocolsService: ProtocolsService) {}

  public transform(value: FeeConverterValue, args: FeeConverterArgs): string {
    if (args.protocol === undefined || value === null || value === undefined) {
      return ''
    }

    const protocol: ICoinProtocol | undefined = this.protocolsService.getProtocol(args.protocol)
    if (protocol === undefined) {
      return ''
    }

    const fee: BigNumber = new BigNumber(value).shiftedBy(-protocol.feeDecimals)

    return `${fee.toFixed()} ${protocol?.feeSymbol.toUpperCase()}`
  }

}
