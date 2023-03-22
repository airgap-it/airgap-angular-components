/* eslint-disable max-lines */
import { TestBed } from '@angular/core/testing'

import { SubProtocolSymbols, NetworkType, ProtocolNetwork } from '@airgap/coinlib-core'
import {
  TezosBTC,
  TezosBTCProtocolConfig,
  TezosFAProtocolOptions,
  TezosKtProtocol,
  TezosProtocol,
  TezosProtocolNetwork,
  TezosProtocolOptions,
  TezosQUIPU,
  TezosStaker,
  TezosStakerProtocolConfig,
  TezosUSD,
  TezosUSDProtocolConfig
} from '@airgap/tezos'
import { getSubIdentifiers } from '../../utils/test'
import { ISOLATED_MODULES_PLUGIN } from '../../../../capacitor-plugins/injection-tokens'
import { IsolatedModules } from '../../../../capacitor-plugins/isolated-modules/isolated-modules.plugin'
import { SubProtocolStoreService, SubProtocolStoreConfig } from './sub-protocol-store.service'

describe('SubProtocolStoreService', () => {
  let service: SubProtocolStoreService

  let tezosMainnet: TezosProtocolNetwork
  let tezosTestnet: TezosProtocolNetwork

  beforeAll(() => {
    tezosMainnet = new TezosProtocolNetwork('Mainnet', NetworkType.MAINNET)
    tezosTestnet = new TezosProtocolNetwork('Testnet', NetworkType.TESTNET)
  })

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: ISOLATED_MODULES_PLUGIN, useValue: new IsolatedModules() }]
    })
    service = TestBed.inject(SubProtocolStoreService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('Init', () => {
    function makeInitializationTest(
      description: string,
      createConfig: () => SubProtocolStoreConfig,
      createExpected: () => {
        activeSubIdentifiers: SubProtocolSymbols[]
        passiveSubIdentifiers: SubProtocolSymbols[]
      }
    ): void {
      it(description, async () => {
        const config = createConfig()
        createExpected()
        const expected = createExpected()

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
      () => ({
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosUSD()]]
      }),
      () => ({
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_BTC],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_USD]
      })
    )

    makeInitializationTest(
      'should remove duplicated protocols when passed',
      () => ({
        passiveSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [new TezosProtocol(), new TezosUSD()],
          [new TezosProtocol(), new TezosUSD()]
        ],
        activeSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [new TezosProtocol(), new TezosKtProtocol()],
          [new TezosProtocol(), new TezosKtProtocol()]
        ]
      }),
      () => ({
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_USD],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_KT]
      })
    )

    makeInitializationTest(
      'should not remove as duplicated protocols with the same identifier but different networks',
      () => ({
        passiveSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [
            new TezosProtocol(new TezosProtocolOptions(tezosTestnet)),
            new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))
          ],
          [
            new TezosProtocol(new TezosProtocolOptions(tezosTestnet)),
            new TezosUSD(new TezosFAProtocolOptions(tezosTestnet, new TezosUSDProtocolConfig()))
          ]
        ],
        activeSubProtocols: [
          [new TezosProtocol(), new TezosUSD()],
          [
            new TezosProtocol(),
            new TezosStaker(
              new TezosFAProtocolOptions(
                new TezosProtocolNetwork(),
                new TezosStakerProtocolConfig(undefined, undefined, undefined, SubProtocolSymbols.XTZ_STKR)
              )
            )
          ],
          [
            new TezosProtocol(new TezosProtocolOptions(tezosTestnet)),
            new TezosStaker(
              new TezosFAProtocolOptions(
                tezosTestnet,
                new TezosStakerProtocolConfig(undefined, undefined, undefined, SubProtocolSymbols.XTZ_STKR)
              )
            )
          ]
        ]
      }),
      () => ({
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_USD],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_STKR, SubProtocolSymbols.XTZ_STKR, SubProtocolSymbols.XTZ_USD]
      })
    )

    it('should be initialized once', async () => {
      await service.init({
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosUSD()]]
      })

      await service.init({
        passiveSubProtocols: [[new TezosProtocol(), new TezosKtProtocol()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosStaker()]]
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
          [new TezosProtocol(), new TezosBTC()],
          [new TezosProtocol(), new TezosStaker()]
        ],
        passiveSubProtocols: [
          [new TezosProtocol(), new TezosUSD()],
          [new TezosProtocol(), new TezosQUIPU()]
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
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        passiveSubProtocols: []
      })

      const foundSubProtocol = await service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC)

      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined

      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should not find a sub protocol by a sub identifier if not active', async () => {
      await service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
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
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundSubProtocol = await service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, undefined, false)

      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined

      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should find a sub protocol by a sub identifier and network', async () => {
      await service.init({
        activeSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [
            new TezosProtocol(new TezosProtocolOptions(tezosTestnet)),
            new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))
          ]
        ],
        passiveSubProtocols: []
      })

      const foundSubProtocol = await service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, tezosTestnet)

      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined
      const foundSubProtocolOptions = foundSubProtocol ? await foundSubProtocol.getOptions() : undefined

      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocolOptions.network).toEqual(tezosTestnet)
    })

    it('should find a sub protocol by sub protocol and network identifiers', async () => {
      await service.init({
        activeSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [
            new TezosProtocol(new TezosProtocolOptions(tezosTestnet)),
            new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))
          ]
        ],
        passiveSubProtocols: []
      })

      const foundSubProtocol = await service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, tezosTestnet.identifier)

      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined
      const foundSubProtocolOptions = foundSubProtocol ? await foundSubProtocol.getOptions() : undefined

      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocolOptions.network).toEqual(tezosTestnet)
    })

    it('should not find a sub protocol by a sub identifier if network does not match and fall back to any matching the identifier', async () => {
      await service.init({
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        passiveSubProtocols: []
      })

      const foundSubProtocol = await service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, tezosTestnet)

      const foundSubProtocolIdentifier = foundSubProtocol ? await foundSubProtocol.getIdentifier() : undefined
      const foundSubProtocolOptions = foundSubProtocol ? await foundSubProtocol.getOptions() : undefined

      expect(foundSubProtocolIdentifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocolOptions.network).toEqual(tezosMainnet)
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
      const tezosProtocol = new TezosProtocol()
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      await service.init({
        activeSubProtocols: [
          [tezosProtocol, new TezosBTC()],
          [tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]
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
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundNetworks = await service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC)

      expect(foundNetworks.length).toBe(0)
    })

    it('should find networks for the requested passive sub protocol by its identifier if specified', async () => {
      const tezosProtocol = new TezosProtocol()
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      await service.init({
        activeSubProtocols: [[tezosProtocol, new TezosBTC()]],
        passiveSubProtocols: [[tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]]
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
