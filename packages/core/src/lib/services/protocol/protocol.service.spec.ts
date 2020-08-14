/* eslint-disable max-lines */
import { TestBed } from '@angular/core/testing'

import {
  AeternityProtocol,
  BitcoinProtocol,
  TezosProtocol,
  TezosUSD,
  TezosBTC,
  CosmosProtocol,
  TezosStaker,
  TezosStakerProtocolConfig,
  TezosFAProtocolOptions,
  TezosProtocolNetwork,
  TezblockBlockExplorer,
  TezosProtocolNetworkExtras,
  TezosProtocolOptions,
  TezosUSDProtocolConfig,
  TezosBTCProtocolConfig,
  TezosKtProtocol,
  ICoinSubProtocol
} from 'airgap-coin-lib'
import { MainProtocolSymbols, SubProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { NetworkType, ProtocolNetwork } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { removeDuplicates } from '../../utils/array/remove-duplicates'
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

  let tezosTestnet: TezosProtocolNetwork

  let defaultActiveIdentifiers: MainProtocolSymbols[]
  let defaultPassiveIdentifiers: MainProtocolSymbols[]
  let defaultActiveSubIdentifiers: SubProtocolSymbols[]
  let defaultPassiveSubIdentifiers: SubProtocolSymbols[]

  beforeAll(() => {
    defaultActiveIdentifiers = removeDuplicates(getIdentifiers(getDefaultActiveProtocols()) as MainProtocolSymbols[])
    defaultPassiveIdentifiers = removeDuplicates(getIdentifiers(getDefaultPassiveProtocols()) as MainProtocolSymbols[])
    defaultActiveSubIdentifiers = removeDuplicates(getSubIdentifiers(getDefaultActiveSubProtocols()) as SubProtocolSymbols[])
    defaultPassiveSubIdentifiers = removeDuplicates(getSubIdentifiers(getDefaultPassiveSubProtocols()) as SubProtocolSymbols[])
  })

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(ProtocolService)

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

  /**
   * Init
   */

  describe('Init', () => {
    function makeInitializationTest(
      description: string,
      createConfig: () => ProtocolServiceConfig,
      createExpected: () => {
        passiveIdentifiers: MainProtocolSymbols[]
        activeIdentifiers: MainProtocolSymbols[]
        passiveSubIdentifiers: SubProtocolSymbols[]
        activeSubIdentifiers: SubProtocolSymbols[]
      }
    ): void {
      it(description, () => {
        const config = createConfig()
        const expected = createExpected()

        service.init(config)

        const supportedIdentifiers = getIdentifiers(service.supportedProtocols)
        const supportedSubIdentifiers = getSubIdentifiers(service.supportedSubProtocols)

        const activeIdentifiers = getIdentifiers(service.activeProtocols)
        const passiveIdentifiers = getIdentifiers(service.passiveProtocols)

        const activeSubIdentifiers = getSubIdentifiers(service.activeSubProtocols)
        const passiveSubIdentifiers = getSubIdentifiers(service.passiveSubProtocols)

        expect(service.isInitialized).toBeTrue()

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
      () => ({}),
      () => ({
        passiveIdentifiers: defaultPassiveIdentifiers,
        activeIdentifiers: defaultActiveIdentifiers,
        passiveSubIdentifiers: defaultPassiveSubIdentifiers,
        activeSubIdentifiers: defaultActiveSubIdentifiers
      })
    )

    it('should throw an error when not initialized', () => {
      expect(service.isInitialized).toBeFalse()

      try {
        // eslint-disable-next-line no-unused-expressions
        service.supportedProtocols
      } catch (error) {
        expect(error.toString()).toEqual('Error: ProtocolService not initialized yet. Call `init` first.')
      }

      try {
        // eslint-disable-next-line no-unused-expressions
        service.supportedSubProtocols
      } catch (error) {
        expect(error.toString()).toEqual('Error: ProtocolService not initialized yet. Call `init` first.')
      }

      try {
        // eslint-disable-next-line no-unused-expressions
        service.activeProtocols
      } catch (error) {
        expect(error.toString()).toEqual('Error: ProtocolService not initialized yet. Call `init` first.')
      }

      try {
        // eslint-disable-next-line no-unused-expressions
        service.passiveProtocols
      } catch (error) {
        expect(error.toString()).toEqual('Error: ProtocolService not initialized yet. Call `init` first.')
      }

      try {
        // eslint-disable-next-line no-unused-expressions
        service.activeSubProtocols
      } catch (error) {
        expect(error.toString()).toEqual('Error: ProtocolService not initialized yet. Call `init` first.')
      }

      try {
        // eslint-disable-next-line no-unused-expressions
        service.passiveSubProtocols
      } catch (error) {
        expect(error.toString()).toEqual('Error: ProtocolService not initialized yet. Call `init` first.')
      }
    })

    makeInitializationTest(
      'should be initialized with provided protocols',
      () => ({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [new BitcoinProtocol()],
        activeSubProtocols: [[new TezosProtocol(), new TezosUSD()]],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      }),
      () => ({
        passiveIdentifiers: [MainProtocolSymbols.AE],
        activeIdentifiers: [MainProtocolSymbols.BTC],
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_BTC],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_USD]
      })
    )

    makeInitializationTest(
      'should be initialized with provided extra protocols',
      () => ({
        extraPassiveProtocols: [new AeternityProtocol()],
        activeProtocols: [new BitcoinProtocol()], // by default every protocol is active, it needs to be overwitten for this test
        extraActiveProtocols: [new CosmosProtocol()],
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
        passiveIdentifiers: [MainProtocolSymbols.AE],
        activeIdentifiers: [MainProtocolSymbols.BTC, MainProtocolSymbols.COSMOS],
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_USD, ...defaultPassiveSubIdentifiers],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_STKR, ...defaultActiveSubIdentifiers]
      })
    )

    makeInitializationTest(
      'should remove duplicated protocols',
      () => ({
        passiveProtocols: [new AeternityProtocol(), new AeternityProtocol(), new BitcoinProtocol()],
        activeProtocols: [new BitcoinProtocol(), new CosmosProtocol(), new CosmosProtocol()],
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
        passiveIdentifiers: [MainProtocolSymbols.AE],
        activeIdentifiers: [MainProtocolSymbols.BTC, MainProtocolSymbols.COSMOS],
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_USD],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_KT]
      })
    )

    makeInitializationTest(
      'should not remove as duplicated protocols with the same identifier but different networks',
      () => ({
        passiveProtocols: [new TezosProtocol(new TezosProtocolOptions(tezosTestnet))],
        activeProtocols: [new TezosProtocol()],
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
        passiveIdentifiers: [MainProtocolSymbols.XTZ],
        activeIdentifiers: [MainProtocolSymbols.XTZ],
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_USD],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_STKR, SubProtocolSymbols.XTZ_STKR, SubProtocolSymbols.XTZ_USD]
      })
    )
  })

  /**
   * Check Protocol Status
   */

  describe('Check Protocol Status', () => {
    it('should check by an identifer if the protocol is active', () => {
      service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [new BitcoinProtocol()],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosKtProtocol()]]
      })

      const isAeternityActive = service.isProtocolActive(MainProtocolSymbols.AE)
      const isBitcoinActive = service.isProtocolActive(MainProtocolSymbols.BTC)
      const isCosmosActive = service.isProtocolActive(MainProtocolSymbols.COSMOS)

      const isTzBTCActive = service.isProtocolActive(SubProtocolSymbols.XTZ_BTC)
      const isTzKTActive = service.isProtocolActive(SubProtocolSymbols.XTZ_KT)
      const isTzUSDActive = service.isProtocolActive(SubProtocolSymbols.XTZ_USD)

      expect(isAeternityActive).toBeFalse()
      expect(isBitcoinActive).toBeTrue()
      expect(isCosmosActive).toBeFalse()

      expect(isTzBTCActive).toBeFalse()
      expect(isTzKTActive).toBeTrue()
      expect(isTzUSDActive).toBeFalse()
    })

    it('should check if the protocol is active when an instance is passed', () => {
      service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [new BitcoinProtocol()],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosKtProtocol()]]
      })

      const isAeternityActive = service.isProtocolActive(new AeternityProtocol())
      const isBitcoinActive = service.isProtocolActive(new BitcoinProtocol())
      const isCosmosActive = service.isProtocolActive(new CosmosProtocol())

      const isTzBTCActive = service.isProtocolActive(new TezosBTC())
      const isTzKTActive = service.isProtocolActive(new TezosKtProtocol())
      const isTzUSDActive = service.isProtocolActive(new TezosUSD())

      expect(isAeternityActive).toBeFalse()
      expect(isBitcoinActive).toBeTrue()
      expect(isCosmosActive).toBeFalse()

      expect(isTzBTCActive).toBeFalse()
      expect(isTzKTActive).toBeTrue()
      expect(isTzUSDActive).toBeFalse()
    })

    it('should check by an identifier if the protocol is supported', () => {
      service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [new BitcoinProtocol()],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosKtProtocol()]]
      })

      const isAeternityActive = service.isProtocolSupported(MainProtocolSymbols.AE)
      const isBitcoinActive = service.isProtocolSupported(MainProtocolSymbols.BTC)
      const isCosmosActive = service.isProtocolSupported(MainProtocolSymbols.COSMOS)

      const isTzBTCActive = service.isProtocolSupported(SubProtocolSymbols.XTZ_BTC)
      const isTzKTActive = service.isProtocolSupported(SubProtocolSymbols.XTZ_KT)
      const isTzUSDActive = service.isProtocolSupported(SubProtocolSymbols.XTZ_USD)

      expect(isAeternityActive).toBeTrue()
      expect(isBitcoinActive).toBeTrue()
      expect(isCosmosActive).toBeFalse()

      expect(isTzBTCActive).toBeTrue()
      expect(isTzKTActive).toBeTrue()
      expect(isTzUSDActive).toBeFalse()
    })

    it('should check if the protocol is supported when an instance is passed', () => {
      service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [new BitcoinProtocol()],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosKtProtocol()]]
      })

      const isAeternityActive = service.isProtocolSupported(new AeternityProtocol())
      const isBitcoinActive = service.isProtocolSupported(new BitcoinProtocol())
      const isCosmosActive = service.isProtocolSupported(new CosmosProtocol())

      const isTzBTCActive = service.isProtocolSupported(new TezosBTC())
      const isTzKTActive = service.isProtocolSupported(new TezosKtProtocol())
      const isTzUSDActive = service.isProtocolSupported(new TezosUSD())

      expect(isAeternityActive).toBeTrue()
      expect(isBitcoinActive).toBeTrue()
      expect(isCosmosActive).toBeFalse()

      expect(isTzBTCActive).toBeTrue()
      expect(isTzKTActive).toBeTrue()
      expect(isTzUSDActive).toBeFalse()
    })
    it('should check by an identifer and network if the protocol is active', () => {
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        passiveProtocols: [new TezosProtocol()],
        activeProtocols: [tezosTestnetProtocol],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]]
      })

      const isTezosActive = service.isProtocolActive(MainProtocolSymbols.XTZ)
      const isTezosTestnetActive = service.isProtocolActive(MainProtocolSymbols.XTZ, tezosTestnet)

      const isTzBTCActive = service.isProtocolActive(SubProtocolSymbols.XTZ_BTC)
      const isTzBTCTestnetActive = service.isProtocolActive(SubProtocolSymbols.XTZ_BTC, tezosTestnet)

      expect(isTezosActive).toBeFalse()
      expect(isTezosTestnetActive).toBeTrue()

      expect(isTzBTCActive).toBeFalse()
      expect(isTzBTCTestnetActive).toBeTrue()
    })

    it('should check by an identifier and network if the protocol is supported', () => {
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        passiveProtocols: [new TezosProtocol()],
        activeProtocols: [tezosTestnetProtocol],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]]
      })

      const isTezosActive = service.isProtocolSupported(MainProtocolSymbols.XTZ)
      const isTezosTestnetActive = service.isProtocolSupported(MainProtocolSymbols.XTZ, tezosTestnet)

      const isTzBTCActive = service.isProtocolSupported(SubProtocolSymbols.XTZ_BTC)
      const isTzBTCTestnetActive = service.isProtocolSupported(SubProtocolSymbols.XTZ_BTC, tezosTestnet)

      expect(isTezosActive).toBeTrue()
      expect(isTezosTestnetActive).toBeTrue()

      expect(isTzBTCActive).toBeTrue()
      expect(isTzBTCTestnetActive).toBeTrue()
    })
  })

  /**
   * Find Protocols
   */

  describe('Find Protocols', () => {
    it('should find a protocol by an identifier', () => {
      service.init({
        activeProtocols: [new AeternityProtocol()],
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundProtocol = service.getProtocol(MainProtocolSymbols.AE)
      const foundSubProtocol = service.getProtocol(SubProtocolSymbols.XTZ_BTC)

      expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.AE)
      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should find a protocol if a protocol instance is passed`', () => {
      service.init({
        activeProtocols: [],
        activeSubProtocols: []
      })

      const protocol = new AeternityProtocol()
      const subProtocol = new TezosBTC()

      const foundProtocol = service.getProtocol(protocol)
      const foundSubProtocol = service.getProtocol(subProtocol)

      expect(foundProtocol).toBe(protocol)
      expect(foundSubProtocol).toBe(subProtocol)
    })

    it('should not find a protocol by an identifier if not active', () => {
      service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: []
      })

      const foundProtocol = service.getProtocol(MainProtocolSymbols.AE)
      const foundSubProtocol = service.getProtocol(SubProtocolSymbols.XTZ_BTC)

      expect(foundProtocol).toBeUndefined()
      expect(foundSubProtocol).toBeUndefined()
    })

    it('should find a passive protocol by an identifier if specified', () => {
      service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: []
      })

      const foundProtocol = service.getProtocol(MainProtocolSymbols.AE, undefined, false)
      const foundSubProtocol = service.getProtocol(SubProtocolSymbols.XTZ_BTC, undefined, false)

      expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.AE)
      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should find a protocol by an identifier and network', () => {
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        activeProtocols: [new TezosProtocol(), tezosTestnetProtocol],
        activeSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]
        ]
      })

      const foundProtocol = service.getProtocol(MainProtocolSymbols.XTZ, tezosTestnet)
      const foundSubProtocol = service.getProtocol(SubProtocolSymbols.XTZ_BTC, tezosTestnet)

      expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundProtocol?.options.network).toBe(tezosTestnet)

      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocol?.options.network).toBe(tezosTestnet)
    })

    it('should find a protocol by protocol and network identifier', () => {
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        activeProtocols: [new TezosProtocol(), tezosTestnetProtocol],
        activeSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]
        ]
      })

      const foundProtocol = service.getProtocol(MainProtocolSymbols.XTZ, tezosTestnet.identifier)
      const foundSubProtocol = service.getProtocol(SubProtocolSymbols.XTZ_BTC, tezosTestnet.identifier)

      expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundProtocol?.options.network).toBe(tezosTestnet)

      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocol?.options.network).toBe(tezosTestnet)
    })

    it('should not find a protocol by an identifier if network does not match', () => {
      service.init({
        activeProtocols: [new TezosProtocol()],
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundProtocol = service.getProtocol(MainProtocolSymbols.XTZ, tezosTestnet)
      const foundSubProtocol = service.getProtocol(SubProtocolSymbols.XTZ_BTC, tezosTestnet)

      expect(foundProtocol).toBeUndefined()
      expect(foundSubProtocol).toBeUndefined()
    })

    it('should find sub protocols by a main protocol identifier', () => {
      service.init({
        activeSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [new TezosProtocol(), new TezosKtProtocol()]
        ],
        passiveSubProtocols: []
      })

      const foundSubProtocols = service.getSubProtocols(MainProtocolSymbols.XTZ)
      const foundSubIdentifiers = foundSubProtocols.map((protocol: ICoinSubProtocol) => protocol.identifier)

      expect(foundSubIdentifiers.length).toBe(2)
      expect(foundSubIdentifiers.sort()).toEqual([SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_KT].sort())
    })

    it('should not find passive sub protocols by a main identifier if not active', () => {
      service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      try {
        service.getSubProtocols(MainProtocolSymbols.XTZ)
      } catch (error) {
        expect(error.toString()).toBe('Error: serializer(PROTOCOL_NOT_SUPPORTED): ')
      }
    })

    it('should find passive sub protocols by a main identifier if specified', () => {
      service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundSubProtocols = service.getSubProtocols(MainProtocolSymbols.XTZ, undefined, false)

      expect(foundSubProtocols.length).toBe(1)
      expect(foundSubProtocols[0].identifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should find sub protocols by a main identifier and network', () => {
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

      const foundSubProtocols = service.getSubProtocols(MainProtocolSymbols.XTZ, tezosTestnet)

      expect(foundSubProtocols.length).toBe(1)
      expect(foundSubProtocols[0].identifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocols[0].options.network).toBe(tezosTestnet)
    })

    it('should find a sub protocol by main protocol and network identifiers', () => {
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

      const foundSubProtocols = service.getSubProtocols(MainProtocolSymbols.XTZ, tezosTestnet.identifier)

      expect(foundSubProtocols.length).toBe(1)
      expect(foundSubProtocols[0].identifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocols[0].options.network).toBe(tezosTestnet)
    })

    it('should not find a sub protocol by a main identifier if network does not match', () => {
      service.init({
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        passiveSubProtocols: []
      })

      const foundSubProtocols = service.getSubProtocols(MainProtocolSymbols.XTZ, tezosTestnet)

      expect(foundSubProtocols.length).toBe(0)
    })
  })


  /**
   * Utils
   */

  describe('Utils', () => {
    it('should find networks for the requested protocol by its identifier', () => {
      const tezosProtocol = new TezosProtocol()
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        activeProtocols: [tezosProtocol, tezosTestnetProtocol],
        activeSubProtocols: [
          [tezosProtocol, new TezosBTC()],
          [tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]
        ]
      })

      const foundNetworksForMain = service.getNetworksForProtocol(MainProtocolSymbols.XTZ)
      const foundNetworksForSub = service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC)

      const foundForMainIdentifiers = foundNetworksForMain.map((network: ProtocolNetwork) => network.identifier)
      const foundForSubIdentifiers = foundNetworksForSub.map((network: ProtocolNetwork) => network.identifier)

      expect(foundForMainIdentifiers.sort()).toEqual(
        [tezosProtocol.options.network.identifier, tezosTestnetProtocol.options.network.identifier].sort()
      )
      expect(foundForSubIdentifiers.sort()).toEqual(
        [tezosProtocol.options.network.identifier, tezosTestnetProtocol.options.network.identifier].sort()
      )
    })

    it('should not find networks for the requested protocol by its identifier if not active', () => {
      service.init({
        activeProtocols: [],
        passiveProtocols: [new TezosProtocol()],
        activeSubProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundNetworksForMain = service.getNetworksForProtocol(MainProtocolSymbols.XTZ)
      const foundNetworksForSub = service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC)

      expect(foundNetworksForMain.length).toBe(0)
      expect(foundNetworksForSub.length).toBe(0)
    })

    it('should find networks for the requested passive protocol by its identifier if specified', () => {
      const tezosProtocol = new TezosProtocol()
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        activeProtocols: [tezosProtocol],
        passiveProtocols: [tezosTestnetProtocol],
        activeSubProtocols: [[tezosProtocol, new TezosBTC()]],
        passiveSubProtocols: [[tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]]
      })

      const foundNetworksForMain = service.getNetworksForProtocol(MainProtocolSymbols.XTZ, false)
      const foundNetworksForSub = service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC, false)

      const foundForMainIdentifiers = foundNetworksForMain.map((network: ProtocolNetwork) => network.identifier)
      const foundForSubIdentifiers = foundNetworksForSub.map((network: ProtocolNetwork) => network.identifier)

      expect(foundForMainIdentifiers.sort()).toEqual(
        [tezosProtocol.options.network.identifier, tezosTestnetProtocol.options.network.identifier].sort()
      )
      expect(foundForSubIdentifiers.sort()).toEqual(
        [tezosProtocol.options.network.identifier, tezosTestnetProtocol.options.network.identifier].sort()
      )
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
      { protocol: MainProtocolSymbols.BTC, address: '1HJSw16RjLRP8uQFLGkZrSossWLNqEeUJKJ51aS' },
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

    it('should recognize if the address is valid for the specified protocol', () => {
      service.init()

      const allValid: boolean = validAddresses
        .map((entry) => service.isAddressOfProtocol(entry.protocol, entry.address))
        .reduce((all, next) => all && next, true)

      const allInvalid: boolean = invalidAddresses
        .map((entry) => service.isAddressOfProtocol(entry.protocol, entry.address))
        .reduce((all, next) => all && !next, true)

      expect(allValid).toBeTrue()
      expect(allInvalid).toBeTrue()
    })
  })
})
