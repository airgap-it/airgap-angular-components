/* eslint-disable @typescript-eslint/unified-signatures */
import { ICoinProtocol } from 'airgap-coin-lib'
import { ProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { ProtocolNetwork } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'

export function getProtocolAndNetworkIdentifier(protocol: ICoinProtocol): string
export function getProtocolAndNetworkIdentifier(protocolIdentifier: ProtocolSymbols, network: ProtocolNetwork): string
export function getProtocolAndNetworkIdentifier(protocolIdentifier: ProtocolSymbols, networkIdentifier: string): string
export function getProtocolAndNetworkIdentifier(protocol: ICoinProtocol | ProtocolSymbols, network?: ProtocolNetwork | string): string {
  const protocolIdentifier: string = typeof protocol === 'string' ? protocol : protocol.identifier
  const networkIdentifier: string | undefined = typeof protocol !== 'string' 
    ? protocol.options.network.identifier 
    : typeof network === 'string'
      ? network
      : network?.identifier

  return networkIdentifier !== undefined ? `${protocolIdentifier}:${networkIdentifier}` : protocolIdentifier
}