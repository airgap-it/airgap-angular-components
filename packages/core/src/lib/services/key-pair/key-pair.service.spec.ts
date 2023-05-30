import { ICoinProtocol, SubProtocolSymbols } from '@airgap/coinlib-core'
import { TestBed } from '@angular/core/testing'
import { Token } from '../../types/Token'
import {
  createV0AeternityProtocol,
  createV0BitcoinProtocol,
  createV0BitcoinSegwitProtocol,
  createV0CosmosProtocol,
  createV0EthereumERC20Token,
  createV0EthereumProtocol,
  createV0GroestlcoinProtocol,
  createV0KusamaProtocol,
  createV0MoonbeamProtocol,
  createV0MoonriverProtocol,
  createV0PolkadotProtocol,
  createV0TezosProtocol,
  createV0TezosShieldedTezProtocol
} from '../../utils/protocol/protocol-v0-adapter'

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

  const checkPassword = async (protocols: ICoinProtocol[]) => {
    for (let i = 0; i < protocols.length; i++) {
      const protocol = protocols[i]

      const publicKey = (await protocol.getSupportsHD())
        ? await protocol.getExtendedPublicKeyFromMnemonic(mnemonic, hdDerivationPath, password)
        : await protocol.getPublicKeyFromMnemonic(mnemonic, hdDerivationPath, password)
      unsigned = { ...unsigned, publicKey }

      const checkPassed = await service.checkPassword(protocol, unsigned, mnemonic, true, hdDerivationPath, password)

      expect(checkPassed).toBe(true)
    }
  }

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should correctly verify validity of BIP-39 passphrase for protocols without `getPublicKeyFromMnemonic()`', async () => {
    const protocols = await Promise.all<ICoinProtocol>([
      createV0BitcoinSegwitProtocol(),
      createV0TezosProtocol(),
      createV0PolkadotProtocol(),
      createV0KusamaProtocol(),
      createV0CosmosProtocol(),
      createV0AeternityProtocol(),
      createV0GroestlcoinProtocol(),
      createV0MoonriverProtocol(),
      createV0MoonbeamProtocol(),
      createV0BitcoinProtocol(),
      createV0TezosShieldedTezProtocol()
    ])

    await checkPassword(protocols)
  })

  it('should correctly verify validity of BIP-39 passphrase for protocols supporting `getExtendedPublicKeyFromMnemonic()`', async () => {
    const configs: Token[] = [
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

    const erc20Protocols: ICoinProtocol[] = await Promise.all(configs.map((config) => createV0EthereumERC20Token(config)))

    const protocols: ICoinProtocol[] = [await createV0EthereumProtocol(), ...erc20Protocols]

    await checkPassword(protocols)
  })
})
