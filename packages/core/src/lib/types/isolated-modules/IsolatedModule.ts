/* eslint-disable spaced-comment */
import {
  BlockExplorerMetadata,
  ProtocolConfiguration,
  ProtocolMetadata,
  ProtocolNetwork,
  SubProtocolType,
  V3SchemaConfiguration
} from '@airgap/module-kit'

/***** IsolatedModule ******/

export type IsolatedModuleType = 'static' | 'dynamic'

export interface IsolatedModule {
  identifier: string
  type: IsolatedModuleType
  protocols: IsolatedProtocol[]
  v3SchemaConfigurations: V3SchemaConfiguration[]
}

interface IsolatedAnyProtocol<T extends string> {
  type: T
  mode: ProtocolConfiguration['type']
  identifier: string
  protocolMetadata: ProtocolMetadata
  blockExplorerMetadata: BlockExplorerMetadata | null
  network: ProtocolNetwork | null
  methods: string[]
}
type IsolatedMainProtocol = IsolatedAnyProtocol<'main'>
interface IsolatedSubProtocol extends IsolatedAnyProtocol<'sub'> {
  subType: SubProtocolType
  mainProtocolIdentifier: string
  contractAddress: string | null
}

export type IsolatedProtocol = IsolatedMainProtocol | IsolatedSubProtocol
