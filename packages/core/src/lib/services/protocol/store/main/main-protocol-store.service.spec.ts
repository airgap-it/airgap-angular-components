import { TestBed } from '@angular/core/testing'

import { MainProtocolSymbols, NetworkType, ProtocolNetwork, SubProtocolSymbols } from '@airgap/coinlib-core'
import { AeternityProtocol } from '@airgap/aeternity'
import { BitcoinProtocolNetwork, BitcoinProtocol, BitcoinProtocolOptions } from '@airgap/bitcoin'
import { CosmosProtocolNetwork, CosmosProtocol, CosmosProtocolOptions } from '@airgap/cosmos'
import { TezosProtocolNetwork, TezosProtocol, TezosProtocolOptions } from '@airgap/tezos'
import { getIdentifiers } from '../../utils/test'
import { ISOLATED_MODULES_PLUGIN } from '../../../../capacitor-plugins/injection-tokens'
import { IsolatedModules } from '../../../../capacitor-plugins/isolated-modules/isolated-modules.plugin'
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
    TestBed.configureTestingModule({
      providers: [{ provide: ISOLATED_MODULES_PLUGIN, useValue: new IsolatedModules() }]
    })
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
      it(description, async () => {
        const config = createConfig()
        const expected = createExpected()

        await service.init(config)

        const supportedIdentifiers = await getIdentifiers(await service.supportedProtocols)

        const activeIdentifiers = await getIdentifiers(service.activeProtocols)
        const passiveIdentifiers = await getIdentifiers(service.passiveProtocols)

        expect(service.isInitialized).toBeTrue()

        expect(supportedIdentifiers.sort()).toEqual(expected.activeIdentifiers.concat(expected.passiveIdentifiers).sort())

        expect(activeIdentifiers.sort()).toEqual(expected.activeIdentifiers.sort())
        expect(passiveIdentifiers.sort()).toEqual(expected.passiveIdentifiers.sort())
      })
    }

    it('should throw an error when not initialized', async () => {
      expect(service.isInitialized).toBeFalse()

      try {
        // eslint-disable-next-line no-unused-expressions
        await service.supportedProtocols
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
      await service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [new BitcoinProtocol()]
      })

      await service.init({
        passiveProtocols: [new CosmosProtocol()],
        activeProtocols: [new TezosProtocol()]
      })

      const supportedIdentifiers = await getIdentifiers(await service.supportedProtocols)

      const activeIdentifiers = await getIdentifiers(service.activeProtocols)
      const passiveIdentifiers = await getIdentifiers(service.passiveProtocols)

      const expectedPassiveIdentifiers = [MainProtocolSymbols.AE]
      const expectedActiveIdentifiers = [MainProtocolSymbols.BTC]

      expect(service.isInitialized).toBeTrue()

      expect(supportedIdentifiers.sort()).toEqual(expectedActiveIdentifiers.concat(expectedPassiveIdentifiers).sort())

      expect(activeIdentifiers.sort()).toEqual(expectedActiveIdentifiers.sort())
      expect(passiveIdentifiers.sort()).toEqual(expectedPassiveIdentifiers.sort())
    })
  })

  describe('Find Protocols', () => {
    it('should find a main protocol by an identifier', async () => {
      await service.init({
        activeProtocols: [new AeternityProtocol()],
        passiveProtocols: []
      })

      const foundProtocol = await service.getProtocolByIdentifier(MainProtocolSymbols.AE)
      const foundProtocolIdentifier = foundProtocol ? await foundProtocol.getIdentifier() : undefined

      expect(foundProtocolIdentifier).toBe(MainProtocolSymbols.AE)
    })

    it('should not find a main protocol by an identifier if not active', async () => {
      await service.init({
        activeProtocols: [new AeternityProtocol()],
        passiveProtocols: []
      })

      try {
        await service.getProtocolByIdentifier(MainProtocolSymbols.BTC)
      } catch (error) {
        expect(error.toString()).toBe('Error: serializer(PROTOCOL_NOT_SUPPORTED): ')
      }
    })

    it('should find a main passive protocol by an identifier if specified', async () => {
      await service.init({
        activeProtocols: [],
        passiveProtocols: [new AeternityProtocol()]
      })

      const foundProtocol = await service.getProtocolByIdentifier(MainProtocolSymbols.AE, undefined, false)

      const foundProtocolIdentifier = foundProtocol ? await foundProtocol.getIdentifier() : undefined

      expect(foundProtocolIdentifier).toBe(MainProtocolSymbols.AE)
    })

    it('should find a main protocol by an identifier and network', async () => {
      await service.init({
        activeProtocols: [new TezosProtocol(), new TezosProtocol(new TezosProtocolOptions(tezosTestnet))],
        passiveProtocols: []
      })

      const foundProtocol = await service.getProtocolByIdentifier(MainProtocolSymbols.XTZ, tezosTestnet)

      const foundProtocolIdentifier = foundProtocol ? await foundProtocol.getIdentifier() : undefined
      const foundProtocolOptions = foundProtocol ? await foundProtocol.getOptions() : undefined

      expect(foundProtocolIdentifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundProtocolOptions.network).toBe(tezosTestnet)
    })

    it('should find a main protocol by protocol and network identifiers', async () => {
      await service.init({
        activeProtocols: [new TezosProtocol(), new TezosProtocol(new TezosProtocolOptions(tezosTestnet))],
        passiveProtocols: []
      })

      const foundProtocol = await service.getProtocolByIdentifier(MainProtocolSymbols.XTZ, tezosTestnet.identifier)

      const foundProtocolIdentifier = foundProtocol ? await foundProtocol.getIdentifier() : undefined
      const foundProtocolOptions = foundProtocol ? await foundProtocol.getOptions() : undefined

      expect(foundProtocolIdentifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundProtocolOptions.network).toBe(tezosTestnet)
    })

    it('should not find a main protocol by an identifier if network does not match', async () => {
      await service.init({
        activeProtocols: [new TezosProtocol()],
        passiveProtocols: []
      })

      try {
        await service.getProtocolByIdentifier(MainProtocolSymbols.XTZ, tezosTestnet)
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
      MainProtocolSymbols.XTZ,
      'side_loaded_protocol'
    ]

    const invalidIdentifiers: string[] = [SubProtocolSymbols.ETH_ERC20, SubProtocolSymbols.XTZ_BTC, 'invalid-identifier']

    it('should check if the identifier is valid', async () => {
      await service.init({
        activeProtocols: [],
        passiveProtocols: []
      })

      const allValid: boolean = validIdentifiers.reduce((all: boolean, next: string) => all && service.isIdentifierValid(next), true)
      const allInvalid: boolean = invalidIdentifiers.reduce((all: boolean, next: string) => all && !service.isIdentifierValid(next), true)

      expect(allValid).toBeTrue()
      expect(allInvalid).toBeTrue()
    })

    it('should find networks for the requested main protocol by its identifier', async () => {
      const tezosProtocol = new TezosProtocol()
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      await service.init({
        activeProtocols: [tezosProtocol, tezosTestnetProtocol],
        passiveProtocols: []
      })

      const foundNetworks = await service.getNetworksForProtocol(MainProtocolSymbols.XTZ)
      const foundNetworkIdentifiers = await Promise.all(foundNetworks.map((network: ProtocolNetwork) => network.identifier))

      const tezosProtocolOptions = await tezosProtocol.getOptions()
      const tezosTestnetProtocolOptions = await tezosTestnetProtocol.getOptions()

      expect(foundNetworkIdentifiers.sort()).toEqual(
        [tezosProtocolOptions.network.identifier, tezosTestnetProtocolOptions.network.identifier].sort()
      )
    })

    it('should not find networks for the requested main protocol by its identifier if not active', async () => {
      await service.init({
        activeProtocols: [],
        passiveProtocols: [new TezosProtocol()]
      })

      const foundNetworks = await service.getNetworksForProtocol(MainProtocolSymbols.XTZ)

      expect(foundNetworks.length).toBe(0)
    })

    it('should find networks for the requested passive main protocol by its identifier if specified', async () => {
      const tezosProtocol = new TezosProtocol()
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      await service.init({
        activeProtocols: [tezosProtocol],
        passiveProtocols: [tezosTestnetProtocol]
      })

      const foundNetworks = await service.getNetworksForProtocol(MainProtocolSymbols.XTZ, false)
      const foundNetworkIdentifiers = await Promise.all(foundNetworks.map((network: ProtocolNetwork) => network.identifier))

      const tezosProtocolOptions = await tezosProtocol.getOptions()
      const tezosTestnetProtocolOptions = await tezosTestnetProtocol.getOptions()

      expect(foundNetworkIdentifiers.sort()).toEqual(
        [tezosProtocolOptions.network.identifier, tezosTestnetProtocolOptions.network.identifier].sort()
      )
    })
  })
})
