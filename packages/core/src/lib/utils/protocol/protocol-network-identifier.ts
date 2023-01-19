/* eslint-disable @typescript-eslint/unified-signatures */
import { ICoinProtocol, ProtocolNetwork, ProtocolSymbols } from '@airgap/coinlib-core'

export async function getProtocolAndNetworkIdentifier(protocol: ICoinProtocol): Promise<string>
export async function getProtocolAndNetworkIdentifier(
  protocolIdentifier: ProtocolSymbols,
  network: ProtocolNetwork | string
): Promise<string>
export async function getProtocolAndNetworkIdentifier(
  protocol: ICoinProtocol | ProtocolSymbols,
  network?: ProtocolNetwork | string
): Promise<string> {
  const protocolIdentifier: string = typeof protocol === 'string' ? protocol : await protocol.getIdentifier()
  const networkIdentifier: string | undefined =
    typeof protocol !== 'string'
      ? (await protocol.getOptions()).network.identifier
      : typeof network === 'string'
      ? network
      : network?.identifier

  return networkIdentifier !== undefined ? `${protocolIdentifier}:${networkIdentifier}` : protocolIdentifier
}
