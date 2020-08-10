import { MainProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { ProtocolService } from '../../services/protocol/protocol.service'
import { FeeConverterPipe } from './fee-converter.pipe'

describe('FeeConverter Pipe', () => {
  let feeConverterPipe: FeeConverterPipe
  let protocolService: ProtocolService

  beforeAll(() => {
    protocolService = new ProtocolService()
    protocolService.init()
  })

  beforeEach(() => {
    feeConverterPipe = new FeeConverterPipe(protocolService)
  })

  it('should display very small ETH number to a non-scientific string representation', () => {
    expect(feeConverterPipe.transform('1', { protocol: MainProtocolSymbols.ETH })).toEqual('0.000000000000000001 ETH')
  })

  it('should display a normal ETH number to a non-scientific string representation', () => {
    expect(
      feeConverterPipe.transform('1000000000000000000', {
        protocol: MainProtocolSymbols.ETH 
      })
    ).toEqual('1 ETH')
  })

  it('should display a big ETH number to a non-scientific string representation', () => {
    expect(
      feeConverterPipe.transform('10000000000000000000000000000000000', {
        protocol: MainProtocolSymbols.ETH 
      })
    ).toEqual('10000000000000000 ETH')
  })

  it('should return a valid amount if value is 0', () => {
    expect(feeConverterPipe.transform('0', { protocol: MainProtocolSymbols.ETH  })).toEqual('0 ETH')
  })

  it('should return an empty string for non-numeric value', () => {
    expect(feeConverterPipe.transform('test', { protocol: MainProtocolSymbols.ETH  })).toEqual('')
  })

  it('should return an empty string when protocolIdentifier is not set', () => {
    expect(feeConverterPipe.transform('1', { protocol: undefined })).toEqual('')
  })

  it('should return an empty string when protocolIdentifier unknown', () => {
    expect(
      feeConverterPipe.transform('1', {
        protocol: MainProtocolSymbols.ETH 
      })
    ).toEqual('')
  })

  function getTest(args) {
    it(`Test with: ${JSON.stringify(args)}`, () => {
      expect(
        feeConverterPipe.transform(args.value, {
          protocol: MainProtocolSymbols.ETH 
        })
      ).toEqual(args.expected)
    })
  }

  function makeTests(argsArray) {
    argsArray.forEach(v => {
      getTest(v)
    })
  }

  const truthyProtocolIdentifiers = [
    { value: '1', protocolIdentifier: 'btc', expected: '0.00000001 BTC' },
    {
      value: '1',
      protocol: MainProtocolSymbols.ETH,
      expected: '0.000000000000000001 ETH'
    }
  ]
  makeTests(truthyProtocolIdentifiers)

  const falsyValues = [
    { value: false, protocol: MainProtocolSymbols.ETH, expected: '' },
    { value: 0, protocol: MainProtocolSymbols.ETH, expected: '0 ETH' },
    { value: '', protocol: MainProtocolSymbols.ETH, expected: '' },
    { value: null, protocol: MainProtocolSymbols.ETH, expected: '' },
    { value: undefined, protocol: MainProtocolSymbols.ETH, expected: '' },
    { value: NaN, protocol: MainProtocolSymbols.ETH, expected: '' }
  ]
  makeTests(falsyValues)

  const falsyProtocolIdentifiers = [
    { value: '1', protocol: false, expected: '' },
    { value: '1', protocol: 0, expected: '' },
    { value: '1', protocol: '', expected: '' },
    { value: '1', protocol: null, expected: '' },
    { value: '1', protocol: undefined, expected: '' },
    { value: '1', protocol: NaN, expected: '' },
    { value: '1', protocol: 'test', expected: '' },
    { value: '1', protocol: 'asdf', expected: '' }
  ]
  makeTests(falsyProtocolIdentifiers)
})
