import { TestBed } from '@angular/core/testing'

import {
  AeternityProtocol,
  BitcoinProtocol,
  TezosProtocol,
  CosmosProtocol,
  TezosProtocolNetwork,
  TezblockBlockExplorer,
  TezosProtocolNetworkExtras,
  TezosProtocolOptions,
} from 'airgap-coin-lib'
import { MainProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { NetworkType } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { getIdentifiers } from '../../utils/test'
import { MainProtocolStoreService, MainProtocolStoreConfig } from './main-protocol-store.service'

describe('MainProtocolStoreService', () => {
  let service: MainProtocolStoreService

  let tezosTestnet: TezosProtocolNetwork

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(MainProtocolStoreService)

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
      createConfig: () => MainProtocolStoreConfig,
      createExpected: () => {
        activeIdentifiers: MainProtocolSymbols[]
        passiveIdentifiers: MainProtocolSymbols[]
      },
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
        activeProtocols: [new BitcoinProtocol()],
      }),
      () => ({
        activeIdentifiers: [MainProtocolSymbols.BTC],
        passiveIdentifiers: [MainProtocolSymbols.AE],
      })
    )

    makeInitializationTest(
      'should remove duplicated protocols',
      () => ({
        passiveProtocols: [new AeternityProtocol(), new BitcoinProtocol()],
        activeProtocols: [new BitcoinProtocol(), new CosmosProtocol()],
      }),
      () => ({
        activeIdentifiers: [MainProtocolSymbols.BTC, MainProtocolSymbols.COSMOS],
        passiveIdentifiers: [MainProtocolSymbols.AE],
      })
    )

    makeInitializationTest(
      'should not remove as duplicated protocols with the same identifier but different networks',
      () => ({
        passiveProtocols: [new TezosProtocol(new TezosProtocolOptions(tezosTestnet))],
        activeProtocols: [new TezosProtocol()],
      }),
      () => ({
        activeIdentifiers: [MainProtocolSymbols.XTZ],
        passiveIdentifiers: [MainProtocolSymbols.XTZ],
      })
    )
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
})
