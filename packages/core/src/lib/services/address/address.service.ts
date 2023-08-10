import { ICoinProtocol, ProtocolNetwork, ProtocolSymbols } from '@airgap/coinlib-core'
import { Injectable } from '@angular/core'
import { ExternalAliasResolver } from '../../types/ExternalAliasResolver'
import { getProtocolAndNetworkIdentifier } from '../../utils/protocol/protocol-network-identifier'
import { BaseEnvironmentService } from '../environment/base-environment.service'
import { ProtocolService } from '../protocol/protocol.service'

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private readonly externalResolvers: Map<string, ExternalAliasResolver[]> = new Map()

  constructor(private readonly protocolService: ProtocolService, private readonly environment: BaseEnvironmentService) {}

  public async registerExternalAliasResolver(externalResolver: ExternalAliasResolver, protocol: ICoinProtocol): Promise<void>
  public async registerExternalAliasResolver(
    externalResolver: ExternalAliasResolver,
    protocol: ProtocolSymbols,
    network: string | ProtocolNetwork
  ): Promise<void>
  public async registerExternalAliasResolver(
    externalResolver: ExternalAliasResolver,
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    network?: string | ProtocolNetwork
  ): Promise<void> {
    const protocolNetworkIdentifier: string = await getProtocolAndNetworkIdentifier(this.environment.mode, protocolOrIdentifier, network)

    if (!this.externalResolvers.has(protocolNetworkIdentifier)) {
      this.externalResolvers.set(protocolNetworkIdentifier, [])
    }

    // eslint-disable-next-line no-unused-expressions
    this.externalResolvers.get(protocolNetworkIdentifier)?.push(externalResolver)
  }

  public async validate(addressOrAlias: string, protocol: ICoinProtocol): Promise<boolean>
  public async validate(addressOrAlias: string, protocol: ProtocolSymbols, network: string | ProtocolNetwork): Promise<boolean>
  public async validate(
    addressOrAlias: string,
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    network?: string | ProtocolNetwork
  ): Promise<boolean> {
    const protocol: ICoinProtocol = await this.protocolService.getProtocol(protocolOrIdentifier, network, false)

    return (await this.isAddress(addressOrAlias, protocol)) || this.isAlias(addressOrAlias, protocol)
  }

  public async isAddress(data: string, protocol: ICoinProtocol): Promise<boolean>
  public async isAddress(data: string, protocol: ProtocolSymbols, network: string | ProtocolNetwork): Promise<boolean>
  public async isAddress(
    data: string,
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    network?: string | ProtocolNetwork
  ): Promise<boolean> {
    const protocol: ICoinProtocol = await this.protocolService.getProtocol(protocolOrIdentifier, network, false)

    return this.protocolService.isAddressOfProtocol(await protocol.getIdentifier(), data)
  }

  public async isAlias(data: string, protocol: ICoinProtocol): Promise<boolean>
  public async isAlias(data: string, protocol: ProtocolSymbols, network: string | ProtocolNetwork): Promise<boolean>
  public async isAlias(
    data: string,
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    network?: string | ProtocolNetwork
  ): Promise<boolean> {
    const protocol: ICoinProtocol = await this.protocolService.getProtocol(protocolOrIdentifier, network, false)
    const protocolNetworkIdentifier: string = await getProtocolAndNetworkIdentifier(this.environment.mode, protocol)

    const externalValidations: boolean[] = await Promise.all(
      this.externalResolvers.get(protocolNetworkIdentifier)?.map((resolver: ExternalAliasResolver) => resolver.validateReceiver(data)) ?? []
    )

    return externalValidations.includes(true)
  }

  public async getAddress(addressOrAlias: string, protocol: ICoinProtocol): Promise<string | undefined>
  public async getAddress(addressOrAlias: string, protocol: ProtocolSymbols, network: string | ProtocolNetwork): Promise<string | undefined>
  public async getAddress(
    addressOrAlias: string,
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    network?: string | ProtocolNetwork
  ): Promise<string | undefined> {
    const protocol: ICoinProtocol = await this.protocolService.getProtocol(protocolOrIdentifier, network, false)

    if (await this.isAddress(addressOrAlias, protocol)) {
      return addressOrAlias
    }

    const protocolNetworkIdentifier: string = await getProtocolAndNetworkIdentifier(this.environment.mode, protocol)
    const externalResolvers: ExternalAliasResolver[] = this.externalResolvers.get(protocolNetworkIdentifier) ?? []

    for (const resolver of externalResolvers) {
      const resolved: string | undefined = await resolver.resolveAlias(addressOrAlias)
      if (resolved !== undefined) {
        return resolved
      }
    }

    return undefined
  }

  public async getAlias(addressOrAlias: string, protocol: ICoinProtocol): Promise<string | undefined>
  public async getAlias(addressOrAlias: string, protocol: ProtocolSymbols, network: string | ProtocolNetwork): Promise<string | undefined>
  public async getAlias(
    addressOrAlias: string,
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    network?: string | ProtocolNetwork
  ): Promise<string | undefined> {
    const protocol: ICoinProtocol = await this.protocolService.getProtocol(protocolOrIdentifier, network, false)

    if (await this.isAddress(addressOrAlias, protocol)) {
      const protocolNetworkIdentifier: string = await getProtocolAndNetworkIdentifier(this.environment.mode, protocol)
      const externalResolvers: ExternalAliasResolver[] = this.externalResolvers.get(protocolNetworkIdentifier) ?? []

      for (const resolver of externalResolvers) {
        const resolved: string | undefined = await resolver.getAlias(addressOrAlias)
        if (resolved !== undefined) {
          return resolved
        }
      }
    } else if (await this.isAlias(addressOrAlias, protocol)) {
      const resolvedAddress: string | undefined = await this.getAddress(addressOrAlias, protocol)
      if (resolvedAddress !== undefined) {
        return addressOrAlias
      }
    }

    return undefined
  }
}
