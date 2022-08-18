import {
  ICoinProtocol,
  AeternityProtocol,
  BitcoinSegwitProtocol,
  BitcoinProtocol,
  EthereumProtocol,
  GroestlcoinProtocol,
  TezosProtocol,
  CosmosProtocol,
  PolkadotProtocol,
  KusamaProtocol,
  ICoinSubProtocol,
  TezosKtProtocol,
  GenericERC20,
  EthereumERC20ProtocolOptions,
  EthereumProtocolNetwork,
  EthereumERC20ProtocolConfig,
  TezosUUSD,
  TezosYOU,
  TezosBTC,
  TezosUSD,
  SubProtocolSymbols,
  MoonriverProtocol,
  TezosUDEFI,
  TezosCTez,
  TezosPlenty,
  TezosWRAP,
  TezosQUIPU,
  MoonbeamProtocol,
  AstarProtocol,
  ShidenProtocol,
  TezosKolibriUSD,
  TezosUBTC,
  TezosDOGA,
  TezosBTCTez,
  TezosETH,
  TezosUSDT,
  TezosSIRS
} from '@airgap/coinlib-core'
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
