/* eslint-disable max-lines */
import { AeternityModule, AeternityProtocol, createAeternityProtocol } from '@airgap/aeternity'
import { AstarModule, AstarProtocol, createAstarProtocol, createShidenProtocol, ShidenProtocol } from '@airgap/astar'
import {
  ProtocolNetwork as ProtocolNetworkV0,
  NetworkType as ProtocolNetworkTypeV0,
  ProtocolBlockExplorer as ProtocolBlockExplorerV0,
  FeeDefaults as FeeDefaultsV0,
  IAirGapTransaction as AirGapTransactionV0,
  ProtocolSymbols
} from '@airgap/coinlib-core'
import {
  createERC20Token as createEthereumERC20Token,
  createEthereumProtocol,
  ERC20Token as EthereumERC20Token,
  EthereumModule,
  EthereumProtocol
} from '@airgap/ethereum'
import {
  AirGapAnyProtocol,
  AirGapBlockExplorer as ProtocolBlockExplorerV1,
  AirGapModule,
  AirGapOnlineProtocol,
  AirGapTransaction as AirGapTransactionV1,
  AirGapTransactionStatus as AirGapTransactionStatusV1,
  AirGapUIAction as AirGapUIActionV1,
  AirGapUIAlert as AirGapUIAlertV1,
  AirGapV3SerializerCompanion,
  BytesStringFormat,
  ExtendedPublicKey,
  ExtendedSecretKey,
  FeeDefaults as FeeDefaultsV1,
  isOnlineProtocol,
  newAmount,
  ProtocolConfiguration,
  ProtocolMetadata,
  ProtocolNetwork as ProtocolNetworkV1,
  ProtocolNetworkType as ProtocolNetworkTypeV1,
  ProtocolUnitsMetadata,
  PublicKey,
  RecursivePartial,
  SecretKey,
  SubProtocol
} from '@airgap/module-kit'
import { BitcoinModule, BitcoinProtocol, BitcoinSegwitProtocol, createBitcoinProtocol, createBitcoinSegwitProtocol } from '@airgap/bitcoin'
import { CoreumModule, CoreumProtocol, createCoreumProtocol } from '@airgap/coreum'
import { CosmosModule, CosmosProtocol, createCosmosProtocol } from '@airgap/cosmos'
import { createGroestlcoinProtocol, GroestlcoinModule, GroestlcoinProtocol } from '@airgap/groestlcoin'
import { createICPProtocol, ICPModule, ICPProtocol } from '@airgap/icp'
import {
  createMoonbaseProtocol,
  createMoonbeamProtocol,
  createMoonriverProtocol,
  MoonbaseProtocol,
  MoonbeamModule,
  MoonbeamProtocol,
  MoonriverProtocol
} from '@airgap/moonbeam'
import {
  createERC20Token as createOptimismERC20Token,
  createOptimismProtocol,
  ERC20Token as OptimismERC20Token,
  OptimismModule,
  OptimismProtocol
} from '@airgap/optimism'
import { createKusamaProtocol, createPolkadotProtocol, KusamaProtocol, PolkadotModule, PolkadotProtocol } from '@airgap/polkadot'
import {
  BTCTezProtocol,
  createBTCTezProtocol,
  createCTezProtocol,
  createDogamiProtocol,
  createETHTezProtocol,
  createKolibriUSDProtocol,
  createPlentyProtocol,
  createQuipuswapProtocol,
  createSiriusProtocol,
  createStakerProtocol,
  createTetherUSDProtocol,
  createTezosFA1p2Protocol,
  createTezosFA2Protocol,
  createTezosKtProtocol,
  createTezosProtocol,
  createTezosShieldedTezProtocol,
  createTzBTCProtocol,
  createUBTCProtocol,
  createUDEFIProtocol,
  createUSDTezProtocol,
  createUUSDProtocol,
  createWrappedTezosProtocol,
  createWrapProtocol,
  createYouProtocol,
  CTezProtocol,
  DogamiProtocol,
  ETHTezProtocol,
  KolibriUSDProtocol,
  PlentyProtocol,
  QuipuswapProtocol,
  SiriusProtocol,
  StakerProtocol,
  TetherUSDProtocol,
  TezosFA1p2Protocol,
  TezosFA2Protocol,
  TezosFAProtocol,
  TezosKtProtocol,
  TezosModule,
  TezosProtocol,
  TezosProtocolNetwork,
  TezosShieldedTezProtocol,
  TzBTCProtocol,
  UBTCProtocol,
  UDEFIProtocol,
  USDTezProtocol,
  UUSDProtocol,
  WrappedTezosProtocol,
  WrapProtocol,
  YouProtocol
} from '@airgap/tezos'
import BigNumber from '@airgap/coinlib-core/dependencies/src/bignumber.js-9.0.0/bignumber'

import {
  AirGapTransactionStatus as AirGapTransactionStatusV0,
  AirGapTransactionWarning as AirGapUIAlertV0,
  AirGapTransactionWarningType
} from '@airgap/coinlib-core/interfaces/IAirGapTransaction'
import { isHex } from '@airgap/coinlib-core/utils/hex'

import {
  createICoinProtocolAdapter,
  createICoinSubProtocolAdapter,
  ICoinProtocolAdapter,
  ICoinSubProtocolAdapter,
  ProtocolBlockExplorerAdapter,
  ProtocolNetworkAdapter
} from '../../protocol/adapter/protocol-v0-adapter'

// Network

export function convertNetworkTypeV0ToV1(type: ProtocolNetworkTypeV0): ProtocolNetworkTypeV1 {
  return type === ProtocolNetworkTypeV0.MAINNET ? 'mainnet' : type === ProtocolNetworkTypeV0.TESTNET ? 'testnet' : 'custom'
}

export function convertNetworkTypeV1ToV0(type: ProtocolNetworkTypeV1): ProtocolNetworkTypeV0 {
  return type === 'mainnet'
    ? ProtocolNetworkTypeV0.MAINNET
    : type === 'testnet'
    ? ProtocolNetworkTypeV0.TESTNET
    : ProtocolNetworkTypeV0.CUSTOM
}

export function convertNetworkV0ToV1(network: ProtocolNetworkV0): ProtocolNetworkV1 {
  return {
    name: network.name,
    type: convertNetworkTypeV0ToV1(network.type),
    rpcUrl: network.rpcUrl,
    blockExplorerUrl: network.blockExplorer.blockExplorer,
    ...(typeof network.extras === 'object' ? network.extras : {})
  }
}

export function convertNetworkV1ToV0(network: ProtocolNetworkV1, blockExplorer?: ProtocolBlockExplorerV1): ProtocolNetworkV0 {
  const { name, type, rpcUrl, ...rest } = network
  const blockExplorerV0: ProtocolBlockExplorerV0 = new ProtocolBlockExplorerAdapter(blockExplorer, network.blockExplorerUrl)

  return new ProtocolNetworkAdapter(name, convertNetworkTypeV1ToV0(type), rpcUrl, blockExplorerV0, rest)
}

// Protocol

async function createAdapterSupplementsFromIdentifierAndNetwork(
  module: AirGapModule,
  identifier: string,
  network: ProtocolNetworkV1 | undefined
): Promise<[ProtocolBlockExplorerV1, AirGapV3SerializerCompanion]> {
  const [blockExplorer, v3SerializerCompanion] = await Promise.all([
    module.createBlockExplorer(identifier, network),
    module.createV3SerializerCompanion()
  ])

  return [blockExplorer, v3SerializerCompanion]
}

async function createAdapterSupplementsFromProtocol<T extends AirGapAnyProtocol>(
  protocol: T,
  module: AirGapModule
): Promise<[ProtocolBlockExplorerV1, AirGapV3SerializerCompanion]> {
  const [metadata, network]: [ProtocolMetadata, ProtocolNetworkV1 | undefined] = await Promise.all([
    protocol.getMetadata(),
    isOnlineProtocol(protocol) ? protocol.getNetwork() : Promise.resolve(undefined)
  ])

  return createAdapterSupplementsFromIdentifierAndNetwork(module, metadata.identifier, network)
}

export async function createV0Protocol<T extends AirGapAnyProtocol>(
  protocol: T,
  module: AirGapModule,
  type: ProtocolConfiguration['type'] = 'full'
): Promise<ICoinProtocolAdapter<T>> {
  const [blockExplorer, v3SerializerCompanion]: [ProtocolBlockExplorerV1, AirGapV3SerializerCompanion] =
    await createAdapterSupplementsFromProtocol(protocol, module)

  return createICoinProtocolAdapter(protocol, blockExplorer, v3SerializerCompanion, { type })
}

export async function createV0SubProtocol<T extends AirGapAnyProtocol & SubProtocol>(
  protocol: T,
  module: AirGapModule,
  type: ProtocolConfiguration['type'] = 'full'
): Promise<ICoinSubProtocolAdapter<T>> {
  const [blockExplorer, v3SerializerCompanion]: [ProtocolBlockExplorerV1, AirGapV3SerializerCompanion] =
    await createAdapterSupplementsFromProtocol(protocol, module)

  return createICoinSubProtocolAdapter(protocol, blockExplorer, v3SerializerCompanion, { type })
}

export async function createV0ERC20Token<T extends AirGapAnyProtocol & SubProtocol>(
  erc20Token: T,
  protocol: AirGapAnyProtocol,
  module: AirGapModule,
  type: ProtocolConfiguration['type'] = 'full'
): Promise<ICoinSubProtocolAdapter<T>> {
  const [metadata, network]: [ProtocolMetadata, ProtocolNetworkV1 | undefined] = await Promise.all([
    protocol.getMetadata(),
    isOnlineProtocol(erc20Token) ? erc20Token.getNetwork() : Promise.resolve(undefined)
  ])

  const [blockExplorer, v3SerializerCompanion] = await createAdapterSupplementsFromIdentifierAndNetwork(
    module,
    metadata.identifier,
    network
  )

  return createICoinSubProtocolAdapter(erc20Token, blockExplorer, v3SerializerCompanion, { type })
}

export async function createV0AeternityProtocol(
  ...args: Parameters<typeof createAeternityProtocol>
): Promise<ICoinProtocolAdapter<AeternityProtocol>> {
  const protocol: AeternityProtocol = createAeternityProtocol(...args)
  const module: AeternityModule = new AeternityModule()

  return createV0Protocol(protocol, module)
}

export async function createV0AstarProtocol(...args: Parameters<typeof createAstarProtocol>): Promise<ICoinProtocolAdapter<AstarProtocol>> {
  const protocol: AstarProtocol = createAstarProtocol(...args)
  const module: AstarModule = new AstarModule()

  return createV0Protocol(protocol, module)
}

export async function createV0ShidenProtocol(
  ...args: Parameters<typeof createShidenProtocol>
): Promise<ICoinProtocolAdapter<ShidenProtocol>> {
  const protocol: ShidenProtocol = createShidenProtocol(...args)
  const module: AstarModule = new AstarModule()

  return createV0Protocol(protocol, module)
}

export async function createV0BitcoinProtocol(
  ...args: Parameters<typeof createBitcoinProtocol>
): Promise<ICoinProtocolAdapter<BitcoinProtocol>> {
  const protocol: BitcoinProtocol = createBitcoinProtocol(...args)
  const module: BitcoinModule = new BitcoinModule()

  return createV0Protocol(protocol, module)
}

export async function createV0BitcoinSegwitProtocol(
  ...args: Parameters<typeof createBitcoinSegwitProtocol>
): Promise<ICoinProtocolAdapter<BitcoinSegwitProtocol>> {
  const protocol: BitcoinSegwitProtocol = createBitcoinSegwitProtocol(...args)
  const module: BitcoinModule = new BitcoinModule()

  return createV0Protocol(protocol, module)
}

export async function createV0CoreumProtocol(
  ...args: Parameters<typeof createCoreumProtocol>
): Promise<ICoinProtocolAdapter<CoreumProtocol>> {
  const protocol: CoreumProtocol = createCoreumProtocol(...args)
  const module: CoreumModule = new CoreumModule()

  return createV0Protocol(protocol, module)
}

export async function createV0CosmosProtocol(
  ...args: Parameters<typeof createCosmosProtocol>
): Promise<ICoinProtocolAdapter<CosmosProtocol>> {
  const protocol: CosmosProtocol = createCosmosProtocol(...args)
  const module: CosmosModule = new CosmosModule()

  return createV0Protocol(protocol, module)
}

export async function createV0EthereumProtocol(
  ...args: Parameters<typeof createEthereumProtocol>
): Promise<ICoinProtocolAdapter<EthereumProtocol>> {
  const protocol: EthereumProtocol = createEthereumProtocol(...args)
  const module: EthereumModule = new EthereumModule()

  return createV0Protocol(protocol, module)
}

export async function createV0EthereumERC20Token(
  ...args: Parameters<typeof createEthereumERC20Token>
): Promise<ICoinSubProtocolAdapter<EthereumERC20Token>> {
  const erc20Token: EthereumERC20Token = createEthereumERC20Token(...args)
  const ethereumProtocol: EthereumProtocol = createEthereumProtocol(args[1])
  const module: EthereumModule = new EthereumModule()

  return createV0ERC20Token(erc20Token, ethereumProtocol, module)
}

export async function createV0GroestlcoinProtocol(
  ...args: Parameters<typeof createGroestlcoinProtocol>
): Promise<ICoinProtocolAdapter<GroestlcoinProtocol>> {
  const protocol: GroestlcoinProtocol = createGroestlcoinProtocol(...args)
  const module: GroestlcoinModule = new GroestlcoinModule()

  return createV0Protocol(protocol, module)
}

export async function createV0ICPProtocol(...args: Parameters<typeof createICPProtocol>): Promise<ICoinProtocolAdapter<ICPProtocol>> {
  const protocol: ICPProtocol = createICPProtocol(...args)
  const module: ICPModule = new ICPModule()

  return createV0Protocol(protocol, module)
}

export async function createV0MoonbeamProtocol(
  ...args: Parameters<typeof createMoonbeamProtocol>
): Promise<ICoinProtocolAdapter<MoonbeamProtocol>> {
  const protocol: MoonbeamProtocol = createMoonbeamProtocol(...args)
  const module: MoonbeamModule = new MoonbeamModule()

  return createV0Protocol(protocol, module)
}

export async function createV0MoonriverProtocol(
  ...args: Parameters<typeof createMoonriverProtocol>
): Promise<ICoinProtocolAdapter<MoonriverProtocol>> {
  const protocol: MoonriverProtocol = createMoonriverProtocol(...args)
  const module: MoonbeamModule = new MoonbeamModule()

  return createV0Protocol(protocol, module)
}

export async function createV0MoonbaseProtocol(
  ...args: Parameters<typeof createMoonbaseProtocol>
): Promise<ICoinProtocolAdapter<MoonbaseProtocol>> {
  const protocol: MoonbaseProtocol = createMoonbaseProtocol(...args)
  const module: MoonbeamModule = new MoonbeamModule()

  return createV0Protocol(protocol, module)
}

export async function createV0OptimismProtocol(
  ...args: Parameters<typeof createOptimismProtocol>
): Promise<ICoinProtocolAdapter<OptimismProtocol>> {
  const protocol: OptimismProtocol = createOptimismProtocol(...args)
  const module: OptimismModule = new OptimismModule()

  return createV0Protocol(protocol, module)
}

export async function createV0OptimismERC20Token(
  ...args: Parameters<typeof createOptimismERC20Token>
): Promise<ICoinSubProtocolAdapter<OptimismERC20Token>> {
  const erc20Token: OptimismERC20Token = createOptimismERC20Token(...args)
  const optimismProtocol: OptimismProtocol = createOptimismProtocol(args[1])
  const module: OptimismModule = new OptimismModule()

  return createV0ERC20Token(erc20Token, optimismProtocol, module)
}

export async function createV0PolkadotProtocol(
  ...args: Parameters<typeof createPolkadotProtocol>
): Promise<ICoinProtocolAdapter<PolkadotProtocol>> {
  const protocol: PolkadotProtocol = createPolkadotProtocol(...args)
  const module: PolkadotModule = new PolkadotModule()

  return createV0Protocol(protocol, module)
}

export async function createV0KusamaProtocol(
  ...args: Parameters<typeof createKusamaProtocol>
): Promise<ICoinProtocolAdapter<KusamaProtocol>> {
  const protocol: KusamaProtocol = createKusamaProtocol(...args)
  const module: PolkadotModule = new PolkadotModule()

  return createV0Protocol(protocol, module)
}

export async function createV0TezosProtocol(...args: Parameters<typeof createTezosProtocol>): Promise<ICoinProtocolAdapter<TezosProtocol>> {
  const protocol: TezosProtocol = createTezosProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0Protocol(protocol, module)
}

export async function createV0TezosShieldedTezProtocol(
  ...args: Parameters<typeof createTezosShieldedTezProtocol>
): Promise<ICoinProtocolAdapter<TezosShieldedTezProtocol>> {
  const protocol: TezosShieldedTezProtocol = createTezosShieldedTezProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0Protocol(protocol, module)
}

export async function createV0TezosKtProtocol(
  ...args: Parameters<typeof createTezosKtProtocol>
): Promise<ICoinSubProtocolAdapter<TezosKtProtocol>> {
  const protocol: TezosKtProtocol = createTezosKtProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

async function createV0TezosFAProtocol<T extends TezosFAProtocol>(
  faProtocol: T,
  tezosNetwork?: RecursivePartial<TezosProtocolNetwork>,
  type: ProtocolConfiguration['type'] = 'full'
): Promise<ICoinSubProtocolAdapter<T>> {
  const tezosProtocol: TezosProtocol = createTezosProtocol({ network: tezosNetwork })
  const module: TezosModule = new TezosModule()

  const [metadata, network]: [ProtocolMetadata, ProtocolNetworkV1 | undefined] = await Promise.all([
    tezosProtocol.getMetadata(),
    isOnlineProtocol(faProtocol) ? faProtocol.getNetwork() : Promise.resolve(undefined)
  ])

  const [blockExplorer, v3SerializerCompanion] = await createAdapterSupplementsFromIdentifierAndNetwork(
    module,
    metadata.identifier,
    network
  )

  return createICoinSubProtocolAdapter(faProtocol, blockExplorer, v3SerializerCompanion, { type })
}

export async function createV0TezosFA1p2Protocol(
  ...args: Parameters<typeof createTezosFA1p2Protocol>
): Promise<ICoinSubProtocolAdapter<TezosFA1p2Protocol>> {
  const fa1p2Protocol: TezosFA1p2Protocol = createTezosFA1p2Protocol(...args)

  return createV0TezosFAProtocol(fa1p2Protocol, args[0].network)
}

export async function createV0TezosFA2Protocol(
  ...args: Parameters<typeof createTezosFA2Protocol>
): Promise<ICoinSubProtocolAdapter<TezosFA2Protocol>> {
  const fa2Protocol: TezosFA2Protocol = createTezosFA2Protocol(...args)

  return createV0TezosFAProtocol(fa2Protocol, args[0].network)
}

export async function createV0TezosBTCTezProtocol(
  ...args: Parameters<typeof createBTCTezProtocol>
): Promise<ICoinSubProtocolAdapter<BTCTezProtocol>> {
  const protocol: BTCTezProtocol = createBTCTezProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosCTezProtocol(
  ...args: Parameters<typeof createCTezProtocol>
): Promise<ICoinSubProtocolAdapter<CTezProtocol>> {
  const protocol: CTezProtocol = createCTezProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosDogamiProtocol(
  ...args: Parameters<typeof createDogamiProtocol>
): Promise<ICoinSubProtocolAdapter<DogamiProtocol>> {
  const protocol: DogamiProtocol = createDogamiProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosETHTezProtocol(
  ...args: Parameters<typeof createETHTezProtocol>
): Promise<ICoinSubProtocolAdapter<ETHTezProtocol>> {
  const protocol: ETHTezProtocol = createETHTezProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosKolibriUSDProtocol(
  ...args: Parameters<typeof createKolibriUSDProtocol>
): Promise<ICoinSubProtocolAdapter<KolibriUSDProtocol>> {
  const protocol: KolibriUSDProtocol = createKolibriUSDProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosPlentyProtocol(
  ...args: Parameters<typeof createPlentyProtocol>
): Promise<ICoinSubProtocolAdapter<PlentyProtocol>> {
  const protocol: PlentyProtocol = createPlentyProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosQuipuswapProtocol(
  ...args: Parameters<typeof createQuipuswapProtocol>
): Promise<ICoinSubProtocolAdapter<QuipuswapProtocol>> {
  const protocol: QuipuswapProtocol = createQuipuswapProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosSiriusProtocol(
  ...args: Parameters<typeof createSiriusProtocol>
): Promise<ICoinSubProtocolAdapter<SiriusProtocol>> {
  const protocol: SiriusProtocol = createSiriusProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosStakerProtocol(
  ...args: Parameters<typeof createStakerProtocol>
): Promise<ICoinSubProtocolAdapter<StakerProtocol>> {
  const protocol: StakerProtocol = createStakerProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosTetherUSDProtocol(
  ...args: Parameters<typeof createTetherUSDProtocol>
): Promise<ICoinSubProtocolAdapter<TetherUSDProtocol>> {
  const protocol: TetherUSDProtocol = createTetherUSDProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosTzBTCProtocol(
  ...args: Parameters<typeof createTzBTCProtocol>
): Promise<ICoinSubProtocolAdapter<TzBTCProtocol>> {
  const protocol: TzBTCProtocol = createTzBTCProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosUBTCProtocol(
  ...args: Parameters<typeof createUBTCProtocol>
): Promise<ICoinSubProtocolAdapter<UBTCProtocol>> {
  const protocol: UBTCProtocol = createUBTCProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosUDEFIProtocol(
  ...args: Parameters<typeof createUDEFIProtocol>
): Promise<ICoinSubProtocolAdapter<UDEFIProtocol>> {
  const protocol: UDEFIProtocol = createUDEFIProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosUSDTezProtocol(
  ...args: Parameters<typeof createUSDTezProtocol>
): Promise<ICoinSubProtocolAdapter<USDTezProtocol>> {
  const protocol: USDTezProtocol = createUSDTezProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosUUSDProtocol(
  ...args: Parameters<typeof createUUSDProtocol>
): Promise<ICoinSubProtocolAdapter<UUSDProtocol>> {
  const protocol: UUSDProtocol = createUUSDProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosWrappedProtocol(
  ...args: Parameters<typeof createWrappedTezosProtocol>
): Promise<ICoinSubProtocolAdapter<WrappedTezosProtocol>> {
  const protocol: WrappedTezosProtocol = createWrappedTezosProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosWrapProtocol(
  ...args: Parameters<typeof createWrapProtocol>
): Promise<ICoinSubProtocolAdapter<WrapProtocol>> {
  const protocol: WrapProtocol = createWrapProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

export async function createV0TezosYouProtocol(
  ...args: Parameters<typeof createYouProtocol>
): Promise<ICoinSubProtocolAdapter<YouProtocol>> {
  const protocol: YouProtocol = createYouProtocol(...args)
  const module: TezosModule = new TezosModule()

  return createV0SubProtocol(protocol, module)
}

// Transaction

export function convertTransactionStatusV1ToV0(status: AirGapTransactionStatusV1): AirGapTransactionStatusV0 {
  return status.type === 'applied'
    ? AirGapTransactionStatusV0.APPLIED
    : status.type === 'failed'
    ? AirGapTransactionStatusV0.FAILED
    : undefined
}

function convertUIActionsV1ToV0(actions: AirGapUIActionV1[]): AirGapUIAlertV0['actions'] {
  return actions.map((action: AirGapUIActionV1) => ({
    text: action.text.value,
    link: ''
  }))
}

function convertUIAlertsV1ToV0(alerts: AirGapUIAlertV1[]): AirGapUIAlertV0[] {
  return alerts.map((alert: AirGapUIAlertV1) => ({
    type:
      alert.type === 'success'
        ? AirGapTransactionWarningType.SUCCESS
        : alert.type === 'info'
        ? AirGapTransactionWarningType.NOTE
        : alert.type === 'warning'
        ? AirGapTransactionWarningType.WARNING
        : AirGapTransactionWarningType.ERROR,
    title: alert.title.value,
    description: alert.description.value,
    icon: alert.icon,
    actions: alert.actions ? convertUIActionsV1ToV0(alert.actions) : undefined
  }))
}

export async function convertTransactionDetailsV1ToV0(
  txs: AirGapTransactionV1[],
  protocol: AirGapOnlineProtocol
): Promise<AirGapTransactionV0[]>
// eslint-disable-next-line no-redeclare
export async function convertTransactionDetailsV1ToV0(
  txs: AirGapTransactionV1[],
  metadata: ProtocolMetadata,
  network: ProtocolNetworkV1 | ProtocolNetworkV0
): Promise<AirGapTransactionV0[]>
// eslint-disable-next-line no-redeclare
export async function convertTransactionDetailsV1ToV0(
  txs: AirGapTransactionV1[],
  protocolOrMetadata: AirGapOnlineProtocol | ProtocolMetadata,
  networkOrUndefined?: ProtocolNetworkV1 | ProtocolNetworkV0
): Promise<AirGapTransactionV0[]> {
  const protocolMetadata: ProtocolMetadata = isOnlineProtocol(protocolOrMetadata)
    ? await protocolOrMetadata.getMetadata()
    : protocolOrMetadata

  const networkV0: ProtocolNetworkV0 = isOnlineProtocol(protocolOrMetadata)
    ? convertNetworkV1ToV0(await protocolOrMetadata.getNetwork())
    : networkOrUndefined instanceof ProtocolNetworkV0
    ? networkOrUndefined
    : convertNetworkV1ToV0(networkOrUndefined)

  const units: ProtocolUnitsMetadata = protocolMetadata.units
  const feeUnits: ProtocolUnitsMetadata = protocolMetadata.fee?.units ?? units

  return txs.map(
    (tx: AirGapTransactionV1): AirGapTransactionV0 => ({
      from: tx.from,
      to: tx.to,
      isInbound: tx.isInbound,

      amount: newAmount(tx.amount).blockchain(units).value,
      fee: newAmount(tx.fee).blockchain(feeUnits).value,

      timestamp: tx.timestamp,

      protocolIdentifier: protocolMetadata.identifier as ProtocolSymbols,
      network: networkV0,

      data: typeof tx.arbitraryData === 'string' ? tx.arbitraryData : tx.arbitraryData?.[1],

      hash: tx.status?.hash,
      blockHeight: tx.status?.block,
      status: tx.status ? convertTransactionStatusV1ToV0(tx.status) : undefined,

      warnings: tx.uiAlerts ? convertUIAlertsV1ToV0(tx.uiAlerts) : undefined,

      extra: {
        ...tx.extra,
        type: tx.type
      },
      transactionDetails: tx.json
    })
  )
}

// FeeDefaults

export function convertFeeDefaultsV0ToV1<_FeeUnits extends string>(feeDefaults: FeeDefaultsV0, decimals: number): FeeDefaultsV1<_FeeUnits> {
  return {
    low: newAmount(new BigNumber(feeDefaults.low).shiftedBy(decimals), 'blockchain'),
    medium: newAmount(new BigNumber(feeDefaults.medium).shiftedBy(decimals), 'blockchain'),
    high: newAmount(new BigNumber(feeDefaults.high).shiftedBy(decimals), 'blockchain')
  }
}

export function convertFeeDefaultsV1ToV0(feeDefaults: FeeDefaultsV1, protocolMetadata: ProtocolMetadata): FeeDefaultsV0 {
  const feeUnits: ProtocolUnitsMetadata = protocolMetadata.fee?.units ?? protocolMetadata.units
  const feeUnit: string = protocolMetadata.fee?.mainUnit ?? protocolMetadata.mainUnit

  return {
    low: new BigNumber(newAmount(feeDefaults.low).convert(feeUnit, feeUnits).value).toFixed(),
    medium: new BigNumber(newAmount(feeDefaults.medium).convert(feeUnit, feeUnits).value).toFixed(),
    high: new BigNumber(newAmount(feeDefaults.high).convert(feeUnit, feeUnits).value).toFixed()
  }
}

// Bytes

export function getBytesFormatV1FromV0(bytes: string): BytesStringFormat {
  return isHex(bytes) ? 'hex' : 'encoded'
}

export function getSecretKeyType(secretKey: string): SecretKey['type'] | ExtendedSecretKey['type'] {
  return secretKey.startsWith('xprv') ? 'xpriv' : 'priv'
}

export function getPublicKeyType(publicKey: string): PublicKey['type'] | ExtendedPublicKey['type'] {
  return publicKey.startsWith('xpub') ? 'xpub' : 'pub'
}
