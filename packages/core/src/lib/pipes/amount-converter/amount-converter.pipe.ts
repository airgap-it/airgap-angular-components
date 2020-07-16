import { Pipe, PipeTransform } from '@angular/core'
import BigNumber from 'bignumber.js'
import { ICoinProtocol } from 'airgap-coin-lib'
import { ProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { ProtocolsService } from '../../services/protocols/protocols.service'

type AmountConverterValue = BigNumber | string | number | null | undefined

interface AmountConverterArgs {
  protocol: ICoinProtocol | ProtocolSymbols | undefined
  maxDigits?: number
}

interface AmountConverterNumberFormat {
  decimalSeparator: string
  groupSeparator: string
  groupSize: number
}

const UNIT_ABBREVIATIONS: string[] = ['', 'K', 'M']

@Pipe({
  name: 'amountConverter'
})
export class AmountConverterPipe implements PipeTransform {
  public static readonly defaultMaxDigits: number = 10
  public static readonly numberFormat: AmountConverterNumberFormat = {
    decimalSeparator: '.',
    groupSeparator: `'`,
    groupSize: 3
  }

  constructor(private readonly protocolsService: ProtocolsService) {}

  public transform(value: AmountConverterValue, args: AmountConverterArgs): string {
    if (value === null || value === undefined || args.protocol === undefined) {
      return ''
    }

    const protocol: ICoinProtocol | undefined = this.protocolsService.getProtocol(args.protocol)
    const amount = protocol !== undefined ? this.transformValueOnly(value, { protocol, maxDigits: args.maxDigits }) : undefined

    return amount !== undefined && protocol !== undefined ? `${amount} ${protocol.symbol}` : ''
  }

  public transformValueOnly(value: AmountConverterValue, args: AmountConverterArgs): string | undefined {
    const protocol: ICoinProtocol | undefined = args.protocol !== undefined ? this.protocolsService.getProtocol(args.protocol) : undefined

    if (protocol === undefined || value === null || value === undefined) {
      return undefined
    }

    const maxDigits: number = args.maxDigits ?? AmountConverterPipe.defaultMaxDigits
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const BN = BigNumber.clone({ FORMAT: AmountConverterPipe.numberFormat })

    const amount = new BN(value).shiftedBy(-1 * protocol.decimals).decimalPlaces(protocol.decimals, BigNumber.ROUND_FLOOR)
    if (amount.isNaN() || isNaN(maxDigits)) {
      return undefined
    }

    return this.formatBigNumber(amount, maxDigits)
  }

  public formatBigNumber(value: BigNumber, maxDigits?: number): string {
    if (maxDigits === undefined || value.toFixed().length <= maxDigits) {
      return value.toFormat()
    }

    const integerValueLength = value.integerValue().toString().length
    if (integerValueLength >= maxDigits) {
      // We can omit floating point
      return this.abbreviateNumber(value, maxDigits)
    }

    // Need regex to remove all unneccesary trailing zeros
    return value.toFormat(maxDigits - integerValueLength).replace(/\.?0+$/, '')
  }

  public abbreviateNumber(value: BigNumber, maxDigits: number): string {
    let abbreviated: BigNumber = value
    let suffix: string | undefined

    for (let i = 0; i < UNIT_ABBREVIATIONS.length; i++) {
      suffix = UNIT_ABBREVIATIONS[i]
      
      if (abbreviated.toFixed().length <= Math.max(maxDigits, 3)) {
        break
      }

      abbreviated = (abbreviated.isInteger() ? abbreviated : abbreviated.integerValue()).dividedToIntegerBy(1000)
    }

    return suffix !== undefined ? `${value.toFormat()}${suffix}` : ''
  }
}
