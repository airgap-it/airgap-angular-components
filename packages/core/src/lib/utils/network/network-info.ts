import { NetworkType, ProtocolNetwork } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { NetworkInfo } from '../../types/NetworkInfo'

export function getNetworkInfo(network: ProtocolNetwork): NetworkInfo {
  const splits: string[] = network.identifier.split('-')
  
  return {
    type: splits[0] as NetworkType,
    name: splits[1],
    rpcUrl: splits[2]
  }
}
