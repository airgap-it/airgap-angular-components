import {
  ICoinProtocol,
  AeternityProtocol,
  BitcoinSegwitProtocol,
  BitcoinProtocol,
  EthereumProtocol,
  RskProtocol,
  GroestlcoinProtocol,
  TezosProtocol,
  CosmosProtocol,
  PolkadotProtocol,
  KusamaProtocol,
  ICoinSubProtocol,
  TezosKtProtocol,
  GenericERC20,
  GenericRskERC20,
  EthereumERC20ProtocolOptions,
  EthereumProtocolNetwork,
  EthereumERC20ProtocolConfig,
  TezosUUSD,
  TezosYOU,
  RskERC20ProtocolOptions,
  RskProtocolNetwork,
  RskERC20ProtocolConfig,
  TezosBTC,
  TezosUSD,
  SubProtocolSymbols,
  MoonriverProtocol,
  MoonriverProtocolOptions,
  MoonriverProtocolNetwork,
  MoonriverSubscanBlockExplorer,
  TezosUDEFI,
  TezosCTez,
  TezosPlenty,
  TezosWRAP,
  TezosQUIPU,
} from '@airgap/coinlib-core'
import { Token } from '../../types/Token'
import { ethTokens, rskTokens } from './tokens'

export function getDefaultPassiveProtocols(): ICoinProtocol[] {
  return []
}

export function getDefaultActiveProtocols(): ICoinProtocol[] {
  return [
    new BitcoinSegwitProtocol(),
    new EthereumProtocol(),
    new RskProtocol(),
    new GroestlcoinProtocol(),
    new TezosProtocol(),
    new PolkadotProtocol(),
    new KusamaProtocol(),
    new CosmosProtocol(),
    new AeternityProtocol(),
    new GroestlcoinProtocol(),
    new MoonriverProtocol(
      new MoonriverProtocolOptions(
        new MoonriverProtocolNetwork(
          undefined,
          undefined,
          undefined,
          new MoonriverSubscanBlockExplorer('https://moonriver.subscan.io')
        )
      )
    ),
    new BitcoinProtocol()
  ]
}

export function getDefaultPassiveSubProtocols(): [ICoinProtocol, ICoinSubProtocol][] {
  return []
}

export function getDefaultActiveSubProtocols(): [ICoinProtocol, ICoinSubProtocol][] {
  const tezosProtocol = new TezosProtocol()
  const ethereumProtocol = new EthereumProtocol()
  const rskProtocol = new RskProtocol()

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
    ),
    ...rskTokens.map(
      (token: Token) =>
        [
          rskProtocol,
          new GenericRskERC20(
            new RskERC20ProtocolOptions(
              new RskProtocolNetwork(),
              new RskERC20ProtocolConfig(
                token.symbol,
                token.name,
                token.marketSymbol,
                token.identifier as SubProtocolSymbols,
                token.contractAddress,
                token.decimals
              )
            )
          )
        ] as [RskProtocol, GenericRskERC20]
    )
  ]
}
