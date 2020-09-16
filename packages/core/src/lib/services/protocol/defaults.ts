import {
  ICoinProtocol,
  AeternityProtocol,
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
  TezosBTC,
  TezosUSD
} from 'airgap-coin-lib'
import { SubProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { Token } from '../../types/Token'
import { ethTokens } from './tokens'
import { top100Tokens } from './top100tokens'

const activeEthTokens: Set<string> = new Set(['eth-erc20-xchf'].concat(top100Tokens.map((token) => token.identifier)))

export function getDefaultPassiveProtocols(): ICoinProtocol[] {
  return []
}

export function getDefaultActiveProtocols(): ICoinProtocol[] {
  return [
    new AeternityProtocol(),
    new BitcoinProtocol(),
    new EthereumProtocol(),
    new GroestlcoinProtocol(),
    new TezosProtocol(),
    new CosmosProtocol(),
    new PolkadotProtocol(),
    new KusamaProtocol()
  ]
}

export function getDefaultPassiveSubProtocols(): [ICoinProtocol, ICoinSubProtocol][] {
  const ethereumProtocol = new EthereumProtocol()

  return [
    [new TezosProtocol(), new TezosKtProtocol()],
    ...ethTokens
      .filter((token: Token, index: number, array: Token[]) => !activeEthTokens.has(token.identifier) && array.indexOf(token) === index)
      .map(
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

export function getDefaultActiveSubProtocols(): [ICoinProtocol, ICoinSubProtocol][] {
  const tezosProtocol = new TezosProtocol()
  const ethereumProtocol = new EthereumProtocol()

  return [
    [tezosProtocol, new TezosBTC()],
    [tezosProtocol, new TezosUSD()],
    ...ethTokens
      .filter((token: Token, index: number, array: Token[]) => activeEthTokens.has(token.identifier) && array.indexOf(token) === index)
      .map(
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
