import { AeternityProtocol } from '@airgap/aeternity'
import { BitcoinSegwitProtocol, BitcoinProtocol } from '@airgap/bitcoin'
import { ICoinProtocol, SubProtocolSymbols } from '@airgap/coinlib-core'
import { CosmosProtocol } from '@airgap/cosmos'
import { EthereumProtocol, EthereumERC20ProtocolOptions, EthereumProtocolNetwork, GenericERC20 } from '@airgap/ethereum'
import { GroestlcoinProtocol } from '@airgap/groestlcoin'
import { MoonriverProtocol, MoonbeamProtocol } from '@airgap/moonbeam'
import { PolkadotProtocol, KusamaProtocol } from '@airgap/polkadot'
import { TezosProtocol, TezosShieldedTezProtocol } from '@airgap/tezos'
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

    await checkPassword(protocols)
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

    const erc20Protocols: ICoinProtocol[] = configs.map((config) => {
      const options = new EthereumERC20ProtocolOptions(new EthereumProtocolNetwork(), config)

      return new GenericERC20(options)
    })

    const protocols: ICoinProtocol[] = [new EthereumProtocol(), ...erc20Protocols]

    await checkPassword(protocols)
  })
})
