import { TestBed } from '@angular/core/testing'

import {
  TezosProtocol,
  TezosUSD,
  TezosBTC,
  TezosFAProtocolOptions,
  TezosProtocolNetwork,
  TezblockBlockExplorer,
  TezosProtocolNetworkExtras,
  TezosProtocolOptions,
  TezosUSDProtocolConfig,
  TezosBTCProtocolConfig,
  TezosKtProtocol,
  TezosStakerProtocolConfig,
  TezosStaker
} from 'airgap-coin-lib'
import { SubProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { NetworkType, ProtocolNetwork } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { getSubIdentifiers } from '../../utils/test'
import { SubProtocolStoreService, SubProtocolStoreConfig } from './sub-protocol-store.service'

describe('SubProtocolStoreService', () => {
  let service: SubProtocolStoreService

  let tezosTestnet: TezosProtocolNetwork

  beforeAll(() => {
    tezosTestnet = new TezosProtocolNetwork(
      'Testnet',
      NetworkType.TESTNET,
      undefined,
      new TezblockBlockExplorer(),
      new TezosProtocolNetworkExtras()
    )
  })

  beforeEach(() => {
    TestBed.configureTestingModule({})
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
      service.init({
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosUSD()]]
      })

      service.init({
        passiveSubProtocols: [[new TezosProtocol(), new TezosKtProtocol()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosStaker()]]
      })

      const supportedSubIdentifiers = getSubIdentifiers(service.supportedProtocols)

      const activeSubIdentifiers = getSubIdentifiers(service.activeProtocols)
      const passiveSubIdentifiers = getSubIdentifiers(service.passiveProtocols)

      const expectedPassiveSubIdentifiers = [SubProtocolSymbols.XTZ_BTC]
      const expectedActiveSubIdentifiers = [SubProtocolSymbols.XTZ_USD]

      expect(service.isInitialized).toBeTrue()

      expect(supportedSubIdentifiers.sort()).toEqual(expectedActiveSubIdentifiers.concat(expectedPassiveSubIdentifiers).sort())

      expect(activeSubIdentifiers.sort()).toEqual(expectedActiveSubIdentifiers.sort())
      expect(passiveSubIdentifiers.sort()).toEqual(expectedPassiveSubIdentifiers.sort())
    })
  })

  describe('Find Protocols', () => {
    it('should find a sub protocol by a sub protocol identifier', () => {
      service.init({
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        passiveSubProtocols: []
      })

      const foundSubProtocol = service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC)

      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should not find a sub protocol by a sub identifier if not active', () => {
      service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      try {
        service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC)
      } catch (error) {
        expect(error.toString()).toBe('Error: serializer(PROTOCOL_NOT_SUPPORTED): ')
      }
    })

    it('should find a passive protocol by a sub identifier if specified', () => {
      service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundSubProtocol = service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, undefined, false)

      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should find a sub protocol by a sub identifier and network', () => {
      service.init({
        activeSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [
            new TezosProtocol(new TezosProtocolOptions(tezosTestnet)),
            new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))
          ]
        ],
        passiveSubProtocols: []
      })

      const foundSubProtocol = service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, tezosTestnet)

      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocol?.options.network).toBe(tezosTestnet)
    })

    it('should find a sub protocol by sub protocol and network identifiers', () => {
      service.init({
        activeSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [
            new TezosProtocol(new TezosProtocolOptions(tezosTestnet)),
            new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))
          ]
        ],
        passiveSubProtocols: []
      })

      const foundSubProtocol = service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, tezosTestnet.identifier)

      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocol?.options.network).toBe(tezosTestnet)
    })

    it('should not find a sub protocol by a sub identifier if network does not match', () => {
      service.init({
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        passiveSubProtocols: []
      })

      try {
        service.getProtocolByIdentifier(SubProtocolSymbols.XTZ_BTC, tezosTestnet)
      } catch (error) {
        expect(error.toString()).toBe('Error: serializer(PROTOCOL_NOT_SUPPORTED): ')
      }
    })
  })

  describe('Utils', () => {
    const validIdentifiers: string[] = [
      SubProtocolSymbols.ETH_ERC20,
      SubProtocolSymbols.XTZ_BTC,
      SubProtocolSymbols.XTZ_KT,
      SubProtocolSymbols.XTZ_STKR,
      SubProtocolSymbols.XTZ_USD,
      'eth-erc20-$ffc',
      'eth-erc20-1wo'
    ]

    const invalidIdentifiers: string[] = [
      'qwerty',
      'abcde',
      'tzBTC',
      'tzKT',
      'tzSTKR',
      'tzUSD',
      'erc20',
    ]

    it('should check if the identifier is valid', () => {
      service.init({
        activeSubProtocols: [],
        passiveSubProtocols: []
      })

      const allValid: boolean = validIdentifiers.reduce((all: boolean, next: string) => all && service.isIdentifierValid(next), true)
      const allInvalid: boolean = invalidIdentifiers.reduce((all: boolean, next: string) => all && !service.isIdentifierValid(next), true)

      expect(allValid).toBeTrue()
      expect(allInvalid).toBeTrue()
    })

    it('should find networks for the requested sub protocol by its identifier', () => {
      const tezosProtocol = new TezosProtocol()
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        activeSubProtocols: [
          [tezosProtocol, new TezosBTC()],
          [tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]
        ],
        passiveSubProtocols: []
      })

      const foundNetworks = service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC)
      const foundNetworkIdentifiers = foundNetworks.map((network: ProtocolNetwork) => network.identifier)

      expect(foundNetworkIdentifiers.sort()).toEqual(
        [tezosProtocol.options.network.identifier, tezosTestnetProtocol.options.network.identifier].sort()
      )
    })

    it('should not find networks for the requested sub protocol by its identifier if not active', () => {
      service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundNetworks = service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC)

      expect(foundNetworks.length).toBe(0)
    })

    it('should find networks for the requested passive sub protocol by its identifier if specified', () => {
      const tezosProtocol = new TezosProtocol()
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        activeSubProtocols: [[tezosProtocol, new TezosBTC()]],
        passiveSubProtocols: [[tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]]
      })

      const foundNetworks = service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC, false)
      const foundNetworkIdentifiers = foundNetworks.map((network: ProtocolNetwork) => network.identifier)

      expect(foundNetworkIdentifiers.sort()).toEqual(
        [tezosProtocol.options.network.identifier, tezosTestnetProtocol.options.network.identifier].sort()
      )
    })
  })
})
