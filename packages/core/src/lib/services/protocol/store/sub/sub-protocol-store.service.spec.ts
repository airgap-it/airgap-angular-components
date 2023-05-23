/* eslint-disable max-lines */
import { TestBed, waitForAsync } from '@angular/core/testing'

import { SubProtocolSymbols, ProtocolNetwork, MainProtocolSymbols } from '@airgap/coinlib-core'
import { TEZOS_MAINNET_PROTOCOL_NETWORK } from '@airgap/tezos/v1/protocol/TezosProtocol'
import { TezosModule, TezosProtocolNetwork } from '@airgap/tezos'

import { getSubIdentifiers } from '../../utils/test'
import {
  convertNetworkV1ToV0,
  createV0TezosKtProtocol,
  createV0TezosProtocol,
  createV0TezosQuipuswapProtocol,
  createV0TezosStakerProtocol,
  createV0TezosTzBTCProtocol,
  createV0TezosUSDTezProtocol
} from '../../../../utils/protocol/protocol-v0-adapter'
import { TestBedUtils } from '../../../../../../test/utils/test-bed'
import { SubProtocolStoreService, SubProtocolStoreConfig } from './sub-protocol-store.service'

describe('SubProtocolStoreService', () => {
  let service: SubProtocolStoreService

  let tezosMainnet: TezosProtocolNetwork
  let tezosMainnetV0: ProtocolNetwork

  let tezosTestnet: TezosProtocolNetwork
  let tezosTestnetV0: ProtocolNetwork

  let testBedUtils: TestBedUtils

  beforeAll(async () => {
    const tezosModule: TezosModule = new TezosModule()

    tezosMainnet = {
      ...TEZOS_MAINNET_PROTOCOL_NETWORK,
      name: 'Mainnet',
      type: 'mainnet'
    }

    const tezosMainnetBlockExplorer = await tezosModule.createBlockExplorer(MainProtocolSymbols.XTZ, tezosMainnet)
    tezosMainnetV0 = convertNetworkV1ToV0(tezosMainnet, tezosMainnetBlockExplorer)

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

    service = TestBed.inject(SubProtocolStoreService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('Init', () => {
    function makeInitializationTest(
      description: string,
      createConfig: () => Promise<SubProtocolStoreConfig>,
      createExpected: () => Promise<{
        activeSubIdentifiers: SubProtocolSymbols[]
        passiveSubIdentifiers: SubProtocolSymbols[]
      }>
    ): void {
      it(description, async () => {
        const config = await createConfig()
        const expected = await createExpected()

        await service.init(config)

        const supportedSubIdentifiers = await getSubIdentifiers(await service.supportedProtocols)

        const activeSubIdentifiers = await getSubIdentifiers(service.activeProtocols)
        const passiveSubIdentifiers = await getSubIdentifiers(service.passiveProtocols)

        expect(service.isInitialized).toBeTrue()

        expect(supportedSubIdentifiers.sort()).toEqual(expected.activeSubIdentifiers.concat(expected.passiveSubIdentifiers).sort())

        expect(activeSubIdentifiers.sort()).toEqual(expected.activeSubIdentifiers.sort())
        expect(passiveSubIdentifiers.sort()).toEqual(expected.passiveSubIdentifiers.sort())
      })
    }

    it('should throw an error when not initialized', async () => {
      expect(service.isInitialized).toBeFalse()

      try {
        // eslint-disable-next-line no-unused-expressions
        await service.supportedProtocols
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
      async () => ({
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosUSDTezProtocol()]]
      }),
      async () => ({
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_BTC],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_USD]
      })
    )

    makeInitializationTest(
      'should remove duplicated protocols when passed',
      async () => ({
        passiveSubProtocols: [
          [await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()],
          [await createV0TezosProtocol(), await createV0TezosUSDTezProtocol()],
          [await createV0TezosProtocol(), await createV0TezosUSDTezProtocol()]
        ],
        activeSubProtocols: [
          [await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()],
          [await createV0TezosProtocol(), await createV0TezosKtProtocol()],
          [await createV0TezosProtocol(), await createV0TezosKtProtocol()]
        ]
      }),
      async () => ({
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_USD],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_KT]
      })
    )

    makeInitializationTest(
      'should not remove as duplicated protocols with the same identifier but different networks',
      async () => ({
        passiveSubProtocols: [
          [await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()],
          [await createV0TezosProtocol({ network: tezosTestnet }), await createV0TezosTzBTCProtocol({ network: tezosTestnet })],
          [await createV0TezosProtocol({ network: tezosTestnet }), await createV0TezosUSDTezProtocol({ network: tezosTestnet })]
        ],
        activeSubProtocols: [
          [await createV0TezosProtocol(), await createV0TezosUSDTezProtocol()],
          [await createV0TezosProtocol(), await createV0TezosStakerProtocol()],
          [await createV0TezosProtocol({ network: tezosTestnet }), await createV0TezosStakerProtocol({ network: tezosTestnet })]
        ]
      }),
      async () => ({
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_USD],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_STKR, SubProtocolSymbols.XTZ_STKR, SubProtocolSymbols.XTZ_USD]
      })
    )

    it('should be initialized once', async () => {
      await service.init({
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosUSDTezProtocol()]]
      })

      await service.init({
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosKtProtocol()]],
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosStakerProtocol()]]
      })

      const supportedSubIdentifiers = await getSubIdentifiers(await service.supportedProtocols)

      const activeSubIdentifiers = await getSubIdentifiers(service.activeProtocols)
      const passiveSubIdentifiers = await getSubIdentifiers(service.passiveProtocols)

      const expectedPassiveSubIdentifiers = [SubProtocolSymbols.XTZ_BTC]
      const expectedActiveSubIdentifiers = [SubProtocolSymbols.XTZ_USD]

      expect(service.isInitialized).toBeTrue()

      expect(supportedSubIdentifiers.sort()).toEqual(expectedActiveSubIdentifiers.concat(expectedPassiveSubIdentifiers).sort())

      expect(activeSubIdentifiers.sort()).toEqual(expectedActiveSubIdentifiers.sort())
      expect(passiveSubIdentifiers.sort()).toEqual(expectedPassiveSubIdentifiers.sort())
    })
  })

  describe('Remove Protocols', () => {
    it('should remove protocols by identifiers', async () => {
      await service.init({
        activeSubProtocols: [
          [await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()],
          [await createV0TezosProtocol(), await createV0TezosStakerProtocol()]
        ],
        passiveSubProtocols: [
          [await createV0TezosProtocol(), await createV0TezosUSDTezProtocol()],
          [await createV0TezosProtocol(), await createV0TezosQuipuswapProtocol()]
        ]
      })

      await service.removeProtocols([SubProtocolSymbols.XTZ_STKR, SubProtocolSymbols.XTZ_QUIPU])

      const supportedSubIdentifiers = await getSubIdentifiers(await service.supportedProtocols)

      const activeSubIdentifiers = await getSubIdentifiers(service.activeProtocols)
      const passiveSubIdentifiers = await getSubIdentifiers(service.passiveProtocols)

      const expectedActiveSubIdentifiers = [SubProtocolSymbols.XTZ_BTC]
      const expectedPassiveSubIdentifiers = [SubProtocolSymbols.XTZ_USD]

      expect(supportedSubIdentifiers.sort()).toEqual(expectedActiveSubIdentifiers.concat(expectedPassiveSubIdentifiers).sort())

      expect(activeSubIdentifiers.sort()).toEqual(expectedActiveSubIdentifiers.sort())
      expect(passiveSubIdentifiers.sort()).toEqual(expectedPassiveSubIdentifiers.sort())
    })
  })

  describe('Find Protocols', () => {
    it('should find a sub protocol by a sub protocol identifier', async () => {
      await service.init({
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        passiveSubProtocols: []
      })

      const foundSubProtocol = await service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC)

      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined

      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should not find a sub protocol by a sub identifier if not active', async () => {
      await service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]]
      })

      try {
        await service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC)
      } catch (error) {
        expect(error.toString()).toBe('Error: serializer(PROTOCOL_NOT_SUPPORTED): ')
      }
    })

    it('should find a passive protocol by a sub identifier if specified', async () => {
      await service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]]
      })

      const foundSubProtocol = await service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, undefined, false)

      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined

      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should find a sub protocol by a sub identifier and network', async () => {
      await service.init({
        activeSubProtocols: [
          [await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()],
          [await createV0TezosProtocol({ network: tezosTestnet }), await createV0TezosTzBTCProtocol({ network: tezosTestnet })]
        ],
        passiveSubProtocols: []
      })

      const foundSubProtocol = await service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, tezosTestnetV0)

      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined
      const foundSubProtocolOptions = foundSubProtocol ? await foundSubProtocol.getOptions() : undefined

      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocolOptions.network.identifier).toEqual(tezosTestnetV0.identifier)
    })

    it('should find a sub protocol by sub protocol and network identifiers', async () => {
      await service.init({
        activeSubProtocols: [
          [await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()],
          [await createV0TezosProtocol({ network: tezosTestnet }), await createV0TezosTzBTCProtocol({ network: tezosTestnet })]
        ],
        passiveSubProtocols: []
      })

      const foundSubProtocol = await service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, tezosTestnetV0.identifier)

      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined
      const foundSubProtocolOptions = foundSubProtocol ? await foundSubProtocol.getOptions() : undefined

      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocolOptions.network.identifier).toEqual(tezosTestnetV0.identifier)
    })

    it('should not find a sub protocol by a sub identifier if network does not match and fall back to any matching the identifier', async () => {
      await service.init({
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        passiveSubProtocols: []
      })

      const foundSubProtocol = await service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, tezosTestnetV0)

      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined
      const foundSubProtocolOptions = foundSubProtocol ? await foundSubProtocol.getOptions() : undefined

      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocolOptions.network.identifier).toEqual(tezosMainnetV0.identifier)
    })
  })

  describe('Utils', () => {
    const validIdentifiers: string[] = [
      SubProtocolSymbols.ETH_ERC20,
      SubProtocolSymbols.XTZ_BTC,
      SubProtocolSymbols.XTZ_KT,
      SubProtocolSymbols.XTZ_STKR,
      SubProtocolSymbols.XTZ_USD,
      'eth-erc20-bnb',
      'eth-erc20-usdt'
    ]

    const invalidIdentifiers: string[] = ['qwerty', 'abcde', 'tzBTC', 'tzKT', 'tzSTKR', 'tzUSD', 'erc20']

    it('should check if the identifier is valid', async () => {
      await service.init({
        activeSubProtocols: [],
        passiveSubProtocols: []
      })

      const allValid: boolean = validIdentifiers.reduce((all: boolean, next: string) => all && service.isIdentifierValid(next), true)
      const allInvalid: boolean = invalidIdentifiers.reduce((all: boolean, next: string) => all && !service.isIdentifierValid(next), true)

      expect(allValid).toBeTrue()
      expect(allInvalid).toBeTrue()
    })

    it('should find networks for the requested sub protocol by its identifier', async () => {
      const tezosProtocol = await createV0TezosProtocol()
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })

      await service.init({
        activeSubProtocols: [
          [tezosProtocol, await createV0TezosTzBTCProtocol()],
          [tezosTestnetProtocol, await createV0TezosTzBTCProtocol({ network: tezosTestnet })]
        ],
        passiveSubProtocols: []
      })

      const foundNetworks = await service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC)
      const foundNetworkIdentifiers = await Promise.all(foundNetworks.map((network: ProtocolNetwork) => network.identifier))

      const tezosProtocolOptions = await tezosProtocol.getOptions()
      const tezosTestnetProtocolOptions = await tezosTestnetProtocol.getOptions()

      expect(foundNetworkIdentifiers.sort()).toEqual(
        [tezosProtocolOptions.network.identifier, tezosTestnetProtocolOptions.network.identifier].sort()
      )
    })

    it('should not find networks for the requested sub protocol by its identifier if not active', async () => {
      await service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]]
      })

      const foundNetworks = await service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC)

      expect(foundNetworks.length).toBe(0)
    })

    it('should find networks for the requested passive sub protocol by its identifier if specified', async () => {
      const tezosProtocol = await createV0TezosProtocol()
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })

      await service.init({
        activeSubProtocols: [[tezosProtocol, await createV0TezosTzBTCProtocol()]],
        passiveSubProtocols: [[tezosTestnetProtocol, await createV0TezosTzBTCProtocol({ network: tezosTestnet })]]
      })

      const foundNetworks = await service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC, false)
      const foundNetworkIdentifiers = await Promise.all(foundNetworks.map((network: ProtocolNetwork) => network.identifier))

      const tezosProtocolOptions = await tezosProtocol.getOptions()
      const tezosTestnetProtocolOptions = await tezosTestnetProtocol.getOptions()

      expect(foundNetworkIdentifiers.sort()).toEqual(
        [tezosProtocolOptions.network.identifier, tezosTestnetProtocolOptions.network.identifier].sort()
      )
    })
  })
})
