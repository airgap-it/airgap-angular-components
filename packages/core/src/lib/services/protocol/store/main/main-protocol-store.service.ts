import { Injectable } from '@angular/core'
import { ICoinProtocol, MainProtocolSymbols, ProtocolNetwork } from '@airgap/coinlib-core'
import { splitProtocolNetworkIdentifier } from '../../../../utils/protocol/protocol-network-identifier'
import { BaseProtocolStoreService, BaseProtocolStoreConfig } from '../base-protocol-store.service'
import { ModulesController } from '../../../modules/controller/modules.controller'
import { BaseEnvironmentService } from '../../../environment/base-environment.service'

export type ProtocolsMap = Map<string, ICoinProtocol>

export type MainProtocolStoreConfig = BaseProtocolStoreConfig<ICoinProtocol[]>

@Injectable({
  providedIn: 'root'
})
export class MainProtocolStoreService extends BaseProtocolStoreService<
  ICoinProtocol,
  MainProtocolSymbols,
  ProtocolsMap,
  MainProtocolStoreConfig
> {
  constructor(environment: BaseEnvironmentService, modulesController: ModulesController) {
    super('MainProtocolService', environment, modulesController)
  }

  public async removeProtocols(identifiers: MainProtocolSymbols[]): Promise<void> {
    const identifiersSet: Set<string> = new Set(identifiers)
    const protocolKeys: string[] = Array.from((await this.supportedProtocols).keys()).filter((key: string) => {
      const { protocol: protocolIdentifier } = splitProtocolNetworkIdentifier(key)

      return identifiersSet.has(protocolIdentifier)
    })

    protocolKeys.forEach((key: string) => {
      this._activeProtocols.delete(key)
      this._passiveProtocols.delete(key)
    })

    // reset supported protocols
    this._supportedProtocols = undefined
  }

  public isIdentifierValid(identifier: string): boolean {
    return Object.values(MainProtocolSymbols).includes(identifier as MainProtocolSymbols) || !identifier.includes('-')
  }

  public async getProtocolByIdentifier(
    identifier: MainProtocolSymbols,
    network?: ProtocolNetwork | string,
    activeOnly: boolean = true,
    retry: boolean = true
  ): Promise<ICoinProtocol | undefined> {
    try {
      const targetNetwork: ProtocolNetwork | string | undefined = await this.getTargetNetwork(identifier, network)
      const protocolAndNetworkIdentifier: string = await this.getProtocolAndNetworkIdentifier(identifier, targetNetwork)
      const protocols: ProtocolsMap = activeOnly ? this.activeProtocols : await this.supportedProtocols
      const found: ICoinProtocol | undefined = protocols.get(protocolAndNetworkIdentifier)

      if (!found && retry) {
        return this.getProtocolByIdentifier(identifier, undefined, activeOnly, false)
      }

      return found
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[MainProtocolStore:getProtocolByIdentifer]', error)

      return undefined
    }
  }

  public async getNetworksForProtocol(identifier: MainProtocolSymbols, activeOnly: boolean = true): Promise<ProtocolNetwork[]> {
    const protocols: ProtocolsMap = activeOnly ? this.activeProtocols : await this.supportedProtocols
    const keys: string[] = Array.from(protocols.keys()).filter((protocolAndNetworkIdentifier: string) => {
      const { protocol: protocolIdentifier } = splitProtocolNetworkIdentifier(protocolAndNetworkIdentifier)

      return protocolIdentifier === identifier
    })

    return Promise.all(
      keys.map(async (key: string) => {
        const protocol: ICoinProtocol | undefined = protocols.get(key)

        return (await protocol.getOptions()).network
      })
    )
  }

  protected async transformConfig(config: MainProtocolStoreConfig): Promise<BaseProtocolStoreConfig<ProtocolsMap>> {
    const [passiveProtocols, activeProtocols]: ProtocolsMap[] = await Promise.all([
      this.createProtocolMap(config.passiveProtocols),
      this.createProtocolMap(config.activeProtocols)
    ])

    return { ...config, passiveProtocols, activeProtocols }
  }

  protected async mergeProtocols(protocols1: ProtocolsMap, protocols2: ProtocolsMap | undefined): Promise<ProtocolsMap> {
    const entries1: [string, ICoinProtocol][] = Array.from(protocols1.entries())
    const entries2: [string, ICoinProtocol][] = protocols2 !== undefined ? Array.from(protocols2.entries()) : []

    return new Map(entries1.concat(entries2))
  }

  protected async removeProtocolDuplicates(): Promise<void> {
    // if a protocol has been set as passive and active, it's considered active
    const activeIdentifiers: string[] = Array.from(this._activeProtocols.keys())
    activeIdentifiers.forEach((identifier: string) => {
      this._passiveProtocols.delete(identifier)
    })
  }

  private async createProtocolMap(protocols: ICoinProtocol[]): Promise<ProtocolsMap> {
    const protocolsWithIdentifiers: [string, ICoinProtocol][] = await Promise.all(
      protocols.map(async (protocol: ICoinProtocol) => {
        const protocolAndNetworkIdentifier = await this.getProtocolAndNetworkIdentifier(protocol)

        return [protocolAndNetworkIdentifier, protocol] as [string, ICoinProtocol]
      })
    )

    return new Map(protocolsWithIdentifiers)
  }
}
