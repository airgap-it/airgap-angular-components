import { ProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { ICoinSubProtocol, ICoinProtocol } from 'airgap-coin-lib'
import { SubProtocolsMap } from '../store/sub/sub-protocol-store.service'

export function getIdentifiers(protocols: ICoinProtocol[]): ProtocolSymbols[] {
  return protocols.map((protocol: ICoinProtocol) => protocol.identifier)
}

export function getSubIdentifiers(subProtocols: [ICoinProtocol, ICoinSubProtocol][] | SubProtocolsMap): ProtocolSymbols[] {
  return Array.isArray(subProtocols)
    ? subProtocols.map((pair: [ICoinProtocol, ICoinSubProtocol]) => pair[1].identifier)
    : (Object.values(subProtocols)
        .map((values) => Object.values(values).map((protocol: ICoinSubProtocol | undefined) => protocol?.identifier))
        .reduce((flatten, toFlatten) => flatten.concat(toFlatten), [])
        .filter((identifier: ProtocolSymbols | undefined) => identifier !== undefined) as ProtocolSymbols[])
}
