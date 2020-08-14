import { TestBed } from '@angular/core/testing'

import {
  ICoinSubProtocol,
  TezosProtocol,
  TezosUSD,
  TezosBTC,
  TezosStaker,
  TezosStakerProtocolConfig,
  TezosFAProtocolOptions,
  TezosProtocolNetwork,
  TezblockBlockExplorer,
  TezosProtocolNetworkExtras,
  TezosProtocolOptions,
  TezosUSDProtocolConfig,
  TezosBTCProtocolConfig,
  TezosKtProtocol
} from 'airgap-coin-lib'
import { MainProtocolSymbols, SubProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { NetworkType } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { defaultActiveSubIdentifiers, defaultPassiveSubIdentifiers, getSubIdentifiers } from '../../utils/test'
import { SubProtocolService, SubProtocolServiceConfig } from './sub-protocol.service'

describe('ProtocolsService', () => {
  let service: SubProtocolService

  let tezosTestnet: TezosProtocolNetwork

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(SubProtocolService)

    tezosTestnet = new TezosProtocolNetwork(
      'Testnet',
      NetworkType.TESTNET,
      undefined,
      new TezblockBlockExplorer(),
      new TezosProtocolNetworkExtras()
    )
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('Init', () => {
    function makeInitializationTest(
      description: string,
      createConfig: () => SubProtocolServiceConfig,
      createExpected: () => {
        activeSubIdentifiers: SubProtocolSymbols[]
        passiveSubIdentifiers: SubProtocolSymbols[]
      },
    ): void {
      it(description, () => {
        const config = createConfig()
        createExpected()
        const expected = createExpected()

        service.init(config)

        const supportedSubIdentifiers = getSubIdentifiers(service.supportedProtocols)

        const activeSubIdentifiers = getSubIdentifiers(service.activeProtocols)
        const passiveSubIdentifiers = getSubIdentifiers(service.passiveProtocols)

        expect(service.isInitialized).toBeTrue()

        expect(supportedSubIdentifiers.sort()).toEqual(expected.activeSubIdentifiers.concat(expected.passiveSubIdentifiers).sort())

        expect(activeSubIdentifiers.sort()).toEqual(expected.activeSubIdentifiers.sort())
        expect(passiveSubIdentifiers.sort()).toEqual(expected.passiveSubIdentifiers.sort())
      })
    }

    makeInitializationTest(
      'should be initialized with default protocols',
      () => ({}),
      () => ({
        activeSubIdentifiers: defaultActiveSubIdentifiers,
        passiveSubIdentifiers: defaultPassiveSubIdentifiers
      })
    )

    it('should throw an error when not initialized', () => {
      expect(service.isInitialized).toBeFalse()

      try {
        // eslint-disable-next-line no-unused-expressions
        service.supportedProtocols
      } catch (error) {
        expect(error.toString()).toEqual('Error: SubProtocolService not initialized yet. Call `init` first.')
      }

      try {
        // eslint-disable-next-line no-unused-expressions
        service.activeProtocols
      } catch (error) {
        expect(error.toString()).toEqual('Error: SubProtocolService not initialized yet. Call `init` first.')
      }

      try {
        // eslint-disable-next-line no-unused-expressions
        service.passiveProtocols
      } catch (error) {
        expect(error.toString()).toEqual('Error: SubProtocolService not initialized yet. Call `init` first.')
      }
    })

    makeInitializationTest(
      'should be initialized with provided protocols',
      () => ({
        activeSubProtocols: [[new TezosProtocol(), new TezosUSD()]],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      }),
      () => ({
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_USD],
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_BTC]
      })
    )

    makeInitializationTest(
      'should be initialized with provided extra protocols',
      () => ({
        extraPassiveSubProtocols: [[new TezosProtocol(), new TezosUSD()]],
        extraActiveSubProtocols: [
          [
            new TezosProtocol(),
            new TezosStaker(
              new TezosFAProtocolOptions(
                new TezosProtocolNetwork(),
                new TezosStakerProtocolConfig(undefined, undefined, undefined, SubProtocolSymbols.XTZ_STKR)
              )
            )
          ]
        ]
      }),
      () => ({
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_STKR, ...defaultActiveSubIdentifiers],
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_USD, ...defaultPassiveSubIdentifiers]
      })
    )

    makeInitializationTest(
      'should remove duplicated protocols',
      () => ({
        passiveSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [new TezosProtocol(), new TezosUSD()]
        ],
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      }),
      () => ({
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_BTC],
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_USD]
      })
    )

    makeInitializationTest(
      'should not remove as duplicated protocols with the same identifier but different networks',
      () => ({
        passiveSubProtocols: [
          [
            new TezosProtocol(new TezosProtocolOptions(tezosTestnet)),
            new TezosUSD(new TezosFAProtocolOptions(tezosTestnet, new TezosUSDProtocolConfig()))
          ]
        ],
        activeSubProtocols: [[new TezosProtocol(), new TezosUSD()]]
      }),
      () => ({
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_USD],
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_USD]
      })
    )
  })

  describe('Find Protocols', () => {
    it('should find a sub protocol by a sub protocol identifier', () => {
      service.init({
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundSubProtocol = service.getSubProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC)

      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should find a sub protocol by a main protocol identifier', () => {
      service.init({
        activeSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [new TezosProtocol(), new TezosKtProtocol()]
        ]
      })

      const foundSubProtocols = service.getSubProtocolsByMainIdentifier(MainProtocolSymbols.XTZ)
      const foundSubIdentifiers = foundSubProtocols.map((protocol: ICoinSubProtocol) => protocol.identifier)

      expect(foundSubIdentifiers.length).toBe(2)
      expect(foundSubIdentifiers.sort()).toEqual([SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_KT].sort())
    })

    it('should not find a sub protocol by a sub identifier if not active', () => {
      service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      try {
        service.getSubProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC)
      } catch (error) {
        expect(error.toString()).toBe('Error: serializer(PROTOCOL_NOT_SUPPORTED): ')
      }
    })

    it('should find a passive protocol by a sub identifier if specified', () => {
      service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundSubProtocol = service.getSubProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, undefined, false)

      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should not find a passive protocol by a main identifier if not active', () => {
      service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      try {
        service.getSubProtocolsByMainIdentifier(MainProtocolSymbols.XTZ)
      } catch (error) {
        expect(error.toString()).toBe('Error: serializer(PROTOCOL_NOT_SUPPORTED): ')
      }
    })

    it('should find a passive protocol by a main identifier if specified', () => {
      service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundSubProtocols = service.getSubProtocolsByMainIdentifier(MainProtocolSymbols.XTZ, undefined, false)

      expect(foundSubProtocols.length).toBe(1)
      expect(foundSubProtocols[0].identifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should find a sub protocol by a sub identifier and network', () => {
      service.init({
        activeSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [
            new TezosProtocol(new TezosProtocolOptions(tezosTestnet)),
            new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))
          ]
        ]
      })

      const foundSubProtocol = service.getSubProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, tezosTestnet)

      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocol?.options.network).toBe(tezosTestnet)
    })

    it('should not find a sub protocol by a sub identifier if network does not match', () => {
      service.init({
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      try {
        service.getSubProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, tezosTestnet)
      } catch (error) {
        expect(error.toString()).toBe('Error: serializer(PROTOCOL_NOT_SUPPORTED): ')
      }
    })

    it('should find a sub protocol by a main identifier and network', () => {
      service.init({
        activeSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [
            new TezosProtocol(new TezosProtocolOptions(tezosTestnet)),
            new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))
          ]
        ]
      })

      const foundSubProtocols = service.getSubProtocolsByMainIdentifier(MainProtocolSymbols.XTZ, tezosTestnet)

      expect(foundSubProtocols.length).toBe(1)
      expect(foundSubProtocols[0].identifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocols[0].options.network).toBe(tezosTestnet)
    })

    it('should not find a sub protocol by a main identifier if network does not match', () => {
      service.init({
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundSubProtocols = service.getSubProtocolsByMainIdentifier(MainProtocolSymbols.XTZ, tezosTestnet)

      expect(foundSubProtocols.length).toBe(0)
    })
  })
})
