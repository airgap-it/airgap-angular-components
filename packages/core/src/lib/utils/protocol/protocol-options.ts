/* eslint-disable complexity */
import { AeternityProtocolNetwork, AeternityProtocolOptions } from '@airgap/aeternity'
import { BitcoinProtocolNetwork, BitcoinProtocolOptions } from '@airgap/bitcoin'
import { CosmosProtocolNetwork, CosmosProtocolOptions } from '@airgap/cosmos'
import { EthereumProtocolNetwork, EthereumProtocolOptions } from '@airgap/ethereum'
import { GroestlcoinProtocolNetwork, GroestlcoinProtocolOptions } from '@airgap/groestlcoin'
import { KusamaProtocolNetwork, KusamaProtocolOptions, PolkadotProtocolNetwork, PolkadotProtocolOptions } from '@airgap/polkadot'
import { MoonbaseProtocolNetwork, MoonbaseProtocolOptions, MoonriverProtocolNetwork, MoonriverProtocolOptions } from '@airgap/moonbeam'
import { AstarProtocolNetwork, AstarProtocolOptions, ShidenProtocolNetwork, ShidenProtocolOptions } from '@airgap/astar'
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
} from '@airgap/tezos'
import {
  ProtocolSymbols,
  ProtocolNetwork,
  MainProtocolSymbols,
  SubProtocolSymbols,
  assertNever,
  Domain,
  NetworkType
} from '@airgap/coinlib-core'
import { NotFoundError } from '@airgap/coinlib-core/errors'
import { ProtocolOptions } from '@airgap/coinlib-core/utils/ProtocolOptions'
import { MoonbeamProtocolOptions, MoonbeamProtocolNetwork } from '@airgap/moonbeam/v0/protocol/moonbeam/MoonbeamProtocolOptions'
import { TezosETHtzProtocolConfig } from '@airgap/tezos/v0/protocol/fa/TezosFAProtocolOptions'
import { ICP_MAINNET_PROTOCOL_NETWORK } from '@airgap/icp/v1/protocol/ICPProtocol'
import { COREUM_PROTOCOL_NETWORK } from '@airgap/coreum/v1/protocol/CoreumProtocol'
import { ProtocolNetwork as ProtocolNetworkV1 } from '@airgap/module-kit'
import { CKBTC_MAINNET_PROTOCOL_NETWORK } from '@airgap/icp/v1/protocol/icrc/CkBTCProtocol'
import { ProtocolNetworkAdapter, ProtocolOptionsAdapter } from '../../protocol/adapter/protocol-v0-adapter'
import { IsolatedModulesPlugin } from '../../capacitor-plugins/definitions'

export const getProtocolOptionsByIdentifierLegacy: (identifier: ProtocolSymbols, network?: ProtocolNetwork) => ProtocolOptions = (
  identifier: ProtocolSymbols,
  network?: ProtocolNetwork
): ProtocolOptions => {
  switch (identifier) {
    case MainProtocolSymbols.ICP:
      return new ProtocolOptionsAdapter(
        network ?? new ProtocolNetworkAdapter(ICP_MAINNET_PROTOCOL_NETWORK.name, NetworkType.MAINNET, ICP_MAINNET_PROTOCOL_NETWORK.rpcUrl)
      )
    case MainProtocolSymbols.ICP_CKBTC:
      return new ProtocolOptionsAdapter(
        network ??
          new ProtocolNetworkAdapter(CKBTC_MAINNET_PROTOCOL_NETWORK.name, NetworkType.MAINNET, CKBTC_MAINNET_PROTOCOL_NETWORK.rpcUrl)
      )
    case MainProtocolSymbols.COREUM:
      return new ProtocolOptionsAdapter(
        network ?? new ProtocolNetworkAdapter(COREUM_PROTOCOL_NETWORK.name, NetworkType.MAINNET, COREUM_PROTOCOL_NETWORK.rpcUrl)
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
  isolatedModules: IsolatedModulesPlugin,
  identifier: ProtocolSymbols,
  network?: ProtocolNetwork
) => Promise<ProtocolOptions> = async (
  isolatedModules: IsolatedModulesPlugin,
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
      const defaultNetwork = (
        await isolatedModules.callMethod({
          target: 'onlineProtocol',
          method: 'getNetwork',
          protocolIdentifier: identifier
        })
      ).value as ProtocolNetworkV1

      cache[identifier] = new ProtocolOptionsAdapter(
        new ProtocolNetworkAdapter(defaultNetwork?.name ?? 'Mainnet', defaultNetwork?.type ?? 'mainnet', defaultNetwork?.rpcUrl ?? '')
      )
    }

    return cache[identifier]
  }
}
