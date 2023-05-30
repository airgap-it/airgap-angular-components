/* eslint-disable @typescript-eslint/no-use-before-define */
import { ICoinProtocol, ICoinSubProtocol } from '@airgap/coinlib-core'
import { erc20Tokens } from '@airgap/ethereum'
import { Token } from '../../types/Token'
import {
  createV0AeternityProtocol,
  createV0AstarProtocol,
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
  createV0ShidenProtocol,
  createV0TezosBTCTezProtocol,
  createV0TezosCTezProtocol,
  createV0TezosDogamiProtocol,
  createV0TezosETHTezProtocol,
  createV0TezosKolibriUSDProtocol,
  createV0TezosKtProtocol,
  createV0TezosPlentyProtocol,
  createV0TezosProtocol,
  createV0TezosQuipuswapProtocol,
  createV0TezosSiriusProtocol,
  createV0TezosTetherUSDProtocol,
  createV0TezosTzBTCProtocol,
  createV0TezosUBTCProtocol,
  createV0TezosUDEFIProtocol,
  createV0TezosUSDTezProtocol,
  createV0TezosUUSDProtocol,
  createV0TezosWrapProtocol,
  createV0TezosYouProtocol
} from '../../utils/protocol/protocol-v0-adapter'

export async function getDefaultPassiveProtocols(): Promise<ICoinProtocol[]> {
  return []
}

export async function getDefaultActiveProtocols(): Promise<ICoinProtocol[]> {
  return Promise.all<ICoinProtocol>([
    createV0BitcoinSegwitProtocol(),
    createV0EthereumProtocol(),
    createV0TezosProtocol(),
    createV0PolkadotProtocol(),
    createV0KusamaProtocol(),
    createV0CosmosProtocol(),
    createV0AeternityProtocol(),
    createV0GroestlcoinProtocol(),
    createV0MoonriverProtocol(),
    createV0MoonbeamProtocol(),
    createV0BitcoinProtocol(),
    createV0AstarProtocol(),
    createV0ShidenProtocol()
  ])
}

export async function getDefaultPassiveSubProtocols(): Promise<[ICoinProtocol, ICoinSubProtocol][]> {
  return []
}

export async function getDefaultActiveSubProtocols(): Promise<[ICoinProtocol, ICoinSubProtocol][]> {
  const [tezosProtocol, ethereumProtocol] = await Promise.all([createV0TezosProtocol(), createV0EthereumProtocol()])

  return Promise.all([
    createV0TezosUUSDProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosYouProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosTzBTCProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosUSDTezProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosUDEFIProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosCTezProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosPlentyProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosWrapProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosQuipuswapProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosKolibriUSDProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosUBTCProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosDogamiProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosSiriusProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosBTCTezProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosETHTezProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosTetherUSDProtocol().then(pairWithMainProtocol(tezosProtocol)),
    createV0TezosKtProtocol().then(pairWithMainProtocol(tezosProtocol)),
    ...Object.values(erc20Tokens).map((token: Token) => createV0EthereumERC20Token(token).then(pairWithMainProtocol(ethereumProtocol)))
  ])
}

function pairWithMainProtocol(mainProtocol: ICoinProtocol): (subProtocol: ICoinSubProtocol) => [ICoinProtocol, ICoinSubProtocol] {
  return (subProtocol: ICoinSubProtocol): [ICoinProtocol, ICoinSubProtocol] => {
    return [mainProtocol, subProtocol] as [ICoinProtocol, ICoinSubProtocol]
  }
}
