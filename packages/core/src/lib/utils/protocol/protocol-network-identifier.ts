import { ICoinProtocol, ProtocolNetwork, ProtocolSymbols } from '@airgap/coinlib-core'
import { RuntimeMode } from '../../types/RuntimeMode'

export async function getProtocolAndNetworkIdentifier(
  mode: RuntimeMode,
  protocol: ICoinProtocol | ProtocolSymbols,
  network?: ProtocolNetwork | string
): Promise<string> {
  const protocolIdentifier: string = typeof protocol === 'string' ? protocol : await protocol.getIdentifier()
  if (mode === RuntimeMode.OFFLINE) {
    return protocolIdentifier
  }

  const networkIdentifier: string | undefined =
    typeof protocol !== 'string'
      ? (await protocol.getOptions()).network.identifier
      : typeof network === 'string'
      ? network
      : network?.identifier

  return networkIdentifier !== undefined ? `${protocolIdentifier}:${networkIdentifier}` : protocolIdentifier
}

export function splitProtocolNetworkIdentifier(protocolAndNetworkIdentifier: string): { protocol: ProtocolSymbols; network?: string } {
  const [protocol, network]: string[] = protocolAndNetworkIdentifier.split(':', 2)

  return { protocol: protocol as ProtocolSymbols, network }
}
