import { ICoinSubProtocol, ICoinProtocol, ProtocolSymbols } from '@airgap/coinlib-core'
import { ProtocolsMap } from '../store/main/main-protocol-store.service'
import { SubProtocolsMap } from '../store/sub/sub-protocol-store.service'

export async function getIdentifiers(protocols: ProtocolsMap | ICoinProtocol[]): Promise<ProtocolSymbols[]> {
  const protocolsArray: ICoinProtocol[] = Array.isArray(protocols) ? protocols : Array.from(protocols.values())

  return Promise.all(protocolsArray.map((protocol: ICoinProtocol) => protocol.getIdentifier()))
}

export async function getSubIdentifiers(subProtocols: [ICoinProtocol, ICoinSubProtocol][] | SubProtocolsMap): Promise<ProtocolSymbols[]> {
  if (Array.isArray(subProtocols)) {
    return Promise.all(subProtocols.map((pair: [ICoinProtocol, ICoinSubProtocol]) => pair[1].getIdentifier()))
  } else {
    const identifiers: ProtocolSymbols[][] = await Promise.all(
      Object.values(subProtocols).map((values) =>
        Promise.all(Object.values(values).map((protocol: ICoinSubProtocol | undefined) => protocol?.getIdentifier()))
      )
    )

    return identifiers
      .reduce((flatten, toFlatten) => flatten.concat(toFlatten), [])
      .filter((identifier: ProtocolSymbols | undefined) => identifier !== undefined)
  }
}
