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
      it(description, async () => {
        const config = createConfig()
        const expected = createExpected()

        service.init(config)

        const supportedIdentifiers = getIdentifiers(await service.getSupportedProtocols())
        const supportedSubIdentifiers = getSubIdentifiers(await service.getSupportedSubProtocols())

        const activeIdentifiers = getIdentifiers(await service.getActiveProtocols())
        const passiveIdentifiers = getIdentifiers(await service.getPassiveProtocols())

        const activeSubIdentifiers = getSubIdentifiers(await service.getActiveSubProtocols())
        const passiveSubIdentifiers = getSubIdentifiers(await service.getPassiveSubProtocols())

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
      () => ({}),
      () => ({
        passiveIdentifiers: defaultPassiveIdentifiers,
        activeIdentifiers: defaultActiveIdentifiers,
        passiveSubIdentifiers: defaultPassiveSubIdentifiers,
        activeSubIdentifiers: defaultActiveSubIdentifiers
      })
    )

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
        activeProtocols: [new BitcoinProtocol()],
        extraActiveProtocols: [new CosmosProtocol()],
        passiveSubProtocols: [[new TezosProtocol(), new TezosKtProtocol()]],
        extraPassiveSubProtocols: [[new TezosProtocol(), new TezosUSD()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
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
        passiveSubIdentifiers: [SubProtocolSymbols.XTZ_KT, SubProtocolSymbols.XTZ_USD],
        activeSubIdentifiers: [SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_STKR]
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
    it('should be initialized once', async () => {
      service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [new BitcoinProtocol()],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosUSD()]]
      })

      service.init({
        passiveProtocols: [new CosmosProtocol()],
        activeProtocols: [new TezosProtocol()],
        passiveSubProtocols: [[new TezosProtocol(), new TezosKtProtocol()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosStaker()]]
      })

      const supportedIdentifiers = getIdentifiers(await service.getSupportedProtocols())
      const supportedSubIdentifiers = getSubIdentifiers(await service.getSupportedSubProtocols())

      const activeIdentifiers = getIdentifiers(await service.getActiveProtocols())
      const passiveIdentifiers = getIdentifiers(await service.getPassiveProtocols())

      const activeSubIdentifiers = getSubIdentifiers(await service.getActiveSubProtocols())
      const passiveSubIdentifiers = getSubIdentifiers(await service.getPassiveSubProtocols())

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

  /**
   * Check Protocol Status
   */

  describe('Check Protocol Status', () => {
    it('should check by an identifer if the protocol is active', async () => {
      service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [new BitcoinProtocol()],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosKtProtocol()]]
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
      service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [new BitcoinProtocol()],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosKtProtocol()]]
      })

      const isAeternityActive = await service.isProtocolActive(new AeternityProtocol())
      const isBitcoinActive = await service.isProtocolActive(new BitcoinProtocol())
      const isCosmosActive = await service.isProtocolActive(new CosmosProtocol())

      const isTzBTCActive = await service.isProtocolActive(new TezosBTC())
      const isTzKTActive = await service.isProtocolActive(new TezosKtProtocol())
      const isTzUSDActive = await service.isProtocolActive(new TezosUSD())

      expect(isAeternityActive).toBeFalse()
      expect(isBitcoinActive).toBeTrue()
      expect(isCosmosActive).toBeFalse()

      expect(isTzBTCActive).toBeFalse()
      expect(isTzKTActive).toBeTrue()
      expect(isTzUSDActive).toBeFalse()
    })

    it('should check by an identifier if the protocol is supported', async () => {
      service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [new BitcoinProtocol()],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosKtProtocol()]]
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
      service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [new BitcoinProtocol()],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[new TezosProtocol(), new TezosKtProtocol()]]
      })

      const isAeternityActive = await service.isProtocolSupported(new AeternityProtocol())
      const isBitcoinActive = await service.isProtocolSupported(new BitcoinProtocol())
      const isCosmosActive = await service.isProtocolSupported(new CosmosProtocol())

      const isTzBTCActive = await service.isProtocolSupported(new TezosBTC())
      const isTzKTActive = await service.isProtocolSupported(new TezosKtProtocol())
      const isTzUSDActive = await service.isProtocolSupported(new TezosUSD())

      expect(isAeternityActive).toBeTrue()
      expect(isBitcoinActive).toBeTrue()
      expect(isCosmosActive).toBeFalse()

      expect(isTzBTCActive).toBeTrue()
      expect(isTzKTActive).toBeTrue()
      expect(isTzUSDActive).toBeFalse()
    })
    it('should check by an identifer and network if the protocol is active', async () => {
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        passiveProtocols: [new TezosProtocol()],
        activeProtocols: [tezosTestnetProtocol],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]]
      })

      const isTezosActive = await service.isProtocolActive(MainProtocolSymbols.XTZ)
      const isTezosTestnetActive = await service.isProtocolActive(MainProtocolSymbols.XTZ, tezosTestnet)

      const isTzBTCActive = await service.isProtocolActive(SubProtocolSymbols.XTZ_BTC)
      const isTzBTCTestnetActive = await service.isProtocolActive(SubProtocolSymbols.XTZ_BTC, tezosTestnet)

      expect(isTezosActive).toBeFalse()
      expect(isTezosTestnetActive).toBeTrue()

      expect(isTzBTCActive).toBeFalse()
      expect(isTzBTCTestnetActive).toBeTrue()
    })

    it('should check by an identifier and network if the protocol is supported', async () => {
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        passiveProtocols: [new TezosProtocol()],
        activeProtocols: [tezosTestnetProtocol],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: [[tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]]
      })

      const isTezosActive = await service.isProtocolSupported(MainProtocolSymbols.XTZ)
      const isTezosTestnetActive = await service.isProtocolSupported(MainProtocolSymbols.XTZ, tezosTestnet)

      const isTzBTCActive = await service.isProtocolSupported(SubProtocolSymbols.XTZ_BTC)
      const isTzBTCTestnetActive = await service.isProtocolSupported(SubProtocolSymbols.XTZ_BTC, tezosTestnet)

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
    it('should find a protocol by an identifier', async () => {
      service.init({
        activeProtocols: [new AeternityProtocol()],
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundProtocol = await service.getProtocol(MainProtocolSymbols.AE)
      const foundSubProtocol = await service.getProtocol(SubProtocolSymbols.XTZ_BTC)

      expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.AE)
      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should find a protocol if a protocol instance is passed`', async () => {
      service.init({
        activeProtocols: [],
        activeSubProtocols: []
      })

      const protocol = new AeternityProtocol()
      const subProtocol = new TezosBTC()

      const foundProtocol = await service.getProtocol(protocol)
      const foundSubProtocol = await service.getProtocol(subProtocol)

      expect(foundProtocol).toBe(protocol)
      expect(foundSubProtocol).toBe(subProtocol)
    })

    it('should not find a protocol by an identifier if not active', async () => {
      service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: []
      })

      const foundProtocolPromise = service.getProtocol(MainProtocolSymbols.AE)
      const foundSubProtocolPromise = service.getProtocol(SubProtocolSymbols.XTZ_BTC)

      await expectAsync(foundProtocolPromise).toBeRejectedWithError(undefined, 'Protocol ae not supported')
      await expectAsync(foundSubProtocolPromise).toBeRejectedWithError(undefined, 'Protocol xtz-btc not supported')
    })

    it('should find a passive protocol by an identifier if specified', async () => {
      service.init({
        passiveProtocols: [new AeternityProtocol()],
        activeProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        activeSubProtocols: []
      })

      const foundProtocol = await service.getProtocol(MainProtocolSymbols.AE, undefined, false)
      const foundSubProtocol = await service.getProtocol(SubProtocolSymbols.XTZ_BTC, undefined, false)

      expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.AE)
      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should find a protocol by an identifier and network', async () => {
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        activeProtocols: [new TezosProtocol(), tezosTestnetProtocol],
        activeSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]
        ]
      })

      const foundProtocol = await service.getProtocol(MainProtocolSymbols.XTZ, tezosTestnet)
      const foundSubProtocol = await service.getProtocol(SubProtocolSymbols.XTZ_BTC, tezosTestnet)

      expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundProtocol?.options.network).toBe(tezosTestnet)

      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocol?.options.network).toBe(tezosTestnet)
    })

    it('should find a protocol by protocol and network identifier', async () => {
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        activeProtocols: [new TezosProtocol(), tezosTestnetProtocol],
        activeSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]
        ]
      })

      const foundProtocol = await service.getProtocol(MainProtocolSymbols.XTZ, tezosTestnet.identifier)
      const foundSubProtocol = await service.getProtocol(SubProtocolSymbols.XTZ_BTC, tezosTestnet.identifier)

      expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.XTZ)
      expect(foundProtocol?.options.network).toBe(tezosTestnet)

      expect(foundSubProtocol?.identifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocol?.options.network).toBe(tezosTestnet)
    })

    it('should not find a protocol by an identifier if network does not match', async () => {
      service.init({
        activeProtocols: [new TezosProtocol()],
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundProtocolPromise = service.getProtocol(MainProtocolSymbols.XTZ, tezosTestnet)
      const foundSubProtocolPromise = service.getProtocol(SubProtocolSymbols.XTZ_BTC, tezosTestnet)

      await expectAsync(foundProtocolPromise).toBeRejectedWithError(undefined, 'Protocol not supported')
      await expectAsync(foundSubProtocolPromise).toBeRejectedWithError(undefined, 'Protocol not supported')
    })

    it('should find sub protocols by a main protocol identifier', async () => {
      service.init({
        activeSubProtocols: [
          [new TezosProtocol(), new TezosBTC()],
          [new TezosProtocol(), new TezosKtProtocol()]
        ],
        passiveSubProtocols: []
      })

      const foundSubProtocols = await service.getSubProtocols(MainProtocolSymbols.XTZ)
      const foundSubIdentifiers = foundSubProtocols.map((protocol: ICoinSubProtocol) => protocol.identifier)

      expect(foundSubIdentifiers.length).toBe(2)
      expect(foundSubIdentifiers.sort()).toEqual([SubProtocolSymbols.XTZ_BTC, SubProtocolSymbols.XTZ_KT].sort())
    })

    it('should not find passive sub protocols by a main identifier if not active', async () => {
      service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundSubProtocols = await service.getSubProtocols(MainProtocolSymbols.XTZ)

      expect(foundSubProtocols.length).toBe(0)
    })

    it('should find passive sub protocols by a main identifier if specified', async () => {
      service.init({
        activeSubProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundSubProtocols = await service.getSubProtocols(MainProtocolSymbols.XTZ, undefined, false)

      expect(foundSubProtocols.length).toBe(1)
      expect(foundSubProtocols[0].identifier).toBe(SubProtocolSymbols.XTZ_BTC)
    })

    it('should find sub protocols by a main identifier and network', async () => {
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

      const foundSubProtocols = await service.getSubProtocols(MainProtocolSymbols.XTZ, tezosTestnet)

      expect(foundSubProtocols.length).toBe(1)
      expect(foundSubProtocols[0].identifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocols[0].options.network).toBe(tezosTestnet)
    })

    it('should find a sub protocol by main protocol and network identifiers', async () => {
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

      const foundSubProtocols = await service.getSubProtocols(MainProtocolSymbols.XTZ, tezosTestnet.identifier)

      expect(foundSubProtocols.length).toBe(1)
      expect(foundSubProtocols[0].identifier).toBe(SubProtocolSymbols.XTZ_BTC)
      expect(foundSubProtocols[0].options.network).toBe(tezosTestnet)
    })

    it('should not find a sub protocol by a main identifier if network does not match', async () => {
      service.init({
        activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]],
        passiveSubProtocols: []
      })

      const foundSubProtocols = await service.getSubProtocols(MainProtocolSymbols.XTZ, tezosTestnet)

      expect(foundSubProtocols.length).toBe(0)
    })
  })

  /**
   * Utils
   */

  describe('Utils', () => {
    it('should find networks for the requested protocol by its identifier', async () => {
      const tezosProtocol = new TezosProtocol()
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        activeProtocols: [tezosProtocol, tezosTestnetProtocol],
        activeSubProtocols: [
          [tezosProtocol, new TezosBTC()],
          [tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]
        ]
      })

      const foundNetworksForMain = await service.getNetworksForProtocol(MainProtocolSymbols.XTZ)
      const foundNetworksForSub = await service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC)

      const foundForMainIdentifiers = foundNetworksForMain.map((network: ProtocolNetwork) => network.identifier)
      const foundForSubIdentifiers = foundNetworksForSub.map((network: ProtocolNetwork) => network.identifier)

      expect(foundForMainIdentifiers.sort()).toEqual(
        [tezosProtocol.options.network.identifier, tezosTestnetProtocol.options.network.identifier].sort()
      )
      expect(foundForSubIdentifiers.sort()).toEqual(
        [tezosProtocol.options.network.identifier, tezosTestnetProtocol.options.network.identifier].sort()
      )
    })

    it('should not find networks for the requested protocol by its identifier if not active', async () => {
      service.init({
        activeProtocols: [],
        passiveProtocols: [new TezosProtocol()],
        activeSubProtocols: [],
        passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
      })

      const foundNetworksForMain = await service.getNetworksForProtocol(MainProtocolSymbols.XTZ)
      const foundNetworksForSub = await service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC)

      expect(foundNetworksForMain.length).toBe(0)
      expect(foundNetworksForSub.length).toBe(0)
    })

    it('should find networks for the requested passive protocol by its identifier if specified', async () => {
      const tezosProtocol = new TezosProtocol()
      const tezosTestnetProtocol = new TezosProtocol(new TezosProtocolOptions(tezosTestnet))

      service.init({
        activeProtocols: [tezosProtocol],
        passiveProtocols: [tezosTestnetProtocol],
        activeSubProtocols: [[tezosProtocol, new TezosBTC()]],
        passiveSubProtocols: [[tezosTestnetProtocol, new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))]]
      })

      const foundNetworksForMain = await service.getNetworksForProtocol(MainProtocolSymbols.XTZ, false)
      const foundNetworksForSub = await service.getNetworksForProtocol(SubProtocolSymbols.XTZ_BTC, false)

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

    it('should recognize if the address is valid for the specified protocol', async () => {
      service.init()

      const allValid: boolean = (
        await Promise.all(validAddresses.map((entry) => service.isAddressOfProtocol(entry.protocol, entry.address)))
      ).reduce((all, next) => all && next, true)

      const allInvalid: boolean = (
        await Promise.all(invalidAddresses.map((entry) => service.isAddressOfProtocol(entry.protocol, entry.address)))
      ).reduce((all, next) => all && !next, true)

      expect(allValid).toBeTrue()
      expect(allInvalid).toBeTrue()
    })
  })
})
