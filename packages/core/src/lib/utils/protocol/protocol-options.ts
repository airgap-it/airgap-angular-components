/* eslint-disable complexity */
import { AeternityProtocolNetwork, AeternityProtocolOptions } from '@airgap/aeternity/v0'
import { BitcoinProtocolNetwork, BitcoinProtocolOptions } from '@airgap/bitcoin/v0'
import { CosmosProtocolNetwork, CosmosProtocolOptions } from '@airgap/cosmos/v0'
import { EthereumProtocolNetwork, EthereumProtocolOptions } from '@airgap/ethereum/v0'
import { GroestlcoinProtocolNetwork, GroestlcoinProtocolOptions } from '@airgap/groestlcoin/v0'
import { KusamaProtocolNetwork, KusamaProtocolOptions, PolkadotProtocolNetwork, PolkadotProtocolOptions } from '@airgap/polkadot/v0'
import { MoonbaseProtocolNetwork, MoonbaseProtocolOptions, MoonriverProtocolNetwork, MoonriverProtocolOptions } from '@airgap/moonbeam/v0'
import { AstarProtocolNetwork, AstarProtocolOptions, ShidenProtocolNetwork, ShidenProtocolOptions } from '@airgap/astar/v0'
import {
  TezosBTCProtocolConfig,
  TezosBTCTezProtocolConfig,
  TezosCTezProtocolConfig,
  TezosDOGAProtocolConfig,
  TezosFAProtocolOptions,
  TezosKolibriUSDProtocolConfig,
  TezosPlentyProtocolConfig,
  TezosProtocolNetwork,
  TezosProtocolOptions,
  TezosQUIPUProtocolConfig,
  TezosSaplingProtocolOptions,
  TezosShieldedTezProtocolConfig,
  TezosSIRSProtocolConfig,
  TezosStakerProtocolConfig,
  TezosUBTCProtocolConfig,
  TezosUDEFIProtocolConfig,
  TezosUSDProtocolConfig,
  TezosUSDTProtocolConfig,
  TezosUUSDProtocolConfig,
  TezosWrappedProtocolConfig,
  TezosWRAPProtocolConfig,
  TezosYOUProtocolConfig
} from '@airgap/tezos/v0'
import { ProtocolSymbols, ProtocolNetwork, MainProtocolSymbols, SubProtocolSymbols, assertNever, Domain } from '@airgap/coinlib-core'
import { NotFoundError } from '@airgap/coinlib-core/errors'
import { ProtocolOptions } from '@airgap/coinlib-core/utils/ProtocolOptions'
import { MoonbeamProtocolOptions, MoonbeamProtocolNetwork } from '@airgap/moonbeam/v0/protocol/moonbeam/MoonbeamProtocolOptions'
import { TezosETHtzProtocolConfig } from '@airgap/tezos/v0/protocol/fa/TezosFAProtocolOptions'
import { ICP_MAINNET_PROTOCOL_NETWORK } from '@airgap/icp/v1/protocol/ICPProtocol'
import { COREUM_PROTOCOL_NETWORK } from '@airgap/coreum/v1/protocol/CoreumProtocol'
import { OPTIMISM_MAINNET_PROTOCOL_NETWORK } from '@airgap/optimism/v1/protocol/OptimismProtocol'
import { CKBTC_MAINNET_PROTOCOL_NETWORK } from '@airgap/icp/v1/protocol/icrc/CkBTCProtocol'
import { ICPBlockExplorer } from '@airgap/icp'
import { CoreumBlockExplorer } from '@airgap/coreum'
import { EtherscanBlockExplorer } from '@airgap/ethereum'
import { ProtocolOptionsAdapter } from '../../protocol/adapter/protocol-v0-adapter'
import { ModulesController } from '../../services/modules/controller/modules.controller'
import { convertNetworkV1ToV0 } from './protocol-v0-adapter'

export const getProtocolOptionsByIdentifierLegacy: (identifier: ProtocolSymbols, network?: ProtocolNetwork) => ProtocolOptions = (
  identifier: ProtocolSymbols,
  network?: ProtocolNetwork
): ProtocolOptions => {
  switch (identifier) {
    case MainProtocolSymbols.ICP:
      return new ProtocolOptionsAdapter(
        network ?? convertNetworkV1ToV0(ICP_MAINNET_PROTOCOL_NETWORK, new ICPBlockExplorer(ICP_MAINNET_PROTOCOL_NETWORK.blockExplorerUrl))
      )
    case MainProtocolSymbols.ICP_CKBTC:
      return new ProtocolOptionsAdapter(
        network ??
          convertNetworkV1ToV0(CKBTC_MAINNET_PROTOCOL_NETWORK, new ICPBlockExplorer(CKBTC_MAINNET_PROTOCOL_NETWORK.blockExplorerUrl))
      )
    case MainProtocolSymbols.COREUM:
      return new ProtocolOptionsAdapter(
        network ?? convertNetworkV1ToV0(COREUM_PROTOCOL_NETWORK, new CoreumBlockExplorer(COREUM_PROTOCOL_NETWORK.blockExplorerUrl))
      )
    case MainProtocolSymbols.OPTIMISM:
    case SubProtocolSymbols.OPTIMISM_ERC20:
      return new ProtocolOptionsAdapter(
        network ??
          convertNetworkV1ToV0(
            OPTIMISM_MAINNET_PROTOCOL_NETWORK,
            new EtherscanBlockExplorer(OPTIMISM_MAINNET_PROTOCOL_NETWORK.blockExplorerUrl)
          )
      )
    case MainProtocolSymbols.AE:
      return new AeternityProtocolOptions(network ? (network as AeternityProtocolNetwork) : new AeternityProtocolNetwork())
    case MainProtocolSymbols.BTC:
    case MainProtocolSymbols.BTC_SEGWIT:
      return new BitcoinProtocolOptions(network ? (network as BitcoinProtocolNetwork) : new BitcoinProtocolNetwork())
    case MainProtocolSymbols.ETH:
    case SubProtocolSymbols.ETH_ERC20_XCHF:
    case SubProtocolSymbols.ETH_ERC20:
      return new EthereumProtocolOptions(network ? (network as EthereumProtocolNetwork) : new EthereumProtocolNetwork())
    case MainProtocolSymbols.GRS:
      return new GroestlcoinProtocolOptions(network ? (network as GroestlcoinProtocolNetwork) : new GroestlcoinProtocolNetwork())
    case MainProtocolSymbols.COSMOS:
      return new CosmosProtocolOptions(network ? (network as CosmosProtocolNetwork) : new CosmosProtocolNetwork())
    case MainProtocolSymbols.POLKADOT:
      return new PolkadotProtocolOptions(network ? (network as PolkadotProtocolNetwork) : new PolkadotProtocolNetwork())
    case MainProtocolSymbols.KUSAMA:
      return new KusamaProtocolOptions(network ? (network as KusamaProtocolNetwork) : new KusamaProtocolNetwork())
    case MainProtocolSymbols.MOONBASE:
      return new MoonbaseProtocolOptions(network ? (network as MoonbaseProtocolNetwork) : new MoonbaseProtocolNetwork())
    case MainProtocolSymbols.MOONRIVER:
      return new MoonriverProtocolOptions(network ? (network as MoonriverProtocolNetwork) : new MoonriverProtocolNetwork())
    case MainProtocolSymbols.MOONBEAM:
      return new MoonbeamProtocolOptions(network ? (network as MoonbeamProtocolNetwork) : new MoonbeamProtocolNetwork())
    case MainProtocolSymbols.ASTAR:
      return new AstarProtocolOptions(network ? (network as AstarProtocolNetwork) : new AstarProtocolNetwork())
    case MainProtocolSymbols.SHIDEN:
      return new ShidenProtocolOptions(network ? (network as ShidenProtocolNetwork) : new ShidenProtocolNetwork())
    case MainProtocolSymbols.XTZ:
    case SubProtocolSymbols.XTZ_KT:
      return new TezosProtocolOptions(network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork())
    case MainProtocolSymbols.XTZ_SHIELDED:
      return network
        ? new TezosSaplingProtocolOptions(network as TezosProtocolNetwork, new TezosShieldedTezProtocolConfig())
        : new TezosSaplingProtocolOptions()
    case SubProtocolSymbols.XTZ_BTC:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosBTCProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_ETHTZ:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosETHtzProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_UUSD:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosUUSDProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_UBTC:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosUBTCProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_YOU:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosYOUProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_W:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosWrappedProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_KUSD:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosKolibriUSDProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_USD:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosUSDProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_USDT:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosUSDTProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_STKR:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosStakerProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_UDEFI:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosUDEFIProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_CTEZ:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosCTezProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_PLENTY:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosPlentyProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_WRAP:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosWRAPProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_QUIPU:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosQUIPUProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_DOGA:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosDOGAProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_SIRS:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosSIRSProtocolConfig()
      )
    case SubProtocolSymbols.XTZ_BTC_TEZ:
      return new TezosFAProtocolOptions(
        network ? (network as TezosProtocolNetwork) : new TezosProtocolNetwork(),
        new TezosBTCTezProtocolConfig()
      )
    default:
      // Maybe we get an identifier of a sub-protocol that is not in the known list. In that case, get the options of the parent
      if ((identifier as string).includes('-')) {
        return getProtocolOptionsByIdentifierLegacy((identifier as string).split('-')[0] as any)
      }
      assertNever(identifier)
      throw new NotFoundError(Domain.UTILS, `No protocol options found for ${identifier}`)
  }
}

const cache: Record<string, ProtocolOptions> = {}
export const getProtocolOptionsByIdentifier: (
  modulesController: ModulesController,
  identifier: ProtocolSymbols,
  network?: ProtocolNetwork
) => Promise<ProtocolOptions> = async (
  modulesController: ModulesController,
  identifier: ProtocolSymbols,
  network?: ProtocolNetwork
): Promise<ProtocolOptions> => {
  try {
    return getProtocolOptionsByIdentifierLegacy(identifier, network)
  } catch {
    if (network) {
      return { network, config: {} }
    }

    if (!cache[identifier]) {
      const defaultNetwork = await modulesController.getProtocolNetwork(identifier)
      const blockExplorer = defaultNetwork ? await modulesController.getProtocolBlockExplorer(identifier, defaultNetwork) : undefined

      cache[identifier] = new ProtocolOptionsAdapter(
        convertNetworkV1ToV0(defaultNetwork ?? { name: 'Mainnet', type: 'mainnet', rpcUrl: '', blockExplorerUrl: '' }, blockExplorer)
      )
    }

    return cache[identifier]
  }
}
