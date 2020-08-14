import { SubProtocolSymbols, ProtocolSymbols, MainProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { ICoinSubProtocol, ICoinProtocol } from 'airgap-coin-lib'
import { Token } from '../../../types/Token'
import { ethTokens } from '../tokens'
import { activeEthTokens, SubProtocolsMap } from '../internal/sub/sub-protocol.service'

export const defaultActiveIdentifiers = [
  MainProtocolSymbols.AE,
  MainProtocolSymbols.BTC,
  MainProtocolSymbols.COSMOS,
  MainProtocolSymbols.ETH,
  MainProtocolSymbols.GRS,
  MainProtocolSymbols.KUSAMA,
  MainProtocolSymbols.POLKADOT,
  MainProtocolSymbols.XTZ
]

export const defaultPassiveIdentifiers = []

export const defaultActiveSubIdentifiers = [
  SubProtocolSymbols.XTZ_BTC,
  ...ethTokens
    .filter((token: Token) => activeEthTokens.has(token.identifier))
    .map((token: Token) => token.identifier as SubProtocolSymbols)
    .filter((identifeir: SubProtocolSymbols, index: number, array: SubProtocolSymbols[]) => array.indexOf(identifeir) === index)
]

export const defaultPassiveSubIdentifiers = [
  SubProtocolSymbols.XTZ_KT,
  ...ethTokens
    .filter((token: Token) => !activeEthTokens.has(token.identifier))
    .map((token: Token) => token.identifier as SubProtocolSymbols)
    .filter((identifeir: SubProtocolSymbols, index: number, array: SubProtocolSymbols[]) => array.indexOf(identifeir) === index)
]

export function getIdentifiers(protocols: ICoinProtocol[]): ProtocolSymbols[] {
  return protocols.map((protocol: ICoinProtocol) => protocol.identifier)
}

export function getSubIdentifiers(subProtocolMap: SubProtocolsMap): ProtocolSymbols[] {
  return Object.values(subProtocolMap)
    .map((values) => Object.values(values).map((protocol: ICoinSubProtocol | undefined) => protocol?.identifier))
    .reduce((flatten, toFlatten) => flatten.concat(toFlatten), [])
    .filter((identifier: ProtocolSymbols | undefined) => identifier !== undefined) as ProtocolSymbols[]
}