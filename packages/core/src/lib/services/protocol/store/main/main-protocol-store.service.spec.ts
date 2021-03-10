import { TestBed } from '@angular/core/testing'

import {
  AeternityProtocol,
  BitcoinProtocol,
  TezosProtocol,
  CosmosProtocol,
  TezosProtocolNetwork,
  TezosProtocolOptions,
  CosmosProtocolNetwork,
  BitcoinProtocolNetwork,
  BitcoinProtocolOptions,
  CosmosProtocolOptions,
  MainProtocolSymbols,
  NetworkType,
  ProtocolNetwork
} from '@airgap/coinlib-core'
import { getIdentifiers } from '../../utils/test'
import { MainProtocolStoreService, MainProtocolStoreConfig } from './main-protocol-store.service'

describe('MainProtocolStoreService', () => {
  let service: MainProtocolStoreService

  let bitcoinTestnet: BitcoinProtocolNetwork
  let cosmosTestnet: CosmosProtocolNetwork
  let tezosTestnet: TezosProtocolNetwork

  beforeAll(() => {
    bitcoinTestnet = new BitcoinProtocolNetwork('Testnet', NetworkType.TESTNET)

    cosmosTestnet = new CosmosProtocolNetwork('Testnet', NetworkType.TESTNET)

    tezosTestnet = new TezosProtocolNetwork('Testnet', NetworkType.TESTNET)
  })

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(MainProtocolStoreService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('Init', () => {
    function makeInitializationTest(
      description: string,
      createConfig: () => MainProtocolStoreConfig,
      createExpected: () => {
        activeIdentifiers: MainProtocolSymbols[]
        passiveIdentifiers: MainProtocolSymbols[]
      }
    ): void {
      it(description, () => {
        const config = createConfig()
        const expected = createExpected()

        service.init(config)

        const supportedIdentifiers = getIdentifiers(service.supportedProtocols)

        const activeIdentifiers = getIdentifiers(service.activeProtocols)
        const passiveIdentifiers = getIdentifiers(service.passiveProtocols)

        expect(service.isInitialized).toBeTrue()

        expect(supportedIdentifiers.sort()).toEqual(expected.activeIdentifiers.concat(expected.passiveIdentifiers).sort())

        expect(activeIdentifiers.sort()).toEqual(expected.activeIdentifiers.sort())
        expect(passiveIdentifiers.sort()).toEqual(expected.passiveIdentifiers.sort())
      })
    }

    it('should throw an error when not initialized', () => {
      expect(service.isInitialized).toBeFalse()

      try {
        // eslint-disable-next-line no-unused-expressions
        service.supportedProtocols
      } catch (error) {
        expect(error.toString()).toEqual('Error: MainProtocolService not initialized yet. Call `init` first.')
      }

      try {
        // eslint-disable-next-line no-unused-expressions
        service.activeProtocols
      } catch (error) {
        expect(error.toString()).toEqual('Error: MainProtocolService not initialized yet. Call `init` first.')
      }

      try {
        // eslint-disable-next-line no-unused-expressions
        service.passiveProtocols
      } catch (error) {
        expect(error.toString()).toEqual('Error: MainProtocolService not initialized yet. Call `init` first.')
      }
    })

    makeInitializationTest(
      'should be initialized with provided protocols',
      () => ({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [new BitcoinProtocol()]
      }),
      () => ({
        passiveIdentifiers: [MainProtocolSymbols.AE],
        activeIdentifiers: [MainProtocolSymbols.BTC]
      })
    )

    makeInitializationTest(
      'should remove duplicated protocols',
      () => ({
        activeProtocols: [new BitcoinProtocol(), new CosmosProtocol(), new CosmosProtocol()],
        passiveProtocols: [new AeternityProtocol(), new AeternityProtocol(), new BitcoinProtocol()]
      }),
      () => ({
        passiveIdentifiers: [MainProtocolSymbols.AE],
        activeIdentifiers: [MainProtocolSymbols.BTC, MainProtocolSymbols.COSMOS]
      })
    )

    makeInitializationTest(
      'should not remove as duplicated protocols with the same identifier but different networks',
      () => ({
        passiveProtocols: [
          new BitcoinProtocol(),
          new BitcoinProtocol(new BitcoinProtocolOptions(bitcoinTestnet)),
          new TezosProtocol(new TezosProtocolOptions(tezosTestnet))
        ],
        activeProtocols: [new CosmosProtocol(), new CosmosProtocol(new CosmosProtocolOptions(cosmosTestnet)), new TezosProtocol()]
      }),
      () => ({
        passiveIdentifiers: [MainProtocolSymbols.BTC, MainProtocolSymbols.BTC, MainProtocolSymbols.XTZ],
        activeIdentifiers: [MainProtocolSymbols.COSMOS, MainProtocolSymbols.COSMOS, MainProtocolSymbols.XTZ]
      })
    )

    it('should be initialized once', async () => {
      service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [new BitcoinProtocol()]
      })

      service.init({
        passiveProtocols: [new CosmosProtocol()],
        activeProtocols: [new TezosProtocol()]
      })

      const supportedIdentifiers = getIdentifiers(service.supportedProtocols)

      const activeIdentifiers = getIdentifiers(service.activeProtocols)
      const passiveIdentifiers = getIdentifiers(service.passiveProtocols)

      const expectedPassiveIdentifiers = [MainProtocolSymbols.AE]
      const expectedActiveIdentifiers = [MainProtocolSymbols.BTC]

      expect(service.isInitialized).toBeTrue()

      expect(supportedIdentifiers.sort()).toEqual(expectedActiveIdentifiers.concat(expectedPassiveIdentifiers).sort())

      expect(activeIdentifiers.sort()).toEqual(expectedActiveIdentifiers.sort())
      expect(passiveIdentifiers.sort()).toEqual(expectedPassiveIdentifiers.sort())
    })
  })

  describe('Find Protocols', () => {
    it('should find a main protocol by an identifier', () => {
      service.init({
        activeProtocols: [new AeternityProtocol()],
        passiveProtocols: []
      })

      const foundProtocol = service.getProtocolByIdentifier(MainProtocolSymbols.AE)

      expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.AE)
    })

    it('should not find a main protocol by an identifier if not active', () => {
      service.init({
        activeProtocols: [new AeternityProtocol()],
        passiveProtocols: []
      })

      try {
        service.getProtocolByIdentifier(MainProtocolSymbols.BTC)
      } catch (error) {
        expect(error.toString()).toBe('Error: serializer(PROTOCOL_NOT_SUPPORTED): ')
      }
    })

    it('should find a main passive protocol by an identifier if specified', () => {
      service.init({
        activeProtocols: [],
        passiveProtocols: [new AeternityProtocol()]
      })

      const foundProtocol = service.getProtocolByIdentifier(MainProtocolSymbols.AE, undefined, false)

      expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.AE)
    })

    it('should find a main protocol by an identifier and network', () => {
      service.init({
        activeProtocols: [new TezosProtocol(), new TezosProtocol(new TezosProtocolOptions(tezosTestnet))],
        passiveProtocols: []
      })

      const foundProtocol = service.getProtocolByIdentifier(MainProtocolSymbols.XTZ, tezosTestnet)

      expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundProtocol?.options.network).toBe(tezosTestnet)
    })

    it('should find a main protocol by protocol and network identifiers', () => {
      service.init({
        activeProtocols: [new TezosProtocol(), new TezosProtocol(new TezosProtocolOptions(tezosTestnet))],
        passiveProtocols: []
      })

      const foundProtocol = service.getProtocolByIdentifier(MainProtocolSymbols.XTZ, tezosTestnet.identifier)

      expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundProtocol?.options.network).toBe(tezosTestnet)
    })

    it('should not find a main protocol by an identifier if network does not match', () => {
      service.init({
        activeProtocols: [new TezosProtocol()],
        passiveProtocols: []
      })

      try {
        service.getProtocolByIdentifier(MainProtocolSymbols.XTZ, tezosTestnet)
      } catch (error) {
        expect(error.toString()).toBe('Error: serializer(PROTOCOL_NOT_SUPPORTED): ')
      }
    })
  })

  describe('Utils', () => {
    const validIdentifiers: string[] = [
      MainProtocolSymbols.AE,
      MainProtocolSymbols.BTC,
      MainProtocolSymbols.COSMOS,
      MainProtocolSymbols.ETH,
      MainProtocolSymbols.GRS,
      MainProtocolSymbols.KUSAMA,
      MainProtocolSymbols.POLKADOT,
      MainProtocolSymbols.XTZ
    ]

    const invalidIdentifiers: string[] = ['qwerty', 'abcde', 'aeternity', 'bitcoin', 'ethereum', 'tezos', 'ksm', 'dot', 'atom']

    it('should check if the identifier is valid', () => {
      service.init({
        activeProtocols: [],
        passiveProtocols: []
      })

      const allValid: boolean = validIdentifiers.reduce((all: boolean, next: string) => all && service.isIdentifierValid(next), true)
      const allInvalid: boolean = invalidIdentifiers.reduce((all: boolean, next: string) => all && !service.isIdentifierValid(next), true)

      expect(allValid).toBeTrue()
      expect(allInvalid).toBeTrue()
    })

    it('should find networks for the requested main protocol by its identifier', () => {
      const tezosProtocol = new TezosProtocol()
      const tezosProtocolTestnet = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        activeProtocols: [tezosProtocol, tezosProtocolTestnet],
        passiveProtocols: []
      })

      const foundNetworks = service.getNetworksForProtocol(MainProtocolSymbols.XTZ)
      const foundNetworkIdentifiers = foundNetworks.map((network: ProtocolNetwork) => network.identifier)

      expect(foundNetworkIdentifiers.sort()).toEqual(
        [tezosProtocol.options.network.identifier, tezosProtocolTestnet.options.network.identifier].sort()
      )
    })

    it('should not find networks for the requested main protocol by its identifier if not active', () => {
      service.init({
        activeProtocols: [],
        passiveProtocols: [new TezosProtocol()]
      })

      const foundNetworks = service.getNetworksForProtocol(MainProtocolSymbols.XTZ)

      expect(foundNetworks.length).toBe(0)
    })

    it('should find networks for the requested passive main protocol by its identifier if specified', () => {
      const tezosProtocol = new TezosProtocol()
      const tezosProtocolTestnet = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        activeProtocols: [tezosProtocol],
        passiveProtocols: [tezosProtocolTestnet]
      })

      const foundNetworks = service.getNetworksForProtocol(MainProtocolSymbols.XTZ, false)
      const foundNetworkIdentifiers = foundNetworks.map((network: ProtocolNetwork) => network.identifier)

      expect(foundNetworkIdentifiers.sort()).toEqual(
        [tezosProtocol.options.network.identifier, tezosProtocolTestnet.options.network.identifier].sort()
      )
    })
  })
})
