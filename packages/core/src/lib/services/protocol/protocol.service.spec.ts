/* eslint-disable spaced-comment */
/* eslint-disable max-lines */
import { TestBed, waitForAsync } from '@angular/core/testing'
import { MainProtocolSymbols, SubProtocolSymbols, ICoinSubProtocol, ProtocolNetwork, ICoinProtocol } from '@airgap/coinlib-core'
import { TezosModule, TezosProtocolNetwork } from '@airgap/tezos'
import { TEZOS_MAINNET_PROTOCOL_NETWORK } from '@airgap/tezos/v1/protocol/TezosProtocol'
import { duplicatesRemoved } from '../../utils/array'
import {
  convertNetworkV1ToV0,
  createV0AeternityProtocol,
  createV0BitcoinProtocol,
  createV0CosmosProtocol,
  createV0EthereumERC20Token,
  createV0EthereumProtocol,
  createV0KusamaProtocol,
  createV0PolkadotProtocol,
  createV0TezosETHTezProtocol,
  createV0TezosKtProtocol,
  createV0TezosProtocol,
  createV0TezosQuipuswapProtocol,
  createV0TezosStakerProtocol,
  createV0TezosTzBTCProtocol,
  createV0TezosUSDTezProtocol,
  createV0TezosUUSDProtocol
} from '../../utils/protocol/protocol-v0-adapter'
import { TestBedUtils } from '../../../../test/utils/test-bed'
import { getIdentifiers, getSubIdentifiers } from './utils/test'
import { ProtocolService, ProtocolServiceConfig } from './protocol.service'
import {
  getDefaultActiveProtocols,
  getDefaultPassiveProtocols,
  getDefaultActiveSubProtocols,
  getDefaultPassiveSubProtocols
} from './defaults'

describe('ProtocolService', () => {
  let service: ProtocolService

  let tezosMainnet: TezosProtocolNetwork
  let tezosMainnetV0: ProtocolNetwork

  let tezosTestnet: TezosProtocolNetwork
  let tezosTestnetV0: ProtocolNetwork

  let defaultActiveIdentifiers: MainProtocolSymbols[]
  let defaultPassiveIdentifiers: MainProtocolSymbols[]
  let defaultActiveSubIdentifiers: SubProtocolSymbols[]
  let defaultPassiveSubIdentifiers: SubProtocolSymbols[]

  let testBedUtils: TestBedUtils

  beforeAll(async () => {
    defaultActiveIdentifiers = duplicatesRemoved((await getIdentifiers(await getDefaultActiveProtocols())) as MainProtocolSymbols[])
    defaultPassiveIdentifiers = duplicatesRemoved((await getIdentifiers(await getDefaultPassiveProtocols())) as MainProtocolSymbols[])
    defaultActiveSubIdentifiers = duplicatesRemoved((await getSubIdentifiers(await getDefaultActiveSubProtocols())) as SubProtocolSymbols[])
    defaultPassiveSubIdentifiers = duplicatesRemoved(
      (await getSubIdentifiers(await getDefaultPassiveSubProtocols())) as SubProtocolSymbols[]
    )

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

    service = TestBed.inject(ProtocolService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  /**************** Init ****************/

  describe('Init', () => {
    function makeInitializationTest(
      description: string,
      createConfig: () => Promise<ProtocolServiceConfig>,
      createExpected: () => Promise<{
        passiveIdentifiers: MainProtocolSymbols[]
        activeIdentifiers: MainProtocolSymbols[]
        passiveSubIdentifiers: SubProtocolSymbols[]
        activeSubIdentifiers: SubProtocolSymbols[]
      }>
    ): void {
      it(description, async () => {
        const config = await createConfig()
        const expected = await createExpected()

        await service.init(config)

        const supportedIdentifiers = await getIdentifiers(await service.getSupportedProtocols())
        const supportedSubIdentifiers = await getSubIdentifiers(await service.getSupportedSubProtocols())

        const activeIdentifiers = await getIdentifiers(await service.getActiveProtocols())
        const passiveIdentifiers = await getIdentifiers(await service.getPassiveProtocols())

        const activeSubIdentifiers = await getSubIdentifiers(await service.getActiveSubProtocols())
        const passiveSubIdentifiers = await getSubIdentifiers(await service.getPassiveSubProtocols())

        await expectAsync(service.waitReady()).toBeResolved()

        expect(supportedIdentifiers.sort()).toEqual(expected.activeIdentifiers.concat(expected.passiveIdentifiers).sort())
        expect(supportedSubIdentifiers.sort()).toEqual(expected.activeSubIdentifiers.concat(expected.passiveSubIdentifiers).sort())

        expect(activeIdentifiers.sort()).toEqual(expected.activeIdentifiers.sort())
        expect(passiveIdentifiers.sort()).toEqual(expected.passiveIdentifiers.sort())

        expect(activeSubIdentifiers.sort()).toEqual(expected.activeSubIdentifiers.sort())
        expect(passiveSubIdentifiers.sort()).toEqual(expected.passiveSubIdentifiers.sort())
      })
    }

    makeInitializationTest(
      'should be initialized with default protocols',
      async () => ({}),
      async () => ({
        passiveIdentifiers: defaultPassiveIdentifiers,
        activeIdentifiers: defaultActiveIdentifiers,
        passiveSubIdentifiers: defaultPassiveSubIdentifiers,
        activeSubIdentifiers: defaultActiveSubIdentifiers
      })
    )

    makeInitializationTest(
      'should be initialized with provided protocols',
      async () => ({
        passiveProtocols: [await createV0AeternityProtocol()],
        activeProtocols: [await createV0BitcoinProtocol()],
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosUSDTezProtocol()]],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]]
      }),
      async () => ({
        passiveIdentifiers: [MainProtocolSymbols.AE],
        activeIdentifiers: [MainProtocolSymbols.BTC],
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_BTC],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_USD]
      })
    )

    makeInitializationTest(
      'should be initialized with provided extra protocols',
      async () => ({
        extraPassiveProtocols: [await createV0AeternityProtocol()],
        activeProtocols: [await createV0BitcoinProtocol()],
        extraActiveProtocols: [await createV0CosmosProtocol()],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosKtProtocol()]],
        extraPassiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosUSDTezProtocol()]],
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        extraActiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosStakerProtocol()]]
      }),
      async () => ({
        passiveIdentifiers: [MainProtocolSymbols.AE],
        activeIdentifiers: [MainProtocolSymbols.BTC, MainProtocolSymbols.COSMOS],
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_KT, SubProtocolSymbols.XTZ_USD],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_STKR]
      })
    )

    makeInitializationTest(
      'should remove duplicated protocols',
      async () => ({
        passiveProtocols: [await createV0AeternityProtocol(), await createV0AeternityProtocol(), await createV0BitcoinProtocol()],
        activeProtocols: [await createV0BitcoinProtocol(), await createV0CosmosProtocol(), await createV0CosmosProtocol()],
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
        passiveIdentifiers: [MainProtocolSymbols.AE],
        activeIdentifiers: [MainProtocolSymbols.BTC, MainProtocolSymbols.COSMOS],
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_USD],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_KT]
      })
    )

    makeInitializationTest(
      'should not remove as duplicated protocols with the same identifier but different networks',
      async () => ({
        passiveProtocols: [await createV0TezosProtocol({ network: tezosTestnet })],
        activeProtocols: [await createV0TezosProtocol()],
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
        passiveIdentifiers: [MainProtocolSymbols.XTZ],
        activeIdentifiers: [MainProtocolSymbols.XTZ],
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_USD],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_STKR, SubProtocolSymbols.XTZ_STKR, SubProtocolSymbols.XTZ_USD]
      })
    )
    it('should be initialized once', async () => {
      await service.init({
        passiveProtocols: [await createV0AeternityProtocol()],
        activeProtocols: [await createV0BitcoinProtocol()],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosUSDTezProtocol()]]
      })

      await service.init({
        passiveProtocols: [await createV0CosmosProtocol()],
        activeProtocols: [await createV0TezosProtocol()],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosKtProtocol()]],
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosStakerProtocol()]]
      })

      const supportedIdentifiers = await getIdentifiers(await service.getSupportedProtocols())
      const supportedSubIdentifiers = await getSubIdentifiers(await service.getSupportedSubProtocols())

      const activeIdentifiers = await getIdentifiers(await service.getActiveProtocols())
      const passiveIdentifiers = await getIdentifiers(await service.getPassiveProtocols())

      const activeSubIdentifiers = await getSubIdentifiers(await service.getActiveSubProtocols())
      const passiveSubIdentifiers = await getSubIdentifiers(await service.getPassiveSubProtocols())

      const expectedPassiveIdentifiers = [MainProtocolSymbols.AE]
      const expectedActiveIdentifiers = [MainProtocolSymbols.BTC]

      const expectedPassiveSubIdentifiers = [SubProtocolSymbols.XTZ_BTC]
      const expectedActiveSubIdentifiers = [SubProtocolSymbols.XTZ_USD]

      await expectAsync(service.waitReady()).toBeResolved()

      expect(supportedIdentifiers.sort()).toEqual(expectedActiveIdentifiers.concat(expectedPassiveIdentifiers).sort())
      expect(supportedSubIdentifiers.sort()).toEqual(expectedActiveSubIdentifiers.concat(expectedPassiveSubIdentifiers).sort())

      expect(activeIdentifiers.sort()).toEqual(expectedActiveIdentifiers.sort())
      expect(passiveIdentifiers.sort()).toEqual(expectedPassiveIdentifiers.sort())

      expect(activeSubIdentifiers.sort()).toEqual(expectedActiveSubIdentifiers.sort())
      expect(passiveSubIdentifiers.sort()).toEqual(expectedPassiveSubIdentifiers.sort())
    })
  })

  /**************** Check Protocol Status ****************/

  describe('Check Protocol Status', () => {
    it('should check by an identifer if the protocol is active', async () => {
      await service.init({
        passiveProtocols: [await createV0AeternityProtocol()],
        activeProtocols: [await createV0BitcoinProtocol()],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosKtProtocol()]]
      })

      const isAeternityActive = await service.isProtocolActive(MainProtocolSymbols.AE)
      const isBitcoinActive = await service.isProtocolActive(MainProtocolSymbols.BTC)
      const isCosmosActive = await service.isProtocolActive(MainProtocolSymbols.COSMOS)

      const isTzBTCActive = await service.isProtocolActive(SubProtocolSymbols.XTZ_BTC)
      const isTzKTActive = await service.isProtocolActive(SubProtocolSymbols.XTZ_KT)
      const isTzUSDActive = await service.isProtocolActive(SubProtocolSymbols.XTZ_USD)

      expect(isAeternityActive).toBeFalse()
      expect(isBitcoinActive).toBeTrue()
      expect(isCosmosActive).toBeFalse()

      expect(isTzBTCActive).toBeFalse()
      expect(isTzKTActive).toBeTrue()
      expect(isTzUSDActive).toBeFalse()
    })

    it('should check if the protocol is active when an instance is passed', async () => {
      await service.init({
        passiveProtocols: [await createV0AeternityProtocol()],
        activeProtocols: [await createV0BitcoinProtocol()],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosKtProtocol()]]
      })

      const isAeternityActive = await service.isProtocolActive(await createV0AeternityProtocol())
      const isBitcoinActive = await service.isProtocolActive(await createV0BitcoinProtocol())
      const isCosmosActive = await service.isProtocolActive(await createV0CosmosProtocol())

      const isTzBTCActive = await service.isProtocolActive(await createV0TezosTzBTCProtocol())
      const isTzKTActive = await service.isProtocolActive(await createV0TezosKtProtocol())
      const isTzUSDActive = await service.isProtocolActive(await createV0TezosUSDTezProtocol())

      expect(isAeternityActive).toBeFalse()
      expect(isBitcoinActive).toBeTrue()
      expect(isCosmosActive).toBeFalse()

      expect(isTzBTCActive).toBeFalse()
      expect(isTzKTActive).toBeTrue()
      expect(isTzUSDActive).toBeFalse()
    })

    it('should check by an identifier if the protocol is supported', async () => {
      await service.init({
        passiveProtocols: [await createV0AeternityProtocol()],
        activeProtocols: [await createV0BitcoinProtocol()],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosKtProtocol()]]
      })

      const isAeternityActive = await service.isProtocolSupported(MainProtocolSymbols.AE)
      const isBitcoinActive = await service.isProtocolSupported(MainProtocolSymbols.BTC)
      const isCosmosActive = await service.isProtocolSupported(MainProtocolSymbols.COSMOS)

      const isTzBTCActive = await service.isProtocolSupported(SubProtocolSymbols.XTZ_BTC)
      const isTzKTActive = await service.isProtocolSupported(SubProtocolSymbols.XTZ_KT)
      const isTzUSDActive = await service.isProtocolSupported(SubProtocolSymbols.XTZ_USD)

      expect(isAeternityActive).toBeTrue()
      expect(isBitcoinActive).toBeTrue()
      expect(isCosmosActive).toBeFalse()

      expect(isTzBTCActive).toBeTrue()
      expect(isTzKTActive).toBeTrue()
      expect(isTzUSDActive).toBeFalse()
    })

    it('should check if the protocol is supported when an instance is passed', async () => {
      await service.init({
        passiveProtocols: [await createV0AeternityProtocol()],
        activeProtocols: [await createV0BitcoinProtocol()],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosKtProtocol()]]
      })

      const isAeternityActive = await service.isProtocolSupported(await createV0AeternityProtocol())
      const isBitcoinActive = await service.isProtocolSupported(await createV0BitcoinProtocol())
      const isCosmosActive = await service.isProtocolSupported(await createV0CosmosProtocol())

      const isTzBTCActive = await service.isProtocolSupported(await createV0TezosTzBTCProtocol())
      const isTzKTActive = await service.isProtocolSupported(await createV0TezosKtProtocol())
      const isTzUSDActive = await service.isProtocolSupported(await createV0TezosUSDTezProtocol())

      expect(isAeternityActive).toBeTrue()
      expect(isBitcoinActive).toBeTrue()
      expect(isCosmosActive).toBeFalse()

      expect(isTzBTCActive).toBeTrue()
      expect(isTzKTActive).toBeTrue()
      expect(isTzUSDActive).toBeFalse()
    })
    it('should check by an identifer and network if the protocol is active', async () => {
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })

      await service.init({
        passiveProtocols: [await createV0TezosProtocol()],
        activeProtocols: [tezosTestnetProtocol],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        activeSubProtocols: [[tezosTestnetProtocol, await createV0TezosTzBTCProtocol({ network: tezosTestnet })]]
      })

      const isTezosActive = await service.isProtocolActive(MainProtocolSymbols.XTZ)
      const isTezosTestnetActive = await service.isProtocolActive(MainProtocolSymbols.XTZ, tezosTestnetV0)

      const isTzBTCActive = await service.isProtocolActive(SubProtocolSymbols.XTZ_BTC)
      const isTzBTCTestnetActive = await service.isProtocolActive(SubProtocolSymbols.XTZ_BTC, tezosTestnetV0)

      expect(isTezosActive).toBeFalse()
      expect(isTezosTestnetActive).toBeTrue()

      expect(isTzBTCActive).toBeFalse()
      expect(isTzBTCTestnetActive).toBeTrue()
    })

    it('should check by an identifier and network if the protocol is supported', async () => {
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })

      await service.init({
        passiveProtocols: [await createV0TezosProtocol()],
        activeProtocols: [tezosTestnetProtocol],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        activeSubProtocols: [[tezosTestnetProtocol, await createV0TezosTzBTCProtocol({ network: tezosTestnet })]]
      })

      const isTezosActive = await service.isProtocolSupported(MainProtocolSymbols.XTZ)
      const isTezosTestnetActive = await service.isProtocolSupported(MainProtocolSymbols.XTZ, tezosTestnetV0)

      const isTzBTCActive = await service.isProtocolSupported(SubProtocolSymbols.XTZ_BTC)
      const isTzBTCTestnetActive = await service.isProtocolSupported(SubProtocolSymbols.XTZ_BTC, tezosTestnetV0)

      expect(isTezosActive).toBeTrue()
      expect(isTezosTestnetActive).toBeTrue()

      expect(isTzBTCActive).toBeTrue()
      expect(isTzBTCTestnetActive).toBeTrue()
    })
  })

  /**************** Find Protocols ****************/

  describe('Find Protocols', () => {
    it('should find a protocol by an identifier', async () => {
      await service.init({
        activeProtocols: [await createV0AeternityProtocol()],
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]]
      })

      const foundProtocol = await service.getProtocol(MainProtocolSymbols.AE)
      const foundSubProtocol = await service.getProtocol(SubProtocolSymbols.XTZ_BTC)

      const foundProtocolIdentifier = foundProtocol ? await foundProtocol.getIdentifier() : undefined
      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined

      expect(foundProtocolIdentifier).toBe(MainProtocolSymbols.AE)
      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should find a protocol if a protocol instance is passed`', async () => {
      await service.init({
        activeProtocols: [],
        activeSubProtocols: []
      })

      const protocol = await createV0AeternityProtocol()
      const subProtocol = await createV0TezosTzBTCProtocol()

      const foundProtocol = await service.getProtocol(protocol)
      const foundSubProtocol = await service.getProtocol(subProtocol)

      expect(foundProtocol).toBe(protocol)
      expect(foundSubProtocol).toBe(subProtocol)
    })

    it('should not find a protocol by an identifier if not active', async () => {
      await service.init({
        passiveProtocols: [await createV0AeternityProtocol()],
        activeProtocols: [],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        activeSubProtocols: []
      })

      const foundProtocolPromise = service.getProtocol(MainProtocolSymbols.AE)
      const foundSubProtocolPromise = service.getProtocol(SubProtocolSymbols.XTZ_BTC)

      await expectAsync(foundProtocolPromise).toBeRejectedWithError(undefined, 'Protocol ae not supported')
      await expectAsync(foundSubProtocolPromise).toBeRejectedWithError(undefined, 'Protocol xtz-btc not supported')
    })

    it('should find a passive protocol by an identifier if specified', async () => {
      await service.init({
        passiveProtocols: [await createV0AeternityProtocol()],
        activeProtocols: [],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        activeSubProtocols: []
      })

      const foundProtocol = await service.getProtocol(MainProtocolSymbols.AE, undefined, false)
      const foundSubProtocol = await service.getProtocol(SubProtocolSymbols.XTZ_BTC, undefined, false)

      const foundProtocolIdentifier = foundProtocol ? await foundProtocol.getIdentifier() : undefined
      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined

      expect(foundProtocolIdentifier).toBe(MainProtocolSymbols.AE)
      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should find a protocol by an identifier and network', async () => {
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })

      await service.init({
        activeProtocols: [await createV0TezosProtocol(), tezosTestnetProtocol],
        activeSubProtocols: [
          [await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()],
          [tezosTestnetProtocol, await createV0TezosTzBTCProtocol({ network: tezosTestnet })]
        ]
      })

      const foundProtocol = await service.getProtocol(MainProtocolSymbols.XTZ, tezosTestnetV0)
      const foundSubProtocol = await service.getProtocol(SubProtocolSymbols.XTZ_BTC, tezosTestnetV0)

      const foundProtocolIdentifier = foundProtocol ? await foundProtocol.getIdentifier() : undefined
      const foundProtocolOptions = foundProtocol ? await foundProtocol.getOptions() : undefined

      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined
      const foundSubProtocolOptions = foundSubProtocol ? await foundSubProtocol.getOptions() : undefined

      expect(foundProtocolIdentifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundProtocolOptions.network.identifier).toEqual(tezosTestnetV0.identifier)

      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocolOptions.network.identifier).toEqual(tezosTestnetV0.identifier)
    })

    it('should find a protocol by protocol and network identifier', async () => {
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })

      await service.init({
        activeProtocols: [await createV0TezosProtocol(), tezosTestnetProtocol],
        activeSubProtocols: [
          [await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()],
          [tezosTestnetProtocol, await createV0TezosTzBTCProtocol({ network: tezosTestnet })]
        ]
      })

      const foundProtocol = await service.getProtocol(MainProtocolSymbols.XTZ, tezosTestnetV0.identifier)
      const foundSubProtocol = await service.getProtocol(SubProtocolSymbols.XTZ_BTC, tezosTestnetV0.identifier)

      const foundProtocolIdentifier = foundProtocol ? await foundProtocol.getIdentifier() : undefined
      const foundProtocolOptions = foundProtocol ? await foundProtocol.getOptions() : undefined

      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined
      const foundSubProtocolOptions = foundSubProtocol ? await foundSubProtocol.getOptions() : undefined

      expect(foundProtocolIdentifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundProtocolOptions.network.identifier).toEqual(tezosTestnetV0.identifier)

      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocolOptions.network.identifier).toEqual(tezosTestnetV0.identifier)
    })

    it('should find a protocol by an identifier if network does not match by falling back to default network', async () => {
      await service.init({
        activeProtocols: [await createV0TezosProtocol()],
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]]
      })

      const foundProtocol = await service.getProtocol(MainProtocolSymbols.XTZ, tezosTestnetV0)
      const foundSubProtocol = await service.getProtocol(SubProtocolSymbols.XTZ_BTC, tezosTestnetV0)

      const foundProtocolIdentifier = foundProtocol ? await foundProtocol.getIdentifier() : undefined
      const foundProtocolOptions = foundProtocol ? await foundProtocol.getOptions() : undefined

      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined
      const foundSubProtocolOptions = foundSubProtocol ? await foundSubProtocol.getOptions() : undefined

      expect(foundProtocolIdentifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundProtocolOptions.network.identifier).toEqual(tezosMainnetV0.identifier)

      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocolOptions.network.identifier).toEqual(tezosMainnetV0.identifier)
    })

    it('should find a sub protocol by an identifier or fall back to its main protocol', async () => {
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })

      await service.init({
        activeProtocols: [await createV0TezosProtocol(), tezosTestnetProtocol],
        activeSubProtocols: [[tezosTestnetProtocol, await createV0TezosTzBTCProtocol({ network: tezosTestnet })]]
      })

      const foundSubProtocol = await service.getProtocol(SubProtocolSymbols.XTZ_BTC, tezosTestnetV0)
      const foundFallbackMainnetProtocol = await service.getProtocol(SubProtocolSymbols.XTZ_STKR)
      const foundFallbackTestnetProtocol = await service.getProtocol(SubProtocolSymbols.XTZ_USD, tezosTestnetV0)

      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined
      const foundSubProtocolOptions = foundSubProtocol ? await foundSubProtocol.getOptions() : undefined

      const foundFallbackMainnetProtocolIdentifier = foundFallbackMainnetProtocol
        ? await foundFallbackMainnetProtocol.getIdentifier()
        : undefined
      const foundFallbackMainnetProtocolOptions = foundFallbackMainnetProtocol ? await foundFallbackMainnetProtocol.getOptions() : undefined

      const foundFallbackTestnetProtocolIdentifier = foundFallbackTestnetProtocol
        ? await foundFallbackMainnetProtocol.getIdentifier()
        : undefined
      const foundFallbackTestnetProtocolOptions = foundFallbackTestnetProtocol ? await foundFallbackTestnetProtocol.getOptions() : undefined

      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocolOptions.network.identifier).toEqual(tezosTestnetV0.identifier)

      expect(foundFallbackMainnetProtocolIdentifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundFallbackMainnetProtocolOptions.network.identifier).toEqual(tezosMainnetV0.identifier)

      expect(foundFallbackTestnetProtocolIdentifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundFallbackTestnetProtocolOptions.network.identifier).toEqual(tezosTestnetV0.identifier)
    })

    it('should find sub protocols by a main protocol identifier', async () => {
      await service.init({
        activeSubProtocols: [
          [await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()],
          [await createV0TezosProtocol(), await createV0TezosKtProtocol()]
        ],
        passiveSubProtocols: []
      })

      const foundSubProtocols = await service.getSubProtocols(MainProtocolSymbols.XTZ)
      const foundSubIdentifiers = await Promise.all(foundSubProtocols.map((protocol: ICoinSubProtocol) => protocol.getIdentifier()))

      expect(foundSubIdentifiers.length).toBe(2)
      expect(foundSubIdentifiers.sort()).toEqual([SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_KT].sort())
    })

    it('should not find passive sub protocols by a main identifier if not active', async () => {
      await service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]]
      })

      const foundSubProtocols = await service.getSubProtocols(MainProtocolSymbols.XTZ)

      expect(foundSubProtocols.length).toBe(0)
    })

    it('should find passive sub protocols by a main identifier if specified', async () => {
      await service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]]
      })

      const foundSubProtocols = await service.getSubProtocols(MainProtocolSymbols.XTZ, undefined, false)

      expect(foundSubProtocols.length).toBe(1)
      expect(await foundSubProtocols[0].getIdentifier()).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should find sub protocols by a main identifier and network', async () => {
      await service.init({
        activeSubProtocols: [
          [await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()],
          [await createV0TezosProtocol({ network: tezosTestnet }), await createV0TezosTzBTCProtocol({ network: tezosTestnet })]
        ],
        passiveSubProtocols: []
      })

      const foundSubProtocols = await service.getSubProtocols(MainProtocolSymbols.XTZ, tezosTestnetV0)

      expect(foundSubProtocols.length).toBe(1)
      expect(await foundSubProtocols[0].getIdentifier()).toBe(SubProtocolSymbols.XTZ_BTC)
      expect((await foundSubProtocols[0].getOptions()).network.identifier).toEqual(tezosTestnetV0.identifier)
    })

    it('should find a sub protocol by main protocol and network identifiers', async () => {
      await service.init({
        activeSubProtocols: [
          [await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()],
          [await createV0TezosProtocol({ network: tezosTestnet }), await createV0TezosTzBTCProtocol({ network: tezosTestnet })]
        ],
        passiveSubProtocols: []
      })

      const foundSubProtocols = await service.getSubProtocols(MainProtocolSymbols.XTZ, tezosTestnetV0.identifier)

      expect(foundSubProtocols.length).toBe(1)
      expect(await foundSubProtocols[0].getIdentifier()).toBe(SubProtocolSymbols.XTZ_BTC)
      expect((await foundSubProtocols[0].getOptions()).network.identifier).toEqual(tezosTestnetV0.identifier)
    })

    it('should not find a sub protocol by a main identifier if network does not match', async () => {
      await service.init({
        activeSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]],
        passiveSubProtocols: []
      })

      const foundSubProtocols = await service.getSubProtocols(MainProtocolSymbols.XTZ, tezosTestnetV0)

      expect(foundSubProtocols.length).toBe(0)
    })
  })

  /**************** Add Protocols ****************/

  describe('Add Protocols', () => {
    it('should add new active main protocol', async () => {
      const tezosProtocol = await createV0TezosProtocol()
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })
      const cosmosProtocol = await createV0CosmosProtocol()

      const tezosBTCProtocol = await createV0TezosTzBTCProtocol()

      await service.init({
        activeProtocols: [tezosProtocol],
        activeSubProtocols: [[tezosProtocol, tezosBTCProtocol]]
      })

      await service.addActiveMainProtocols(tezosTestnetProtocol)
      await service.addActiveProtocols(cosmosProtocol)

      const protocols = [tezosProtocol, tezosTestnetProtocol, cosmosProtocol, tezosBTCProtocol]
      for (const protocol of protocols) {
        const found = await service.getProtocol(await protocol.getIdentifier(), (await protocol.getOptions()).network.identifier)
        expect(found).toBe(protocol)
      }
    })

    it('should add new active main protocols', async () => {
      const tezosProtocol = await createV0TezosProtocol()
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })
      const cosmosProtocol = await createV0CosmosProtocol()
      const polkadotProtocol = await createV0PolkadotProtocol()
      const kusamaProtocol = await createV0KusamaProtocol()

      const tezosBTCProtocol = await createV0TezosTzBTCProtocol()

      await service.init({
        activeProtocols: [tezosProtocol],
        activeSubProtocols: [[tezosProtocol, tezosBTCProtocol]]
      })

      await service.addActiveMainProtocols([tezosTestnetProtocol, cosmosProtocol])
      await service.addActiveProtocols([polkadotProtocol, kusamaProtocol])

      const protocols = [tezosProtocol, tezosTestnetProtocol, cosmosProtocol, polkadotProtocol, kusamaProtocol, tezosBTCProtocol]
      for (const protocol of protocols) {
        const found = await service.getProtocol(await protocol.getIdentifier(), (await protocol.getOptions()).network.identifier)
        expect(found).toBe(protocol)
      }
    })

    it('should add new active sub protocol', async () => {
      const tezosProtocol = await createV0TezosProtocol()

      const tezosBTCProtocol = await createV0TezosTzBTCProtocol()
      const tezosUSDProtocol = await createV0TezosUSDTezProtocol()
      const tezosETHProtocol = await createV0TezosETHTezProtocol()

      await service.init({
        activeProtocols: [tezosProtocol],
        activeSubProtocols: [[tezosProtocol, tezosBTCProtocol]]
      })

      await service.addActiveSubProtocols(tezosUSDProtocol)
      await service.addActiveProtocols(tezosETHProtocol)

      const protocols = [tezosProtocol, tezosBTCProtocol, tezosUSDProtocol, tezosETHProtocol]
      for (const protocol of protocols) {
        const found = await service.getProtocol(await protocol.getIdentifier(), (await protocol.getOptions()).network.identifier)
        expect(found).toBe(protocol)
      }
    })

    it('should add new active sub protocols', async () => {
      const tezosProtocol = await createV0TezosProtocol()

      const tezosBTCProtocol = await createV0TezosTzBTCProtocol()
      const tezosUSDProtocol = await createV0TezosUSDTezProtocol()
      const tezosETHProtocol = await createV0TezosETHTezProtocol()
      const tezosUUSDProtocol = await createV0TezosUUSDProtocol()
      const tezosKtProtocol = await createV0TezosKtProtocol()

      await service.init({
        activeProtocols: [tezosProtocol],
        activeSubProtocols: [[tezosProtocol, tezosBTCProtocol]]
      })

      await service.addActiveSubProtocols([tezosUSDProtocol, tezosETHProtocol])
      await service.addActiveProtocols([tezosUUSDProtocol, tezosKtProtocol])

      const protocols = [tezosProtocol, tezosBTCProtocol, tezosUSDProtocol, tezosETHProtocol, tezosUUSDProtocol, tezosKtProtocol]
      for (const protocol of protocols) {
        console.log('identifier', protocol.identifier)
        const found = await service.getProtocol(await protocol.getIdentifier(), (await protocol.getOptions()).network.identifier)
        expect(found).toBe(protocol)
      }
    })

    it('should add new active protocols', async () => {
      const tezosProtocol = await createV0TezosProtocol()
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })

      const tezosBTCProtocol = await createV0TezosTzBTCProtocol()
      const tezosUSDProtocol = await createV0TezosUSDTezProtocol()

      await service.init({
        activeProtocols: [tezosProtocol],
        activeSubProtocols: [[tezosProtocol, tezosBTCProtocol]]
      })

      await service.addActiveProtocols([tezosTestnetProtocol, tezosUSDProtocol])

      const protocols = [tezosProtocol, tezosTestnetProtocol, tezosBTCProtocol, tezosUSDProtocol]
      for (const protocol of protocols) {
        const found = await service.getProtocol(await protocol.getIdentifier(), (await protocol.getOptions()).network.identifier)
        expect(found).toBe(protocol)
      }
    })
  })

  /**************** Remove Protocols ****************/

  describe('Remove Protocols', () => {
    it('should remove protocols by identifiers', async () => {
      const tezosProtocol = await createV0TezosProtocol()
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })

      const ethereumProtocol = await createV0EthereumProtocol()

      await service.init({
        activeProtocols: [tezosProtocol, tezosTestnetProtocol, ethereumProtocol],
        passiveProtocols: [await createV0BitcoinProtocol(), await createV0CosmosProtocol()],
        activeSubProtocols: [
          [tezosProtocol, await createV0TezosTzBTCProtocol()],
          [tezosTestnetProtocol, await createV0TezosTzBTCProtocol({ network: tezosTestnet })],
          [tezosProtocol, await createV0TezosStakerProtocol()],
          [
            ethereumProtocol,
            await createV0EthereumERC20Token({
              name: 'ERC20_1',
              identifier: 'eth-erc20_1',
              symbol: 'ERC20_1',
              marketSymbol: 'ERC20_1',
              contractAddress: '',
              decimals: 18
            })
          ]
        ],
        passiveSubProtocols: [
          [tezosProtocol, await createV0TezosUSDTezProtocol()],
          [tezosTestnetProtocol, await createV0TezosQuipuswapProtocol({ network: tezosTestnet })],
          [
            ethereumProtocol,
            await createV0EthereumERC20Token({
              name: 'ERC20_2',
              identifier: 'eth-erc20_2',
              symbol: 'ERC20_2',
              marketSymbol: 'ERC20_2',
              contractAddress: '',
              decimals: 18
            })
          ],
          [
            ethereumProtocol,
            await createV0EthereumERC20Token({
              name: 'ERC20_3',
              identifier: 'eth-erc20_3',
              symbol: 'ERC20_3',
              marketSymbol: 'ERC20_3',
              contractAddress: '',
              decimals: 18
            })
          ]
        ]
      })

      await service.removeProtocols([MainProtocolSymbols.XTZ, MainProtocolSymbols.COSMOS, 'eth-erc20_2' as SubProtocolSymbols])

      const supportedIdentifiers = await getIdentifiers(await service.getSupportedProtocols())

      const activeIdentifiers = await getIdentifiers(await service.getActiveProtocols())
      const passiveIdentifiers = await getIdentifiers(await service.getPassiveProtocols())

      const supportedSubIdentifiers = await getSubIdentifiers(await service.getSupportedSubProtocols())

      const activeSubIdentifiers = await getSubIdentifiers(await service.getActiveSubProtocols())
      const passiveSubIdentifiers = await getSubIdentifiers(await service.getPassiveSubProtocols())

      const expectedActiveIdentifiers = [MainProtocolSymbols.ETH]
      const expectedPassiveIdentifiers = [MainProtocolSymbols.BTC]

      const expectedActiveSubIdentifiers = ['eth-erc20_1' as SubProtocolSymbols]
      const expectedPassiveSubIdentifiers = ['eth-erc20_3' as SubProtocolSymbols]

      expect(supportedIdentifiers.sort()).toEqual(expectedActiveIdentifiers.concat(expectedPassiveIdentifiers).sort())

      expect(activeIdentifiers.sort()).toEqual(expectedActiveIdentifiers.sort())
      expect(passiveIdentifiers.sort()).toEqual(expectedPassiveIdentifiers.sort())

      expect(supportedSubIdentifiers.sort()).toEqual(expectedActiveSubIdentifiers.concat(expectedPassiveSubIdentifiers).sort())

      expect(activeSubIdentifiers.sort()).toEqual(expectedActiveSubIdentifiers.sort())
      expect(passiveSubIdentifiers.sort()).toEqual(expectedPassiveSubIdentifiers.sort())
    })
  })

  /**************** Utils ****************/

  describe('Utils', () => {
    it('should find networks for the requested protocol by its identifier', async () => {
      const tezosProtocol = await createV0TezosProtocol()
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })

      await service.init({
        activeProtocols: [tezosProtocol, tezosTestnetProtocol],
        activeSubProtocols: [
          [tezosProtocol, await createV0TezosTzBTCProtocol()],
          [tezosTestnetProtocol, await createV0TezosTzBTCProtocol({ network: tezosTestnet })]
        ]
      })

      const foundNetworksForMain = await service.getNetworksForProtocol(MainProtocolSymbols.XTZ)
      const foundNetworksForSub = await service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC)

      const foundForMainIdentifiers = foundNetworksForMain.map((network: ProtocolNetwork) => network.identifier)
      const foundForSubIdentifiers = foundNetworksForSub.map((network: ProtocolNetwork) => network.identifier)

      const tezosProtocolOptions = await tezosProtocol.getOptions()
      const tezosTestnetProtocolOptions = await tezosTestnetProtocol.getOptions()

      expect(foundForMainIdentifiers.sort()).toEqual(
        [tezosProtocolOptions.network.identifier, tezosTestnetProtocolOptions.network.identifier].sort()
      )
      expect(foundForSubIdentifiers.sort()).toEqual(
        [tezosProtocolOptions.network.identifier, tezosTestnetProtocolOptions.network.identifier].sort()
      )
    })

    it('should not find networks for the requested protocol by its identifier if not active', async () => {
      await service.init({
        activeProtocols: [],
        passiveProtocols: [await createV0TezosProtocol()],
        activeSubProtocols: [],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]]
      })

      const foundNetworksForMain = await service.getNetworksForProtocol(MainProtocolSymbols.XTZ)
      const foundNetworksForSub = await service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC)

      expect(foundNetworksForMain.length).toBe(0)
      expect(foundNetworksForSub.length).toBe(0)
    })

    it('should find networks for the requested passive protocol by its identifier if specified', async () => {
      const tezosProtocol = await createV0TezosProtocol()
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })

      await service.init({
        activeProtocols: [tezosProtocol],
        passiveProtocols: [tezosTestnetProtocol],
        activeSubProtocols: [[tezosProtocol, await createV0TezosTzBTCProtocol()]],
        passiveSubProtocols: [[tezosTestnetProtocol, await createV0TezosTzBTCProtocol({ network: tezosTestnet })]]
      })

      const foundNetworksForMain = await service.getNetworksForProtocol(MainProtocolSymbols.XTZ, false)
      const foundNetworksForSub = await service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC, false)

      const foundForMainIdentifiers = foundNetworksForMain.map((network: ProtocolNetwork) => network.identifier)
      const foundForSubIdentifiers = foundNetworksForSub.map((network: ProtocolNetwork) => network.identifier)

      const tezosProtocolOptions = await tezosProtocol.getOptions()
      const tezosTestnetProtocolOptions = await tezosTestnetProtocol.getOptions()

      expect(foundForMainIdentifiers.sort()).toEqual(
        [tezosProtocolOptions.network.identifier, tezosTestnetProtocolOptions.network.identifier].sort()
      )
      expect(foundForSubIdentifiers.sort()).toEqual(
        [tezosProtocolOptions.network.identifier, tezosTestnetProtocolOptions.network.identifier].sort()
      )
    })

    it('should find network for the requested protocol by identifiers', async () => {
      const tezosProtocol = await createV0TezosProtocol()
      const tezosTzBTCTestnetProtocol = await createV0TezosTzBTCProtocol({ network: tezosTestnet })

      await service.init({
        activeProtocols: [tezosProtocol, tezosTzBTCTestnetProtocol],
        activeSubProtocols: [
          [tezosProtocol, await createV0TezosTzBTCProtocol()],
          [await createV0TezosProtocol({ network: tezosTestnet }), tezosTzBTCTestnetProtocol]
        ]
      })

      const tezosProtocolOptions = await tezosProtocol.getOptions()
      const tezosTestnetProtocolOptions = await tezosTzBTCTestnetProtocol.getOptions()

      const foundNetworkForMain = await service.getNetworkForProtocol(MainProtocolSymbols.XTZ, tezosProtocolOptions.network.identifier)
      const foundNetworkForSub = await service.getNetworkForProtocol(
        SubProtocolSymbols.XTZ_BTC,
        tezosTestnetProtocolOptions.network.identifier
      )

      expect(foundNetworkForMain).toEqual(tezosProtocolOptions.network)
      expect(foundNetworkForSub).toEqual(tezosTestnetProtocolOptions.network)
    })

    it('should not find network for the requested protocol by identifiers if not active', async () => {
      const tezosProtocol = await createV0TezosProtocol()

      await service.init({
        activeProtocols: [],
        passiveProtocols: [await createV0TezosProtocol()],
        activeSubProtocols: [],
        passiveSubProtocols: [[await createV0TezosProtocol(), await createV0TezosTzBTCProtocol()]]
      })

      const tezosProtocolOptions = await tezosProtocol.getOptions()

      const foundNetworkForMain = await service.getNetworkForProtocol(MainProtocolSymbols.XTZ, tezosProtocolOptions.network.identifier)
      const foundNetworkForSub = await service.getNetworkForProtocol(SubProtocolSymbols.XTZ_BTC, tezosProtocolOptions.network.identifier)

      expect(foundNetworkForMain).toBeUndefined()
      expect(foundNetworkForSub).toBeUndefined()
    })

    it('should find networks for the requested passive protocol by its identifier if specified', async () => {
      const tezosProtocol = await createV0TezosProtocol()
      const tezosTestnetProtocol = await createV0TezosProtocol({ network: tezosTestnet })
      const tezosTzBTCTestnetProtocol = await createV0TezosTzBTCProtocol({ network: tezosTestnet })

      await service.init({
        activeProtocols: [tezosProtocol],
        passiveProtocols: [tezosTestnetProtocol],
        activeSubProtocols: [[tezosProtocol, await createV0TezosTzBTCProtocol()]],
        passiveSubProtocols: [[tezosTestnetProtocol, tezosTzBTCTestnetProtocol]]
      })

      const tezosTestnetProtocolOptions = await tezosTestnetProtocol.getOptions()
      const tezosTzBTCTestnetProtocolOptions = await tezosTzBTCTestnetProtocol.getOptions()

      const foundNetworkForMain = await service.getNetworkForProtocol(
        MainProtocolSymbols.XTZ,
        tezosTzBTCTestnetProtocolOptions.network.identifier,
        false
      )
      const foundNetworkForSub = await service.getNetworkForProtocol(
        SubProtocolSymbols.XTZ_BTC,
        tezosTzBTCTestnetProtocolOptions.network.identifier,
        false
      )

      expect(foundNetworkForMain).toEqual(tezosTestnetProtocolOptions.network)
      expect(foundNetworkForSub).toEqual(tezosTzBTCTestnetProtocolOptions.network)
    })

    const validAddresses: { protocol: MainProtocolSymbols; address: string }[] = [
      { protocol: MainProtocolSymbols.AE, address: 'ak_2eid5UDLCVxNvqL95p9UtHmHQKbiFQahRfoo839DeQuBo8A3Qc' },
      { protocol: MainProtocolSymbols.AE, address: 'ak_gxMtcfvnd7aN9XdpmdNgRRETnLL4TNQ4uJgyLzcbBFa3vx6Da' },
      { protocol: MainProtocolSymbols.AE, address: 'ak_2AAv366zYCwPidLKUwbtGfzPCeT956ncSXdFU36imYRf98G355' },
      { protocol: MainProtocolSymbols.BTC, address: '1JQkRgFPe52LpC9RvakKtxgwpBumeUWj4m' },
      { protocol: MainProtocolSymbols.BTC, address: '1HJSw16RjLRP8uQFLGkZrSossWLNqEeUJK' },
      { protocol: MainProtocolSymbols.BTC, address: '1Wq2bExhV6JECE5AdXH1SYtqP7LPMeCaM' },
      { protocol: MainProtocolSymbols.COSMOS, address: 'cosmos1wypycx8nn7w8dzvcvxjqd0kpurppee0mnvzjsm' },
      { protocol: MainProtocolSymbols.COSMOS, address: 'cosmos1e6q8nm5uzaansf3ajhgxc9rep37qtjfrw3lyf7' },
      { protocol: MainProtocolSymbols.COSMOS, address: 'cosmos1qr98pnv0fepkkhppm7hscjnghydwlx0gqsaqer' },
      { protocol: MainProtocolSymbols.ETH, address: '0xfd9eeCb127677B1f931D6d49Dfe6626Ffe60370f' },
      { protocol: MainProtocolSymbols.ETH, address: '0xd709a66264b4055EC23E2Af8B13D06a6375Bb24c' },
      { protocol: MainProtocolSymbols.ETH, address: '0x8afD5b4DCA53dA1d3a91E9Dc8a397172079f7F22' },
      { protocol: MainProtocolSymbols.GRS, address: 'FjyizqnJS13uTXpq3SsEmA3qc22JriienG' },
      { protocol: MainProtocolSymbols.GRS, address: 'FkPxwoFcgf16MpYka596GK3HV4SSiAPanR' },
      { protocol: MainProtocolSymbols.GRS, address: 'FhR2W9bMKYxF4kMUPhWLwvimBnfvivDgzV' },
      { protocol: MainProtocolSymbols.KUSAMA, address: 'DiuzR5nbxyQwSPXj18X8Df5Mrd23CiCz9VSABHji81aDsxS' },
      { protocol: MainProtocolSymbols.KUSAMA, address: 'HP86G4tcaaAtYofWr86DcTwWZnQszxcjt2m5ngeACshSARs' },
      { protocol: MainProtocolSymbols.KUSAMA, address: 'Evj4wWunCJZkeffd2L8mroY18nZp7PXVkC96gfYCsCTvuaN' },
      { protocol: MainProtocolSymbols.POLKADOT, address: '12QceCDMHcK6qgnxLJsMBQPLAA6iX8WCuSx7dChcsNNnBtKg' },
      { protocol: MainProtocolSymbols.POLKADOT, address: '16MaRzy6tnR6Z6meZcgw4UiHPYfQFcUzaHgihs7QU4g7jpCV' },
      { protocol: MainProtocolSymbols.POLKADOT, address: '15Q8duMjoahUpZbUqAhccz72LbE4C6muqQEeK9SGGsj3UZHG' },
      { protocol: MainProtocolSymbols.XTZ, address: 'tz1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7' },
      { protocol: MainProtocolSymbols.XTZ, address: 'tz1Mj7RzPmMAqDUNFBn5t5VbXmWW4cSUAdtT' },
      { protocol: MainProtocolSymbols.XTZ, address: 'tz1XUngmFmSzeHRsFDsb4W5EkPEHtCmEPspH' }
    ]

    const invalidAddresses: { protocol: MainProtocolSymbols; address: string }[] = [
      { protocol: MainProtocolSymbols.AE, address: '' },
      { protocol: MainProtocolSymbols.AE, address: '2eid5UDLCVxNvqL95p9UtHmHQKbiFQahRfoo839DeQuBo8A3Qc' },
      { protocol: MainProtocolSymbols.AE, address: 'ak_gxMtcfvnd7aN9XdpmdNgRRETnLL4TNQ4uJgyL' },
      { protocol: MainProtocolSymbols.AE, address: 'ak_2AAv366zYCwPidLKUwbtGfzPCeT956ncSXdFU36imYRf98G35523fsdte' },
      { protocol: MainProtocolSymbols.BTC, address: '' },
      { protocol: MainProtocolSymbols.BTC, address: 'JQkRgFPe52LpC9RvakKtxgwpBumeUWj4mJQkRgF' },
      { protocol: MainProtocolSymbols.BTC, address: '1Wq2bExhV6JECE5Ad' },
      { protocol: MainProtocolSymbols.BTC, address: '1IWq2bExhV6JECE5AdXH1SYtqP7LPMeCaM' },
      { protocol: MainProtocolSymbols.COSMOS, address: '' },
      { protocol: MainProtocolSymbols.COSMOS, address: '1wypycx8nn7w8dzvcvxjqd0kpurppee0mnvzjsm1wypyc' },
      { protocol: MainProtocolSymbols.COSMOS, address: 'cosmos1e6q8nm5uzaansf3ajhgxc9rep37qtjfrw3lyf7a' },
      { protocol: MainProtocolSymbols.COSMOS, address: 'cosmos1qr98pnv0fepkkhppm7hscjnghydwlx0gqsaqe' },
      { protocol: MainProtocolSymbols.ETH, address: '' },
      { protocol: MainProtocolSymbols.ETH, address: 'fd9eeCb127677B1f931D6d49Dfe6626Ffe60370ffd' },
      { protocol: MainProtocolSymbols.ETH, address: '0xd709a66264b4055EC23E2Af8B13D06a6375Bb24Z' },
      { protocol: MainProtocolSymbols.ETH, address: '0x8afD5b4DCA53dA1d3a91E9Dc8a397172079f7F22a' },
      { protocol: MainProtocolSymbols.ETH, address: '0x8afD5b4DCA53dA1d3a91E9Dc8a397172079f7F2' },
      { protocol: MainProtocolSymbols.GRS, address: '' },
      { protocol: MainProtocolSymbols.GRS, address: 'jyizqnJS13uTXpq3SsEmA3qc22JriienG' },
      { protocol: MainProtocolSymbols.GRS, address: 'FkPxwoFcgf16MpYka596GK3HV4SSiAPanR3' },
      { protocol: MainProtocolSymbols.GRS, address: 'FhR2W9bMKYxF4kMUPhWLwvimBnfvivDgz' },
      { protocol: MainProtocolSymbols.KUSAMA, address: '' },
      { protocol: MainProtocolSymbols.KUSAMA, address: 'AiuzR5nbxyQwSPXj18X8Df5Mrd23CiCz9VSABHji81aDsxS' },
      { protocol: MainProtocolSymbols.KUSAMA, address: 'H0P86G4tcaaAtYofWr86DcTwWZnQszxcjt2m5ngeACshSAR' },
      { protocol: MainProtocolSymbols.POLKADOT, address: '' },
      { protocol: MainProtocolSymbols.POLKADOT, address: '32QceCDMHcK6qgnxLJsMBQPLAA6iX8WCuSx7dChcsNNnBtKg' },
      { protocol: MainProtocolSymbols.POLKADOT, address: '1l6MaRzy6tnR6Z6meZcgw4UiHPYfQFcUzaHgihs7QU4g7jpCV' },
      { protocol: MainProtocolSymbols.XTZ, address: '' },
      { protocol: MainProtocolSymbols.XTZ, address: 'zt1d75oB6T4zUMexzkr5WscGktZ1Nss1JrT7' },
      { protocol: MainProtocolSymbols.XTZ, address: 'tz1Mj7RzPmMAqDUNFBn5t5VbXmWW4cSUAdtT1' },
      { protocol: MainProtocolSymbols.XTZ, address: 'tz1XUngmFmSzeHRsFDsb4W5EkPEHtCmEPsp' }
    ]

    it('should recognize if the address is valid for the specified protocol', async () => {
      await service.init()

      const allValid: boolean = (
        await Promise.all(validAddresses.map((entry) => service.isAddressOfProtocol(entry.protocol, entry.address)))
      ).reduce((all, next) => all && next, true)

      const allInvalid: boolean = (
        await Promise.all(invalidAddresses.map((entry) => service.isAddressOfProtocol(entry.protocol, entry.address)))
      ).reduce((all, next) => all && !next, true)

      expect(allValid).toBe(true, 'allValid')
      expect(allInvalid).toBe(true, 'allInvalid')
    })

    it('should return an array of protocols for which the address is valid', async () => {
      await service.init()

      const expectedWithActual: [ICoinProtocol, ICoinProtocol[]][] = await Promise.all(
        validAddresses.map(
          async (entry) =>
            [await service.getProtocol(entry.protocol), await service.getProtocolsForAddress(entry.address)] as [
              ICoinProtocol,
              ICoinProtocol[]
            ]
        )
      )

      const matches: boolean = expectedWithActual.reduce(
        (all: boolean, next: [ICoinProtocol, ICoinProtocol[]]) => all && next[1].includes(next[0]),
        true
      )

      expect(matches).toBeTrue()
    })
  })
})
