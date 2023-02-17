/* eslint-disable @typescript-eslint/no-explicit-any */
import { MainProtocolSymbols } from '@airgap/coinlib-core'
import { IsolatedModulesPlugin } from '../../capacitor-plugins/definitions'
import { IsolatedModules } from '../../capacitor-plugins/isolated-modules/isolated-modules.plugin'
import { ProtocolService } from '../../services/protocol/protocol.service'
import { MainProtocolStoreService } from '../../services/protocol/store/main/main-protocol-store.service'
import { SubProtocolStoreService } from '../../services/protocol/store/sub/sub-protocol-store.service'
import { FeeConverterPipe } from './fee-converter.pipe'

describe('FeeConverter Pipe', () => {
  let feeConverterPipe: FeeConverterPipe
  let protocolService: ProtocolService
  let isolatedModules: IsolatedModulesPlugin

  beforeAll(() => {
    isolatedModules = new IsolatedModules()
    protocolService = new ProtocolService(
      new MainProtocolStoreService(isolatedModules),
      new SubProtocolStoreService(isolatedModules),
      isolatedModules
    )
    protocolService.init()
  })

  beforeEach(() => {
    feeConverterPipe = new FeeConverterPipe(protocolService)
  })

  it('should display very small ETH number to a non-scientific string representation', async () => {
    expect(await feeConverterPipe.transform('1', { protocol: MainProtocolSymbols.ETH })).toEqual('0.000000000000000001 ETH')
  })

  it('should display a normal ETH number to a non-scientific string representation', async () => {
    expect(
      await feeConverterPipe.transform('1000000000000000000', {
        protocol: MainProtocolSymbols.ETH
      })
    ).toEqual('1 ETH')
  })

  it('should display a big ETH number to a non-scientific string representation', async () => {
    expect(
      await feeConverterPipe.transform('10000000000000000000000000000000000', {
        protocol: MainProtocolSymbols.ETH
      })
    ).toEqual('10000000000000000 ETH')
  })

  it('should return a valid amount if value is 0', async () => {
    expect(await feeConverterPipe.transform('0', { protocol: MainProtocolSymbols.ETH })).toEqual('0 ETH')
  })

  it('should return an empty string for non-numeric value', async () => {
    try {
      await feeConverterPipe.transform('test', { protocol: MainProtocolSymbols.ETH })
    } catch (error) {
      expect(error.toString()).toEqual('Error: Invalid fee amount')
    }
  })

  it('should return an error when protocolIdentifier is not set', async () => {
    try {
      await feeConverterPipe.transform('1', { protocol: undefined })
    } catch (error) {
      expect(error.toString()).toEqual('Error: Invalid protocol')
    }
  })

  it('should return an empty string when protocolIdentifier unknown', async () => {
    try {
      await feeConverterPipe.transform('1', {
        protocol: 'unknown_protocol' as any
      })
    } catch (error) {
      expect(error.toString()).toEqual('Error: Protocol unknown_protocol not supported')
    }
  })

  function getTest(args: any) {
    it(`Test with: ${JSON.stringify(args)}`, async () => {
      expect(
        await (async () => {
          try {
            const transformed = await feeConverterPipe.transform(args.value, {
              protocol: args.protocol
            })

            return transformed
          } catch (error) {
            return error.toString()
          }
        })()
      ).toEqual(args.expected)
    })
  }

  function makeTests(argsArray: any) {
    argsArray.forEach((v: any) => {
      getTest(v)
    })
  }

  const truthyProtocolIdentifiers = [
    { value: '1', protocol: MainProtocolSymbols.BTC, expected: '0.00000001 BTC' },
    {
      value: '1',
      protocol: MainProtocolSymbols.ETH,
      expected: '0.000000000000000001 ETH'
    }
  ]
  makeTests(truthyProtocolIdentifiers)

  const falsyValues = [
    { value: false, protocol: MainProtocolSymbols.ETH, expected: 'Error: Invalid fee amount' },
    { value: 0, protocol: MainProtocolSymbols.ETH, expected: '0 ETH' },
    { value: '', protocol: MainProtocolSymbols.ETH, expected: 'Error: Invalid fee amount' },
    { value: null, protocol: MainProtocolSymbols.ETH, expected: 'Error: Invalid fee amount' },
    { value: undefined, protocol: MainProtocolSymbols.ETH, expected: 'Error: Invalid fee amount' },
    { value: NaN, protocol: MainProtocolSymbols.ETH, expected: 'Error: Invalid fee amount' }
  ]
  makeTests(falsyValues)

  const falsyProtocolIdentifiers = [
    { value: '1', protocol: false, expected: 'Error: Invalid protocol' },
    { value: '1', protocol: 0, expected: 'Error: Invalid protocol' },
    { value: '1', protocol: '', expected: 'Error: Invalid protocol' },
    { value: '1', protocol: null, expected: 'Error: Invalid protocol' },
    { value: '1', protocol: undefined, expected: 'Error: Invalid protocol' },
    { value: '1', protocol: NaN, expected: 'Error: Invalid protocol' },
    { value: '1', protocol: 'test', expected: 'Error: Protocol test not supported' },
    { value: '1', protocol: 'asdf', expected: 'Error: Protocol asdf not supported' }
  ]
  makeTests(falsyProtocolIdentifiers)
})
