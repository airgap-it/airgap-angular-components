import { AirGapWallet } from '@airgap/coinlib-core'
import {
  AirGapAnyProtocol,
  AirGapBlockExplorer,
  AirGapV3SerializerCompanion,
  ProtocolConfiguration,
  ProtocolNetwork
} from '@airgap/module-kit'

export interface LoadedModule {
  protocols: LoadedProtocol[]
  v3SerializerCompanion: AirGapV3SerializerCompanion
}

export interface LoadedProtocol {
  protocol: AirGapAnyProtocol
  blockExplorer?: AirGapBlockExplorer
}

export interface BaseModulesController {
  loadModules(protocolType?: ProtocolConfiguration['type'], ignoreProtocols?: string[]): Promise<LoadedModule[]>
  isProtocolSupported(identifier: string): boolean

  getProtocolNetwork(protocolIdentifier: string, networkId?: string): Promise<ProtocolNetwork | undefined>
  getProtocolBlockExplorer(protocolIdentifier: string, network: string | ProtocolNetwork): Promise<AirGapBlockExplorer | undefined>

  deriveAddresses(wallets: AirGapWallet[], amount?: number): Promise<Record<string, string[]>>
}
