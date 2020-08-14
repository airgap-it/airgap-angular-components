import BigNumber from 'bignumber.js'
import { MainProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { ProtocolService } from '../../services/protocol/protocol.service'
import { SubProtocolStoreService } from '../../services/protocol/store/sub/sub-protocol-store.service'
import { MainProtocolStoreService } from '../../services/protocol/store/main/main-protocol-store.service'
import { AmountConverterPipe } from './amount-converter.pipe'

// eslint-disable-next-line @typescript-eslint/naming-convention
const BN = BigNumber.clone({ FORMAT: AmountConverterPipe.numberFormat })

describe('AmountConverter Pipe', () => {
  let protocolService: ProtocolService
  let amountConverterPipe: AmountConverterPipe

  beforeAll(async () => {
    protocolService = new ProtocolService(new MainProtocolStoreService(), new SubProtocolStoreService())
    protocolService.init()
  })

  beforeEach(() => {
    amountConverterPipe = new AmountConverterPipe(protocolService)
  })

  describe('format number with commas', () => {
    it('should format short number', () => {
      expect(amountConverterPipe.formatBigNumber(new BN(`1`))).toEqual(`1`)
    })

    it('should add highcommas', () => {
      expect(amountConverterPipe.formatBigNumber(new BN(`1234567891`))).toEqual(`1'234'567'891`)
    })

    it('should should add highcommas only to first part of number', () => {
      expect(amountConverterPipe.formatBigNumber(new BN(`12345.67891`))).toEqual(`12'345.67891`)
    })

    it('should format long numbers', () => {
      expect(amountConverterPipe.formatBigNumber(new BN(`1234567891.1234567891`))).toEqual(`1'234'567'891.1234567891`)
    })

    it('should format short number if smaller than maxDigits', () => {
      expect(amountConverterPipe.formatBigNumber(new BN(`1`), 8)).toEqual(`1`)
    })

    it('should add "K" if number is too long', () => {
      expect(amountConverterPipe.formatBigNumber(new BN(`1234567891`), 8)).toEqual(`1'234'567K`)
    })

    it('should add "K" if number is too long and omit floating point', () => {
      expect(amountConverterPipe.formatBigNumber(new BN(`1234567891.1234567891`), 8)).toEqual(`1'234'567K`)
    })

    it('should format floating point part correctly', () => {
      expect(amountConverterPipe.formatBigNumber(new BN(`12345.67891`), 8)).toEqual(`12'345.679`)
    })

    it('should add "M" if number is too long', () => {
      expect(amountConverterPipe.formatBigNumber(new BN(`12345678912345`), 8)).toEqual(`12'345'678M`)
    })

    it('should add "M" if number is too long and omit floating point', () => {
      expect(amountConverterPipe.formatBigNumber(new BN(`12345678912345.000000000001`), 8)).toEqual(`12'345'678M`)
    })

    it('should limit long floating point', () => {
      expect(amountConverterPipe.formatBigNumber(new BN(`1.000000000001`), 8)).toEqual(`1`)
    })
  })

  describe('abbreviateNumber', () => {
    it('should not abbreviate small number', () => {
      expect(amountConverterPipe.abbreviateNumber(new BN('1'), 3)).toEqual('1')
      expect(amountConverterPipe.abbreviateNumber(new BN('12'), 3)).toEqual('12')
      expect(amountConverterPipe.abbreviateNumber(new BN('123'), 3)).toEqual('123')
    })

    it('should abbreviate large number', () => {
      expect(amountConverterPipe.abbreviateNumber(new BN('1234'), 3)).toEqual('1K')
      expect(amountConverterPipe.abbreviateNumber(new BN('12345'), 3)).toEqual('12K')
      expect(amountConverterPipe.abbreviateNumber(new BN('123456'), 3)).toEqual('123K')
      expect(amountConverterPipe.abbreviateNumber(new BN('1234567'), 3)).toEqual('1M')
      expect(amountConverterPipe.abbreviateNumber(new BN('12345678'), 3)).toEqual('12M')
      expect(amountConverterPipe.abbreviateNumber(new BN('123456789'), 3)).toEqual('123M')
      expect(amountConverterPipe.abbreviateNumber(new BN('123456789123456789'), 3)).toEqual(`123'456'789'123M`)
    })
  })

  it('should display very small ETH number to a non-scientific string representation', () => {
    expect(
      amountConverterPipe.transform('1', {
        protocol: MainProtocolSymbols.ETH,
        maxDigits: 0
      })
    ).toEqual('0.000000000000000001 ETH')
  })

  it('should display a normal ETH number to a non-scientific string representation', () => {
    expect(
      amountConverterPipe.transform('1000000000000000000', {
        protocol: MainProtocolSymbols.ETH,
        maxDigits: 0
      })
    ).toEqual('1 ETH')
  })

  it('should display a big ETH number to a non-scientific string representation', () => {
    expect(
      amountConverterPipe.transform('10000000000000000000000000000000000', {
        protocol: MainProtocolSymbols.ETH,
        maxDigits: 0
      })
    ).toEqual(`10'000'000'000'000'000 ETH`)
  })

  it('should return a valid amount if value is 0', () => {
    expect(
      amountConverterPipe.transform('0', {
        protocol: MainProtocolSymbols.ETH,
        maxDigits: 0
      })
    ).toEqual('0 ETH')
  })

  it('should return an empty string when protocol is not set', () => {
    try {
      amountConverterPipe.transform('1', {
        protocol: undefined,
        maxDigits: 0
      })
    } catch (error) {
      expect(error.toString()).toEqual('Error: Invalid protocol')
    }
  })

  it('should handle values that are not a number', () => {
    try {
      amountConverterPipe.transform('test', {
        protocol: MainProtocolSymbols.ETH,
        maxDigits: 0
      })
    } catch (error) {
      expect(error.toString()).toEqual('Error: Invalid amount')
    }
  })

  it('should handle values that are undefined', () => {
    try {
      amountConverterPipe.transform(undefined, {
        protocol: MainProtocolSymbols.ETH,
        maxDigits: 0
      })
    } catch (error) {
      expect(error.toString()).toEqual('Error: Invalid amount')
    }
  })

  it('should handle values that are null', () => {
    try {
      amountConverterPipe.transform(null, {
        protocol: MainProtocolSymbols.ETH,
        maxDigits: 0
      })
    } catch (error) {
      expect(error.toString()).toEqual('Error: Invalid amount')
    }
  })

  it('should handle values that are empty object', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value: any = {}
    try {
      amountConverterPipe.transform(value, {
        protocol: MainProtocolSymbols.ETH,
        maxDigits: 0
      })
    } catch (error) {
      expect(error.toString()).toEqual('Error: Invalid amount')
    }
  })

  function getTest(args) {
    it(`Test with: ${JSON.stringify(args)}`, () => {
      expect(
        (() => {
          try {
            const transformed = amountConverterPipe.transform(args.value, {
              protocol: args.protocol,
              maxDigits: 0
            })

            return transformed
          } catch (error) {
            return error.toString()
          }
        })()
      ).toEqual(args.expected)
    })
  }

  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function makeTests(argsArray) {
    argsArray.forEach((v) => {
      getTest(v)
    })
  }

  const truthyprotocols = [
    { value: '1', protocol: MainProtocolSymbols.BTC, expected: '0.00000001 BTC' },
    {
      value: '1',
      protocol: MainProtocolSymbols.ETH,
      expected: '0.000000000000000001 ETH'
    }
  ]
  makeTests(truthyprotocols)

  const falsyValues = [
    { value: false, protocol: MainProtocolSymbols.ETH, expected: 'Error: Invalid amount' },
    { value: 0, protocol: MainProtocolSymbols.ETH, expected: '0 ETH' },
    { value: '', protocol: MainProtocolSymbols.ETH, expected: 'Error: Invalid amount' },
    { value: null, protocol: MainProtocolSymbols.ETH, expected: 'Error: Invalid amount' },
    { value: undefined, protocol: MainProtocolSymbols.ETH, expected: 'Error: Invalid amount' },
    { value: NaN, protocol: MainProtocolSymbols.ETH, expected: 'Error: Invalid amount' }
  ]
  makeTests(falsyValues)

  const falsyprotocols = [
    { value: '1', protocol: false, expected: 'Error: Invalid protocol' },
    { value: '1', protocol: 0, expected: 'Error: Invalid protocol' },
    { value: '1', protocol: '', expected: 'Error: Invalid protocol' },
    { value: '1', protocol: null, expected: 'Error: Invalid protocol' },
    { value: '1', protocol: undefined, expected: 'Error: Invalid protocol' },
    { value: '1', protocol: NaN, expected: 'Error: Invalid protocol' },
    { value: '1', protocol: 'test', expected: 'Error: Protocol not supported' },
    { value: '1', protocol: 'asdf', expected: 'Error: Protocol not supported' }
  ]
  makeTests(falsyprotocols)
})
