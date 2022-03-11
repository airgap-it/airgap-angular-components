import {
  AeternityProtocol,
  BitcoinProtocol,
  BitcoinSegwitProtocol,
  CosmosProtocol,
  EthereumERC20ProtocolConfig,
  EthereumERC20ProtocolOptions,
  EthereumProtocol,
  EthereumProtocolNetwork,
  GenericERC20,
  GroestlcoinProtocol,
  ICoinProtocol,
  KusamaProtocol,
  MoonbeamProtocol,
  MoonriverProtocol,
  PolkadotProtocol,
  SubProtocolSymbols,
  TezosProtocol,
  TezosShieldedTezProtocol
} from '@airgap/coinlib-core'
import { TestBed } from '@angular/core/testing'

import { KeyPairService } from './key-pair.service'

describe('KeypairService', () => {
  let service: KeyPairService

  const mnemonic =
    'insane matrix deliver unit require what miss tonight indicate sibling rice share surge top erosion marriage bundle they custom earn enable talk curtain lesson'
  const hdDerivationPath = `m/44'/60'/0'`
  const password = '8fe6c5078f5d7389bf7c4635695c90252ef1ebc53273865913e1d901179fb98b'
  let unsigned = {
    transaction: { tx: 'qBJw2yUOYM' },
    publicKey: 'publicKey'
  }

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(KeyPairService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should correctly verify validity of BIP-39 passphrase for protocols without `getPublicKeyFromMnemonic()`', async () => {
    const protocols = [
      new BitcoinSegwitProtocol(),
      new TezosProtocol(),
      new PolkadotProtocol(),
      new KusamaProtocol(),
      new CosmosProtocol(),
      new AeternityProtocol(),
      new GroestlcoinProtocol(),
      new MoonriverProtocol(),
      new MoonbeamProtocol(),
      new BitcoinProtocol(),
      new TezosShieldedTezProtocol()
    ]

    checkPassword(protocols, true)
  })

  it('should correctly verify validity of BIP-39 passphrase for protocols supporting `getExtendedPublicKeyFromMnemonic()`', async () => {
    const configs = [
      {
        symbol: 'XCHF',
        name: 'CryptoFranc',
        marketSymbol: 'xchf',
        identifier: SubProtocolSymbols.ETH_ERC20_XCHF,
        contractAddress: '0xB4272071eCAdd69d933AdcD19cA99fe80664fc08',
        decimals: 18
      },
      {
        symbol: 'USDT',
        name: 'USD Tether (erc20)',
        marketSymbol: 'usdt',
        identifier: SubProtocolSymbols.ETH_ERC20,
        contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6
      }
    ]

    const erc20Protocols = configs.map((config) => {
      const options = new EthereumERC20ProtocolOptions(new EthereumProtocolNetwork(), config)
      return new GenericERC20(options)
    })

    const protocols = [new EthereumProtocol()].concat(erc20Protocols)
    checkPassword(protocols, true)
  })

  const checkPassword = async (protocols: ICoinProtocol[], isExtended: boolean) => {
    for (let i = 0; i < protocols.length; i++) {
      let protocol = protocols[i]

      const publicKey = isExtended
        ? await (protocol as EthereumProtocol).getExtendedPublicKeyFromMnemonic(mnemonic, hdDerivationPath, password)
        : await protocol.getPublicKeyFromMnemonic(mnemonic, hdDerivationPath, password)
      unsigned = { ...unsigned, publicKey }

      const checkPassed = await service.checkPassword(protocol, unsigned, mnemonic, true, hdDerivationPath, password)

      expect(checkPassed).toBe(true)
    }
  }
})
