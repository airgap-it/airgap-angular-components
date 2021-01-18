import { Pipe, PipeTransform } from '@angular/core'
import BigNumber from 'bignumber.js'
import { ICoinProtocol } from '@airgap/coinlib-core'
import { ProtocolSymbols } from '@airgap/coinlib-core/utils/ProtocolSymbols'
import { ProtocolService } from '../../services/protocol/protocol.service'

type AmountConverterValue = BigNumber | string | number | null | undefined

interface AmountConverterArgs {
  protocol: ICoinProtocol | ProtocolSymbols | undefined | null
  maxDigits?: number
}

interface AmountConverterNumberFormat {
  decimalSeparator: string
  groupSeparator: string
  groupSize: number
}

const FORMAT_UNITS: Record<string, string> = {
  [1e3]: 'K',
  [1e6]: 'M'
}
const SUPPORTED_FORMAT_DECIMAL_SIZES: string[] = Object.keys(FORMAT_UNITS)

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

  public async transform(value: AmountConverterValue, args: AmountConverterArgs): Promise<string> {
    if (!args.protocol) {
      throw new Error('Invalid protocol')
    }

    if (!(typeof value === 'string' || typeof value === 'number' || BigNumber.isBigNumber(value))) {
      throw new Error('Invalid amount')
    }

    if (args.maxDigits !== undefined && typeof args.maxDigits !== 'number') {
      throw new Error('Invalid maxDigits')
    }

    const protocol: ICoinProtocol = await this.protocolsService.getProtocol(args.protocol)
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
    const valueBN = new BN(value)

    if (valueBN.isNaN() || isNaN(maxDigits)) {
      throw new Error('Invalid amount')
    }

    const amount = valueBN.shiftedBy(-1 * protocol.decimals).decimalPlaces(protocol.decimals, BigNumber.ROUND_FLOOR)

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
    if (maxDigits === 0) {
      return value.toFormat()
    }
    
    let abbreviated: BigNumber = value
    let suffix: string = ''

    let nextDecimalsIndex: number = 0
    while (abbreviated.toFixed().length > Math.max(maxDigits, 3) && nextDecimalsIndex < SUPPORTED_FORMAT_DECIMAL_SIZES.length) {
      const decimals: BigNumber = new BigNumber(SUPPORTED_FORMAT_DECIMAL_SIZES[nextDecimalsIndex])
      abbreviated = value.dividedToIntegerBy(decimals)
      suffix = FORMAT_UNITS[decimals.toString()]

      nextDecimalsIndex++
    }

    return `${abbreviated.toFormat()}${suffix}`
  }
}
