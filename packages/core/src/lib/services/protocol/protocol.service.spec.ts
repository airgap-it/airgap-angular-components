/* eslint-disable max-lines */
import { TestBed } from '@angular/core/testing'

import {
  ICoinProtocol,
  ICoinSubProtocol,
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
  TezosBTCProtocolConfig
} from 'airgap-coin-lib'
import { MainProtocolSymbols, SubProtocolSymbols, ProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { NetworkType } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { Token } from '../../types/Token'
import { ProtocolService, SubProtocolsMap } from './protocol.service'
import { ethTokens } from './tokens'

const defaultActiveIdentifiers = [
  MainProtocolSymbols.AE,
  MainProtocolSymbols.BTC,
  MainProtocolSymbols.COSMOS,
  MainProtocolSymbols.ETH,
  MainProtocolSymbols.GRS,
  MainProtocolSymbols.KUSAMA,
  MainProtocolSymbols.POLKADOT,
  MainProtocolSymbols.XTZ
]

const defaultPassiveIdentifiers = []

const defaultActiveSubIdentifiers = [
  SubProtocolSymbols.XTZ_BTC,
  SubProtocolSymbols.XTZ_KT,
  ...ethTokens
    .map((token: Token) => token.identifier as SubProtocolSymbols)
    .filter((identifeir: SubProtocolSymbols, index: number, array: SubProtocolSymbols[]) => array.indexOf(identifeir) === index)
]

const defaultPassiveSubIdentifiers = []

function getIdentifiers(protocols: ICoinProtocol[]): ProtocolSymbols[] {
  return protocols.map((protocol: ICoinProtocol) => protocol.identifier)
}

function getSubIdentifiers(subProtocolMap: SubProtocolsMap): ProtocolSymbols[] {
  return Object.values(subProtocolMap)
    .map((values) => Object.values(values).map((protocol: ICoinSubProtocol | undefined) => protocol?.identifier))
    .reduce((flatten, toFlatten) => flatten.concat(toFlatten), [])
    .filter((identifier: ProtocolSymbols | undefined) => identifier !== undefined) as ProtocolSymbols[]
}

describe('ProtocolsService', () => {
  let service: ProtocolService

  let tezosTestnet: TezosProtocolNetwork

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

  it('should be initialized with default protocols', () => {
    service.init()
    const activeIdentifiers = getIdentifiers(service.activeProtocols)
    const passiveIdentifiers = getIdentifiers(service.passiveProtocols)

    const activeSubIdentifiers = getSubIdentifiers(service.activeSubProtocols)
    const passiveSubIdentifiers = getSubIdentifiers(service.passiveSubProtocols)

    expect(service.isInitialized).toBeTrue()

    expect(activeIdentifiers.sort()).toEqual(defaultActiveIdentifiers.sort())
    expect(passiveIdentifiers.sort()).toEqual(defaultPassiveIdentifiers.sort())

    expect(activeSubIdentifiers.sort()).toEqual(defaultActiveSubIdentifiers.sort())
    expect(passiveSubIdentifiers.sort()).toEqual(defaultPassiveSubIdentifiers.sort())
  })

  it('should throw error when not initialized', () => {
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

  it('should be initialized with provided protocols', () => {
    service.init({
      passiveProtocols: [new AeternityProtocol()],
      activeProtocols: [new BitcoinProtocol()],
      activeSubProtocols: [[new TezosProtocol(), new TezosUSD()]],
      passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
    })

    const activeIdentifiers = getIdentifiers(service.activeProtocols)
    const passiveIdentifiers = getIdentifiers(service.passiveProtocols)

    const activeSubIdentifiers = getSubIdentifiers(service.activeSubProtocols)
    const passiveSubIdentifiers = getSubIdentifiers(service.passiveSubProtocols)

    expect(activeIdentifiers).toEqual([MainProtocolSymbols.BTC])
    expect(passiveIdentifiers).toEqual([MainProtocolSymbols.AE])

    expect(activeSubIdentifiers).toEqual([SubProtocolSymbols.XTZ_USD])
    expect(passiveSubIdentifiers).toEqual([SubProtocolSymbols.XTZ_BTC])
  })

  it('should be initialized with provided extra protocols', () => {
    service.init({
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
    })

    const activeIdentifiers = getIdentifiers(service.activeProtocols)
    const passiveIdentifiers = getIdentifiers(service.passiveProtocols)

    const activeSubIdentifiers = getSubIdentifiers(service.activeSubProtocols)
    const passiveSubIdentifiers = getSubIdentifiers(service.passiveSubProtocols)

    expect(activeIdentifiers.sort()).toEqual([MainProtocolSymbols.BTC, MainProtocolSymbols.COSMOS])
    expect(passiveIdentifiers).toEqual([MainProtocolSymbols.AE])

    expect(activeSubIdentifiers.sort()).toEqual([SubProtocolSymbols.XTZ_STKR, ...defaultActiveSubIdentifiers].sort())
    expect(passiveSubIdentifiers).toEqual([SubProtocolSymbols.XTZ_USD])
  })

  it('should remove duplicated protocols', () => {
    service.init({
      passiveProtocols: [new AeternityProtocol(), new BitcoinProtocol()],
      activeProtocols: [new BitcoinProtocol(), new CosmosProtocol()],
      passiveSubProtocols: [
        [new TezosProtocol(), new TezosBTC()],
        [new TezosProtocol(), new TezosUSD()]
      ],
      activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
    })

    const activeIdentifiers = getIdentifiers(service.activeProtocols)
    const passiveIdentifiers = getIdentifiers(service.passiveProtocols)

    const activeSubIdentifiers = getSubIdentifiers(service.activeSubProtocols)
    const passiveSubIdentifiers = getSubIdentifiers(service.passiveSubProtocols)

    expect(activeIdentifiers.sort()).toEqual([MainProtocolSymbols.BTC, MainProtocolSymbols.COSMOS])
    expect(passiveIdentifiers.sort()).toEqual([MainProtocolSymbols.AE])

    expect(activeSubIdentifiers.sort()).toEqual([SubProtocolSymbols.XTZ_BTC])
    expect(passiveSubIdentifiers.sort()).toEqual([SubProtocolSymbols.XTZ_USD])
  })

  it('should not remove as duplicated protocols with the same identifier but different networks', () => {
    service.init({
      passiveProtocols: [new TezosProtocol(new TezosProtocolOptions(tezosTestnet))],
      activeProtocols: [new TezosProtocol()],
      passiveSubProtocols: [
        [
          new TezosProtocol(new TezosProtocolOptions(tezosTestnet)),
          new TezosUSD(new TezosFAProtocolOptions(tezosTestnet, new TezosUSDProtocolConfig()))
        ]
      ],
      activeSubProtocols: [[new TezosProtocol(), new TezosUSD()]]
    })

    const activeIdentifiers = getIdentifiers(service.activeProtocols)
    const passiveIdentifiers = getIdentifiers(service.passiveProtocols)

    const activeSubIdentifiers = getSubIdentifiers(service.activeSubProtocols)
    const passiveSubIdentifiers = getSubIdentifiers(service.passiveSubProtocols)

    expect(activeIdentifiers.sort()).toEqual([MainProtocolSymbols.XTZ])
    expect(passiveIdentifiers.sort()).toEqual([MainProtocolSymbols.XTZ])

    expect(activeSubIdentifiers.sort()).toEqual([SubProtocolSymbols.XTZ_USD])
    expect(passiveSubIdentifiers.sort()).toEqual([SubProtocolSymbols.XTZ_USD])
  })

  it('should find a protocol by an identifier', () => {
    service.init({
      activeProtocols: [new AeternityProtocol()]
    })

    const foundProtocol = service.getProtocol(MainProtocolSymbols.AE)

    expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.AE)
  })

  it('should find a protocol if a protocol instance is passed`', () => {
    service.init()

    const protocol = new AeternityProtocol()
    const foundProtocol = service.getProtocol(protocol)

    expect(foundProtocol).toBe(protocol)
  })

  it('should not find a protocol by an identifier if not active', () => {
    service.init({
      activeProtocols: [new AeternityProtocol()]
    })

    const foundProtocol = service.getProtocol(MainProtocolSymbols.BTC)

    expect(foundProtocol).toBeUndefined()
  })

  it('should find a passive protocol by an identifier if specified', () => {
    service.init({
      activeProtocols: [],
      passiveProtocols: [new AeternityProtocol()]
    })

    const foundProtocol = service.getProtocol(MainProtocolSymbols.AE, undefined, false)

    expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.AE)
  })

  it('should find a protocol by an identifier and network', () => {
    service.init({
      activeProtocols: [new TezosProtocol(), new TezosProtocol(new TezosProtocolOptions(tezosTestnet))]
    })

    const foundProtocol = service.getProtocol(MainProtocolSymbols.XTZ, tezosTestnet)

    expect(foundProtocol?.identifier).toBe(MainProtocolSymbols.XTZ)
    expect(foundProtocol?.options.network).toBe(tezosTestnet)
  })

  it('should not find a protocol by an identifier if network does not match', () => {
    service.init({
      activeProtocols: [new TezosProtocol()]
    })

    const foundProtocol = service.getProtocol(MainProtocolSymbols.XTZ, tezosTestnet)

    expect(foundProtocol).toBeUndefined()
  })

  it('should find a sub protocol by a sub protocol identifier', () => {
    service.init({
      activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
    })

    const foundSubProtocols = service.getSubProtocolsByIdentifier(SubProtocolSymbols.XTZ_BTC)

    expect(foundSubProtocols.length).toBe(1)
    expect(foundSubProtocols[0].identifier).toBe(SubProtocolSymbols.XTZ_BTC)
  })

  it('should find a sub protocol by a main protocol identifier', () => {
    service.init({
      activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
    })

    const foundSubProtocols = service.getSubProtocolsByIdentifier(MainProtocolSymbols.XTZ)

    expect(foundSubProtocols.length).toBe(1)
    expect(foundSubProtocols[0].identifier).toBe(SubProtocolSymbols.XTZ_BTC)
  })

  it('should not find a sub protocol by an identifier if not active', () => {
    service.init({
      activeSubProtocols: [],
      passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
    })

    const foundSubProtocols = service.getSubProtocolsByIdentifier(SubProtocolSymbols.XTZ_BTC)

    expect(foundSubProtocols.length).toBe(0)
  })

  it('should find a passive protocol by an identifier if specified', () => {
    service.init({
      activeSubProtocols: [],
      passiveSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
    })

    const foundSubProtocols = service.getSubProtocolsByIdentifier(SubProtocolSymbols.XTZ_BTC, undefined, false)

    expect(foundSubProtocols.length).toBe(1)
    expect(foundSubProtocols[0].identifier).toBe(SubProtocolSymbols.XTZ_BTC)
  })

  it('should find a sub protocol by an identifier and network', () => {
    service.init({
      activeSubProtocols: [
        [new TezosProtocol(), new TezosBTC()],
        [
          new TezosProtocol(new TezosProtocolOptions(tezosTestnet)),
          new TezosBTC(new TezosFAProtocolOptions(tezosTestnet, new TezosBTCProtocolConfig()))
        ]
      ]
    })

    const foundSubProtocols = service.getSubProtocolsByIdentifier(SubProtocolSymbols.XTZ_BTC, tezosTestnet)

    expect(foundSubProtocols.length).toBe(1)
    expect(foundSubProtocols[0].identifier).toBe(SubProtocolSymbols.XTZ_BTC)
    expect(foundSubProtocols[0].options.network).toBe(tezosTestnet)
  })

  it('should not find a sub protocol by an identifier if network does not match', () => {
    service.init({
      activeSubProtocols: [[new TezosProtocol(), new TezosBTC()]]
    })

    const foundSubProtocols = service.getSubProtocolsByIdentifier(SubProtocolSymbols.XTZ_BTC, tezosTestnet)

    expect(foundSubProtocols.length).toBe(0)
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

  it('should recognize if address is valid for a specified protocol', () => {
    service.init()

    const allValid: boolean = validAddresses
      .map((entry) => service.isAddressOfProtocol(entry.protocol, entry.address))
      .reduce((all, next) => all && next, true)

    const allInvalid: boolean = invalidAddresses
      .map((entry) => service.isAddressOfProtocol(entry.protocol, entry.address))
      .reduce((all, next) => all && next, true)

    expect(allValid).toBeTrue()
    expect(allInvalid).toBeFalse()
  })
})
