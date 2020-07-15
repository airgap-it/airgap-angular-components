import { Injectable } from '@angular/core'
import { ICoinProtocol, ProtocolNotSupported } from 'airgap-coin-lib'
import { ProtocolNetwork } from 'airgap-coin-lib/dist/utils/ProtocolNetwork'
import { ProtocolSymbols } from 'airgap-coin-lib/dist/utils/ProtocolSymbols'
import { getProtocolOptionsByIdentifier } from 'airgap-coin-lib/dist/utils/protocolOptionsByIdentifier'
import { isNetworkEqual } from 'airgap-coin-lib/dist/utils/Network'
import { ExposedPromise } from '../../utils/promise'

interface Token {
  symbol: string
  name: string
  marketSymbol: string
  identifer: string
  contractAddress: string
  decimals: number
}

interface SubAccount {
  protocol: ProtocolSymbols
  subProtocols: Token[]
}

@Injectable({
  providedIn: 'root'
})
export class ProtocolsService {
  public readonly knownProtocols: ICoinProtocol[] = []
  public readonly supportedProtocols: ICoinProtocol[] = []
  
  public readonly subAccounts: SubAccount[] = []

  private readonly isReady: ExposedPromise<boolean> = new ExposedPromise()

  public async waitReady(): Promise<boolean> {
    return this.isReady.promise
  }

  public getProtocol(protocolOrIdentifier: ICoinProtocol | ProtocolSymbols, network?: ProtocolNetwork, supportedOnly: boolean = true): ICoinProtocol | undefined {
    try {
      return typeof protocolOrIdentifier === 'string' ? this.getProtocolByIdentifier(protocolOrIdentifier, network, supportedOnly) : protocolOrIdentifier
    } catch (error) {
      return undefined
    }
  }

  public getProtocolByIdentifier(identifier: ProtocolSymbols, network?: ProtocolNetwork, supportedOnly: boolean = true): ICoinProtocol {
    const targetNetwork: ProtocolNetwork = network ?? getProtocolOptionsByIdentifier(identifier, network).network
    const filtered: ICoinProtocol[] = (supportedOnly ? this.supportedProtocols : this.knownProtocols)
      .map((protocol: ICoinProtocol) => [protocol, ...(protocol.subProtocols ?? [])])
      .reduce((flatten: ICoinProtocol[], toFlatten: ICoinProtocol[]) => flatten.concat(toFlatten), [])
      .filter((protocol: ICoinProtocol) => protocol.identifier.startsWith(identifier) && isNetworkEqual(protocol.options.network, targetNetwork))

    if (filtered.length === 0) {
      throw new ProtocolNotSupported()
    }

    return filtered.sort((a: ICoinProtocol, b: ICoinProtocol) => b.identifier.length - a.identifier.length)[0]
  }
}
