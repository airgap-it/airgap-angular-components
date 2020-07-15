import { NetworkType } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'

export interface NetworkInfo {
  type: NetworkType
  name: string
  rpcUrl: string
}