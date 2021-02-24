import { ProtocolSymbols, MainProtocolSymbols } from '@airgap/coinlib-core'

export function getMainIdentifier(subIdentifier: ProtocolSymbols): MainProtocolSymbols {
  return subIdentifier.split('-')[0] as MainProtocolSymbols
}
