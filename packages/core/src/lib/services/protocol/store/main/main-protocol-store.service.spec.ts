import { TestBed, waitForAsync } from '@angular/core/testing'

import { MainProtocolSymbols, ProtocolNetwork, SubProtocolSymbols } from '@airgap/coinlib-core'
import { TezosModule, TezosProtocolNetwork } from '@airgap/tezos'
import { CosmosProtocolNetwork } from '@airgap/cosmos-core'
import { BitcoinProtocolNetwork } from '@airgap/bitcoin'
import { BITCOIN_MAINNET_PROTOCOL_NETWORK } from '@airgap/bitcoin/v1/protocol/BitcoinProtocol'
import { TEZOS_MAINNET_PROTOCOL_NETWORK } from '@airgap/tezos/v1/protocol/TezosProtocol'
import { COSMOS_MAINNET_PROTOCOL_NETWORK } from '@airgap/cosmos/v1/protocol/CosmosProtocol'

import { getIdentifiers } from '../../utils/test'
import {
  convertNetworkV1ToV0,
  createV0AeternityProtocol,
  createV0BitcoinProtocol,
  createV0CosmosProtocol,
  createV0TezosProtocol
} from '../../../../utils/protocol/protocol-v0-adapter'
import { TestBedUtils } from '../../../../../../test/utils/test-bed'
import { MainProtocolStoreService, MainProtocolStoreConfig } from './main-protocol-store.service'

describe('MainProtocolStoreService', () => {
  let service: MainProtocolStoreService

  let bitcoinTestnet: BitcoinProtocolNetwork

  let cosmosTestnet: CosmosProtocolNetwork

  let tezosTestnet: TezosProtocolNetwork
  let tezosTestnetV0: ProtocolNetwork

  let testBedUtils: TestBedUtils

  beforeAll(async () => {
    const tezosModule: TezosModule = new TezosModule()

    bitcoinTestnet = {
      ...BITCOIN_MAINNET_PROTOCOL_NETWORK,
      name: 'Testnet',
      type: 'testnet'
    }

    cosmosTestnet = {
      ...COSMOS_MAINNET_PROTOCOL_NETWORK,
      name: 'Testnet',
      type: 'testnet'
    }

    tezosTestnet = {
      ...TEZOS_MAINNET_PROTOCOL_NETWORK,
      name: 'Testnet',
      type: 'testnet'
    }
    const tezosTestnetBlockExplorer = await tezosModule.createBlockExplorer(MainProtocolSymbols.XTZ, tezosTestnet)
    tezosTestnetV0 = convertNetworkV1ToV0(tezosTestnet, tezosTestnetBlockExplorer)
  })

  beforeEach(waitForAsync(async () => {
    testBedUtils = new TestBedUtils()
    await TestBed.configureTestingModule(testBedUtils.moduleDef({})).compileComponents()

    service = TestBed.inject(MainProtocolStoreService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('Init', () => {
    function makeInitializationTest(
      description: string,
      createConfig: () => Promise<MainProtocolStoreConfig>,
      createExpected: () => Promise<{
        activeIdentifiers: MainProtocolSymbols[]
        passiveIdentifiers: MainProtocolSymbols[]
      }>
    ): void {
      it(description, async () => {
        const config = await createConfig()
        const expected = await createExpected()

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
      async () => ({
        passiveProtocols: [await createV0AeternityProtocol()],
        activeProtocols: [await createV0BitcoinProtocol()]
      }),
      async () => ({
        passiveIdentifiers: [MainProtocolSymbols.AE],
        activeIdentifiers: [MainProtocolSymbols.BTC]
      })
    )

    makeInitializationTest(
      'should remove duplicated protocols',
      async () => ({
        activeProtocols: [await createV0BitcoinProtocol(), await createV0CosmosProtocol(), await createV0CosmosProtocol()],
        passiveProtocols: [await createV0AeternityProtocol(), await createV0AeternityProtocol(), await createV0BitcoinProtocol()]
      }),
      async () => ({
        passiveIdentifiers: [MainProtocolSymbols.AE],
        activeIdentifiers: [MainProtocolSymbols.BTC, MainProtocolSymbols.COSMOS]
      })
    )

    makeInitializationTest(
      'should not remove as duplicated protocols with the same identifier but different networks',
      async () => ({
        passiveProtocols: [
          await createV0BitcoinProtocol(),
          await createV0BitcoinProtocol({ network: bitcoinTestnet }),
          await createV0TezosProtocol({ network: tezosTestnet })
        ],
        activeProtocols: [
          await createV0CosmosProtocol(),
          await createV0CosmosProtocol({ network: cosmosTestnet }),
          await createV0TezosProtocol()
        ]
      }),
      async () => ({
        passiveIdentifiers: [MainProtocolSymbols.BTC, MainProtocolSymbols.BTC, MainProtocolSymbols.XTZ],
        activeIdentifiers: [MainProtocolSymbols.COSMOS, MainProtocolSymbols.COSMOS, MainProtocolSymbols.XTZ]
      })
    )

    it('should be initialized once', async () => {
      await service.init({
        passiveProtocols: [await createV0AeternityProtocol()],
        activeProtocols: [await createV0BitcoinProtocol()]
      })

      await service.init({
        passiveProtocols: [await createV0CosmosProtocol()],
        activeProtocols: [await createV0TezosProtocol()]
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

  describe('Remove Protocols', () => {
    it('should remove protocols by identifiers', async () => {
      await service.init({
        activeProtocols: [await createV0AeternityProtocol(), await createV0TezosProtocol()],
        passiveProtocols: [await createV0BitcoinProtocol(), await createV0CosmosProtocol()]
      })

      await service.removeProtocols([MainProtocolSymbols.AE, MainProtocolSymbols.COSMOS])

      const supportedIdentifiers = await getIdentifiers(await service.supportedProtocols)

      const activeIdentifiers = await getIdentifiers(service.activeProtocols)
      const passiveIdentifiers = await getIdentifiers(service.passiveProtocols)

      const expectedActiveIdentifiers = [MainProtocolSymbols.XTZ]
      const expectedPassiveIdentifiers = [MainProtocolSymbols.BTC]

      expect(supportedIdentifiers.sort()).toEqual(expectedActiveIdentifiers.concat(expectedPassiveIdentifiers).sort())

      expect(activeIdentifiers.sort()).toEqual(expectedActiveIdentifiers.sort())
      expect(passiveIdentifiers.sort()).toEqual(expectedPassiveIdentifiers.sort())
    })
  })

  describe('Find Protocols', () => {
    it('should find a main protocol by an identifier', async () => {
      await service.init({
        activeProtocols: [await createV0AeternityProtocol()],
        passiveProtocols: []
      })

      const foundProtocol = await service.getProtocolByIdentifier(MainProtocolSymbols.AE)
      const foundProtocolIdentifier = foundProtocol ? await foundProtocol.getIdentifier() : undefined

      expect(foundProtocolIdentifier).toBe(MainProtocolSymbols.AE)
    })

    it('should not find a main protocol by an identifier if not active', async () => {
      await service.init({
        activeProtocols: [await createV0AeternityProtocol()],
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
        passiveProtocols: [await createV0AeternityProtocol()]
      })

      const foundProtocol = await service.getProtocolByIdentifier(MainProtocolSymbols.AE, undefined, false)

      const foundProtocolIdentifier = foundProtocol ? await foundProtocol.getIdentifier() : undefined

      expect(foundProtocolIdentifier).toBe(MainProtocolSymbols.AE)
    })

    it('should find a main protocol by an identifier and network', async () => {
      await service.init({
        activeProtocols: [await createV0TezosProtocol(), await createV0TezosProtocol({ network: tezosTestnet })],
        passiveProtocols: []
      })

      const foundProtocol = await service.getProtocolByIdentifier(MainProtocolSymbols.XTZ, tezosTestnetV0)

      const foundProtocolIdentifier = foundProtocol ? await foundProtocol.getIdentifier() : undefined
      const foundProtocolOptions = foundProtocol ? await foundProtocol.getOptions() : undefined

      expect(foundProtocolIdentifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundProtocolOptions.network.identifier).toEqual(tezosTestnetV0.identifier)
    })

    it('should find a main protocol by protocol and network identifiers', async () => {
      await service.init({
        activeProtocols: [await createV0TezosProtocol(), await createV0TezosProtocol({ network: tezosTestnet })],
        passiveProtocols: []
      })

      const foundProtocol = await service.getProtocolByIdentifier(MainProtocolSymbols.XTZ, tezosTestnetV0.identifier)

      const foundProtocolIdentifier = foundProtocol ? await foundProtocol.getIdentifier() : undefined
      const foundProtocolOptions = foundProtocol ? await foundProtocol.getOptions() : undefined

      expect(foundProtocolIdentifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundProtocolOptions.network.identifier).toEqual(tezosTestnetV0.identifier)
    })

    it('should not find a main protocol by an identifier if network does not match', async () => {
      await service.init({
        activeProtocols: [await createV0TezosProtocol()],
        passiveProtocols: []
      })

      try {
        await service.getProtocolByIdentifier(MainProtocolSymbols.XTZ, tezosTestnetV0)
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
      const tezosProtocol = await createV0TezosProtocol()
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })

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
        passiveProtocols: [await createV0TezosProtocol()]
      })

      const foundNetworks = await service.getNetworksForProtocol(MainProtocolSymbols.XTZ)

      expect(foundNetworks.length).toBe(0)
    })

    it('should find networks for the requested passive main protocol by its identifier if specified', async () => {
      const tezosProtocol = await createV0TezosProtocol()
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })

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
