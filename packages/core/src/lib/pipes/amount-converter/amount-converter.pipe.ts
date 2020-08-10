import { Pipe, PipeTransform } from '@angular/core'
import BigNumber from 'bignumber.js'
import { ICoinProtocol } from 'airgap-coin-lib'
import { ProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { ProtocolService } from '../../services/protocol/protocol.service'

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

  constructor(private readonly protocolsService: ProtocolService) {}

  public transform(value: AmountConverterValue, args: AmountConverterArgs): string {
    if (args.protocol === undefined || !args.protocol) {
      throw new Error('Invalid protocol')
    }

    if (!(typeof value === 'string' || typeof value === 'number' || BigNumber.isBigNumber(value))) {
      throw new Error('Invalid amount')
    }

    if (typeof args.maxDigits !== 'number') {
      throw new Error('Invalid maxDigits')
    }

    const protocol: ICoinProtocol | undefined = this.protocolsService.getProtocol(args.protocol)
    if (protocol === undefined) {
      throw new Error('Protocol not supported')
    }

    const amount = this.transformValueOnly(value, protocol, args.maxDigits)

    return `${amount} ${protocol.symbol}`
  }

  public transformValueOnly(
    value: string | number | BigNumber,
    protocol: ICoinProtocol,
    maxDigits: number = AmountConverterPipe.defaultMaxDigits
  ): string | undefined {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const BN = BigNumber.clone({ FORMAT: AmountConverterPipe.numberFormat })

    const amount = new BN(value).shiftedBy(-1 * protocol.decimals).decimalPlaces(protocol.decimals, BigNumber.ROUND_FLOOR)
    if (amount.isNaN() || isNaN(maxDigits)) {
      throw new Error('Invalid amount')
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
