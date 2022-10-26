import { AeternityProtocol } from '@airgap/aeternity'
import { AstarProtocol, ShidenProtocol } from '@airgap/astar'
import { BitcoinSegwitProtocol, BitcoinProtocol } from '@airgap/bitcoin'
import { ICoinProtocol, ICoinSubProtocol, SubProtocolSymbols } from '@airgap/coinlib-core'
import { CosmosProtocol } from '@airgap/cosmos'
import {
  EthereumProtocol,
  GenericERC20,
  EthereumERC20ProtocolOptions,
  EthereumProtocolNetwork,
  EthereumERC20ProtocolConfig
} from '@airgap/ethereum'
import { GroestlcoinProtocol } from '@airgap/groestlcoin'
import { MoonriverProtocol, MoonbeamProtocol } from '@airgap/moonbeam'
import { PolkadotProtocol, KusamaProtocol } from '@airgap/polkadot'
import {
  TezosProtocol,
  TezosUUSD,
  TezosYOU,
  TezosBTC,
  TezosUSD,
  TezosUDEFI,
  TezosCTez,
  TezosPlenty,
  TezosWRAP,
  TezosQUIPU,
  TezosKolibriUSD,
  TezosUBTC,
  TezosDOGA,
  TezosSIRS,
  TezosBTCTez,
  TezosETH,
  TezosUSDT,
  TezosKtProtocol
} from '@airgap/tezos'
import { Token } from '../../types/Token'
import { ethTokens } from './tokens'

export function getDefaultPassiveProtocols(): ICoinProtocol[] {
  return []
}

export function getDefaultActiveProtocols(): ICoinProtocol[] {
  return [
    new BitcoinSegwitProtocol(),
    new EthereumProtocol(),
    new TezosProtocol(),
    new PolkadotProtocol(),
    new KusamaProtocol(),
    new CosmosProtocol(),
    new AeternityProtocol(),
    new GroestlcoinProtocol(),
    new MoonriverProtocol(),
    new MoonbeamProtocol(),
    new BitcoinProtocol(),
    new AstarProtocol(),
    new ShidenProtocol()
  ]
}

export function getDefaultPassiveSubProtocols(): [ICoinProtocol, ICoinSubProtocol][] {
  return []
}

export function getDefaultActiveSubProtocols(): [ICoinProtocol, ICoinSubProtocol][] {
  const tezosProtocol = new TezosProtocol()
  const ethereumProtocol = new EthereumProtocol()

  return [
    [tezosProtocol, new TezosUUSD()],
    [tezosProtocol, new TezosYOU()],
    [tezosProtocol, new TezosBTC()],
    [tezosProtocol, new TezosUSD()],
    [tezosProtocol, new TezosUDEFI()],
    [tezosProtocol, new TezosCTez()],
    [tezosProtocol, new TezosPlenty()],
    [tezosProtocol, new TezosWRAP()],
    [tezosProtocol, new TezosQUIPU()],
    [tezosProtocol, new TezosKolibriUSD()],
    [tezosProtocol, new TezosUBTC()],
    [tezosProtocol, new TezosDOGA()],
    [tezosProtocol, new TezosSIRS()],
    [tezosProtocol, new TezosBTCTez()],
    [tezosProtocol, new TezosETH()],
    [tezosProtocol, new TezosUSDT()],
    [tezosProtocol, new TezosKtProtocol()],
    ...ethTokens.map(
      (token: Token) =>
        [
          ethereumProtocol,
          new GenericERC20(
            new EthereumERC20ProtocolOptions(
              new EthereumProtocolNetwork(),
              new EthereumERC20ProtocolConfig(
                token.symbol,
                token.name,
                token.marketSymbol,
                token.identifier as SubProtocolSymbols,
                token.contractAddress,
                token.decimals
              )
            )
          )
        ] as [EthereumProtocol, GenericERC20]
    )
  ]
}
