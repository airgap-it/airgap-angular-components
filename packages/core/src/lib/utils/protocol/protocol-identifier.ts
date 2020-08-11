import { ProtocolSymbols, MainProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'

export function getMainIdentifier(subIdentifier: ProtocolSymbols): MainProtocolSymbols {
  return subIdentifier.split('-')[0] as MainProtocolSymbols
}