import { Injectable } from '@angular/core'
import {
  ICoinProtocol,
  ICoinSubProtocol,
  ProtocolNetwork,
  ProtocolSymbols,
  SubProtocolSymbols,
  MainProtocolSymbols
} from '@airgap/coinlib-core'
import { ProtocolOptions } from '@airgap/coinlib-core/utils/ProtocolOptions'
import { erc20Tokens } from '@airgap/ethereum'
import { ExposedPromise } from '../../utils/ExposedPromise'
import { getMainIdentifier } from '../../utils/protocol/protocol-identifier'
import { Token } from '../../types/Token'
import { MainProtocolStoreConfig, MainProtocolStoreService } from './store/main/main-protocol-store.service'
import { SubProtocolStoreConfig, SubProtocolStoreService, SubProtocolsMap } from './store/sub/sub-protocol-store.service'
import {
  getDefaultPassiveProtocols,
  getDefaultActiveProtocols,
  getDefaultPassiveSubProtocols,
  getDefaultActiveSubProtocols
} from './defaults'

export interface ProtocolServiceConfig extends Partial<MainProtocolStoreConfig & SubProtocolStoreConfig> {
  extraPassiveProtocols?: ICoinProtocol[]
  extraActiveProtocols?: ICoinProtocol[]

  extraPassiveSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]
  extraActiveSubProtocols?: [ICoinProtocol, ICoinSubProtocol][]
}

@Injectable({
  providedIn: 'root'
})
export class ProtocolService {
  private readonly isReady: ExposedPromise<void> = new ExposedPromise()
  private knownProtocolSymbols: Set<string> | undefined

  constructor(private readonly mainProtocolStore: MainProtocolStoreService, private readonly subProtocolStore: SubProtocolStoreService) {}

  private get isInitialized(): boolean {
    return this.mainProtocolStore.isInitialized && this.subProtocolStore.isInitialized
  }

  public async getSupportedProtocols(): Promise<ICoinProtocol[]> {
    await this.waitReady()

    return Array.from((await this.mainProtocolStore.supportedProtocols).values())
  }

  public async getPassiveProtocols(): Promise<ICoinProtocol[]> {
    await this.waitReady()

    return Array.from(this.mainProtocolStore.passiveProtocols.values())
  }

  public async getActiveProtocols(): Promise<ICoinProtocol[]> {
    await this.waitReady()

    return Array.from(this.mainProtocolStore.activeProtocols.values())
  }

  public async getSupportedSubProtocols(): Promise<SubProtocolsMap> {
    await this.waitReady()

    return this.subProtocolStore.supportedProtocols
  }

  public async getPassiveSubProtocols(): Promise<SubProtocolsMap> {
    await this.waitReady()

    return this.subProtocolStore.passiveProtocols
  }

  public async getActiveSubProtocols(): Promise<SubProtocolsMap> {
    await this.waitReady()

    return this.subProtocolStore.activeProtocols
  }

  public async init(config?: ProtocolServiceConfig): Promise<void> {
    if (this.isInitialized) {
      // eslint-disable-next-line no-console
      console.log('[ProtocolService] already initialized')

      return
    }

    await Promise.all([
      this.mainProtocolStore.init({
        passiveProtocols: (config?.passiveProtocols ?? (await getDefaultPassiveProtocols())).concat(config?.extraPassiveProtocols ?? []),
        activeProtocols: (config?.activeProtocols ?? (await getDefaultActiveProtocols())).concat(config?.extraActiveProtocols ?? [])
      }),
      this.subProtocolStore.init({
        passiveSubProtocols: (config?.passiveSubProtocols ?? (await getDefaultPassiveSubProtocols())).concat(
          config?.extraPassiveSubProtocols ?? []
        ),
        activeSubProtocols: (config?.activeSubProtocols ?? (await getDefaultActiveSubProtocols())).concat(
          config?.extraActiveSubProtocols ?? []
        )
      })
    ])

    this.isReady.resolve()
  }

  public async waitReady(): Promise<void> {
    return this.isReady.promise
  }

  public async isProtocolActive(protocol: ICoinProtocol): Promise<boolean>
  public async isProtocolActive(identifier: ProtocolSymbols, network?: ProtocolNetwork): Promise<boolean>
  public async isProtocolActive(protocolOrIdentifier: ICoinProtocol | ProtocolSymbols, network?: ProtocolNetwork): Promise<boolean> {
    await this.waitReady()

    return this.isProtocolRegistered(protocolOrIdentifier, network, true)
  }

  public async isProtocolSupported(protocol: ICoinProtocol): Promise<boolean>
  public async isProtocolSupported(identifier: ProtocolSymbols, network?: ProtocolNetwork): Promise<boolean>
  public async isProtocolSupported(protocolOrIdentifier: ICoinProtocol | ProtocolSymbols, network?: ProtocolNetwork): Promise<boolean> {
    await this.waitReady()

    return this.isProtocolRegistered(protocolOrIdentifier, network, false)
  }

  public async getProtocol(
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    network?: ProtocolNetwork | string,
    activeOnly: boolean = true
  ): Promise<ICoinProtocol> {
    await this.waitReady()

    if (typeof protocolOrIdentifier === 'string') {
      let protocol: ICoinProtocol | undefined

      if (this.mainProtocolStore.isIdentifierValid(protocolOrIdentifier)) {
        protocol = await this.mainProtocolStore.getProtocolByIdentifier(protocolOrIdentifier as MainProtocolSymbols, network, activeOnly)
      } else if (this.subProtocolStore.isIdentifierValid(protocolOrIdentifier)) {
        protocol = await this.subProtocolStore.getProtocolByIdentifier(protocolOrIdentifier as SubProtocolSymbols, network, activeOnly)
        if (protocol === undefined) {
          const mainProtocolIdentifier = getMainIdentifier(protocolOrIdentifier)

          return this.getProtocol(mainProtocolIdentifier, network, activeOnly)
        }
      }

      if (protocol === undefined) {
        throw new Error(`Protocol ${protocolOrIdentifier} not supported`)
      }

      return protocol
    } else {
      return protocolOrIdentifier
    }
  }

  public async addActiveProtocols(protocolOrProtocols: ICoinProtocol | ICoinProtocol[]): Promise<void> {
    const protocols: ICoinProtocol[] = Array.isArray(protocolOrProtocols) ? protocolOrProtocols : [protocolOrProtocols]

    const filteredMainProtocols: (ICoinProtocol | undefined)[] = await Promise.all(
      protocols.map(async (protocol: ICoinProtocol) => {
        const protocolIdentifier: ProtocolSymbols = await protocol.getIdentifier()

        return this.mainProtocolStore.isIdentifierValid(protocolIdentifier) ? protocol : undefined
      })
    )
    const mainProtocols: ICoinProtocol[] = filteredMainProtocols.filter((protocol: ICoinProtocol | undefined) => protocol !== undefined)

    const filteredSubProtocols: (ICoinProtocol | undefined)[] = await Promise.all(
      protocols.map(async (protocol: ICoinProtocol) => {
        const protocolIdentifier: ProtocolSymbols = await protocol.getIdentifier()

        return this.subProtocolStore.isIdentifierValid(protocolIdentifier) ? protocol : undefined
      })
    )
    const subProtocols: ICoinProtocol[] = filteredSubProtocols.filter((protocol: ICoinProtocol | undefined) => protocol !== undefined)

    await Promise.all([this.addActiveMainProtocols(mainProtocols), this.addActiveSubProtocols(subProtocols)])
  }

  public async addActiveMainProtocols(protocolOrProtocols: ICoinProtocol | ICoinProtocol[]): Promise<void> {
    await this.waitReady()

    const protocols: ICoinProtocol[] = Array.isArray(protocolOrProtocols) ? protocolOrProtocols : [protocolOrProtocols]
    const filtered: (ICoinProtocol | undefined)[] = await Promise.all(
      protocols.map(async (protocol: ICoinProtocol) => {
        const protocolIdentifier: ProtocolSymbols = await protocol.getIdentifier()

        return this.mainProtocolStore.isIdentifierValid(protocolIdentifier) ? protocol : undefined
      })
    )
    const validProtocols: [string, ICoinProtocol][] = await Promise.all(
      filtered
        .filter((protocol: ICoinProtocol | undefined) => protocol !== undefined)
        .map(async (protocol: ICoinProtocol) => {
          const protocolAndNetworkIdentifier: string = await this.mainProtocolStore.getProtocolAndNetworkIdentifier(protocol)

          return [protocolAndNetworkIdentifier, protocol] as [string, ICoinProtocol]
        })
    )

    await this.mainProtocolStore.addActiveProtocols(new Map(validProtocols))
  }

  public async addActiveSubProtocols(protocolOrProtocols: ICoinProtocol | ICoinProtocol[]): Promise<void> {
    await this.waitReady()

    const protocols: ICoinProtocol[] = Array.isArray(protocolOrProtocols) ? protocolOrProtocols : [protocolOrProtocols]
    const filtered: (ICoinProtocol | undefined)[] = await Promise.all(
      protocols.map(async (protocol: ICoinProtocol) => {
        const protocolIdentifier: ProtocolSymbols = await protocol.getIdentifier()

        return this.subProtocolStore.isIdentifierValid(protocolIdentifier) ? protocol : undefined
      })
    )
    const validProtocols: ICoinProtocol[] = filtered.filter((protocol: ICoinProtocol | undefined) => protocol !== undefined)
    const mapped: [string, [ProtocolSymbols, ICoinProtocol]][] = await Promise.all(
      validProtocols.map(async (protocol: ICoinProtocol) => {
        const protocolIdentifier: ProtocolSymbols = await protocol.getIdentifier()
        const protocolOptions: ProtocolOptions = await protocol.getOptions()

        const mainIdentifier: MainProtocolSymbols = getMainIdentifier(protocolIdentifier)
        const protocolAndNetworkIdentifier: string = await this.subProtocolStore.getProtocolAndNetworkIdentifier(
          mainIdentifier,
          protocolOptions.network
        )

        return [protocolAndNetworkIdentifier, [protocolIdentifier, protocol]] as [string, [ProtocolSymbols, ICoinProtocol]]
      })
    )

    await this.subProtocolStore.addActiveProtocols(
      mapped.reduce(
        (
          obj: SubProtocolsMap,
          [protocolAndNetworkIdentifier, [protocolIdentifier, protocol]]: [string, [ProtocolSymbols, ICoinProtocol]]
        ) =>
          Object.assign(obj, {
            [protocolAndNetworkIdentifier]: Object.assign(obj[protocolAndNetworkIdentifier] ?? {}, { [protocolIdentifier]: protocol })
          }),
        {}
      )
    )
  }

  public async removeProtocols(protocolIdentifiers: ProtocolSymbols[]): Promise<void> {
    await Promise.all([
      this.mainProtocolStore.removeProtocols(protocolIdentifiers as MainProtocolSymbols[]),
      this.subProtocolStore.removeProtocols(protocolIdentifiers as SubProtocolSymbols[])
    ])
  }

  public async isProtocolAvailable(protocolIdentifier: ProtocolSymbols, networkIdentifier: string): Promise<boolean> {
    await this.waitReady()

    const protocol: ICoinProtocol | undefined = this.mainProtocolStore.isIdentifierValid(protocolIdentifier)
      ? await this.mainProtocolStore.getProtocolByIdentifier(protocolIdentifier as MainProtocolSymbols, networkIdentifier, true, false)
      : await this.subProtocolStore.getProtocolByIdentifier(protocolIdentifier as SubProtocolSymbols, networkIdentifier, true, false)

    return protocol !== undefined
  }

  public async getSubProtocols(
    mainProtocol: ICoinProtocol | MainProtocolSymbols,
    network?: ProtocolNetwork | string,
    activeOnly: boolean = true
  ): Promise<ICoinSubProtocol[]> {
    await this.waitReady()

    const mainIdentifier = typeof mainProtocol === 'string' ? mainProtocol : await mainProtocol.getIdentifier()
    const targetNetwork: ProtocolNetwork | string | undefined = await this.subProtocolStore.getTargetNetwork(mainIdentifier, network)
    const protocolAndNetworkIdentifier: string = await this.subProtocolStore.getProtocolAndNetworkIdentifier(mainIdentifier, targetNetwork)
    const subProtocolsMap: SubProtocolsMap = await (activeOnly ? this.getActiveSubProtocols() : this.getSupportedSubProtocols())

    return Object.values(subProtocolsMap[protocolAndNetworkIdentifier] ?? {}).filter(
      (subProtocol: ICoinSubProtocol | undefined) => subProtocol !== undefined
    )
  }

  public async getAllSubProtocols(
    mainProtocol: ICoinProtocol | MainProtocolSymbols,
    activeOnly: boolean = true
  ): Promise<ICoinSubProtocol[]> {
    await this.waitReady()

    const mainIdentifier = typeof mainProtocol === 'string' ? mainProtocol : await mainProtocol.getIdentifier()
    const subProtocolsMap: SubProtocolsMap = await (activeOnly ? this.getActiveSubProtocols() : this.getSupportedSubProtocols())

    return Object.keys(subProtocolsMap)
      .filter((key) => key.startsWith(mainIdentifier))
      .map((key) => Object.values(subProtocolsMap[key] ?? {}))
      .reduce((flatten, next) => flatten.concat(next), [])
  }

  public async getNetworksForProtocol(
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    activeOnly: boolean = true
  ): Promise<ProtocolNetwork[]> {
    await this.waitReady()

    const identifier: ProtocolSymbols =
      typeof protocolOrIdentifier === 'string' ? protocolOrIdentifier : await protocolOrIdentifier.getIdentifier()

    return this.mainProtocolStore.isIdentifierValid(identifier)
      ? this.mainProtocolStore.getNetworksForProtocol(identifier as MainProtocolSymbols, activeOnly)
      : this.subProtocolStore.getNetworksForProtocol(identifier as SubProtocolSymbols, activeOnly)
  }

  public async getNetworkForProtocol(
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    networkIdentifier: string,
    activeOnly: boolean = true
  ): Promise<ProtocolNetwork | undefined> {
    const networks = await this.getNetworksForProtocol(protocolOrIdentifier, activeOnly)

    return networks.find((network: ProtocolNetwork) => network.identifier === networkIdentifier)
  }

  public async isAddressOfProtocol(protocolOrIdentifier: ICoinProtocol | ProtocolSymbols, address: string): Promise<boolean> {
    await this.waitReady()

    const protocol: ICoinProtocol =
      typeof protocolOrIdentifier === 'string' ? await this.getProtocol(protocolOrIdentifier) : protocolOrIdentifier

    return address.match(await protocol.getAddressValidationPattern()) !== null
  }

  public async getProtocolsForAddress(address: string): Promise<ICoinProtocol[]> {
    await this.waitReady()

    const protocols: ICoinProtocol[] = await this.getSupportedProtocols()

    return (
      await Promise.all(
        protocols.map(async (protocol) => {
          const isProtocolAddress: boolean = await this.isAddressOfProtocol(protocol, address)

          return isProtocolAddress ? protocol : undefined
        })
      )
    ).filter((protocol: ICoinProtocol | undefined) => protocol !== undefined)
  }

  public isKnownProtocolSymbol(symbol: ProtocolSymbols): boolean {
    if (this.knownProtocolSymbols === undefined) {
      this.knownProtocolSymbols = new Set([
        ...Object.values(MainProtocolSymbols),
        ...Object.values(SubProtocolSymbols),
        ...Object.values(erc20Tokens).map((token: Token) => token.identifier)
      ])
    }

    return this.knownProtocolSymbols?.has(symbol) ?? false
  }

  private async isProtocolRegistered(
    protocolOrIdentifier: ICoinProtocol | ProtocolSymbols,
    network?: ProtocolNetwork,
    checkActiveOnly: boolean = true
  ): Promise<boolean> {
    const identifier = typeof protocolOrIdentifier === 'string' ? protocolOrIdentifier : await protocolOrIdentifier.getIdentifier()
    const targetNetwork = this.mainProtocolStore.isIdentifierValid(identifier)
      ? await this.mainProtocolStore.getTargetNetwork(identifier, network)
      : await this.subProtocolStore.getTargetNetwork(identifier, network)
    const targetNetworkIdentifier = typeof targetNetwork === 'string' ? targetNetwork : targetNetwork?.identifier

    return this.getProtocol(identifier, targetNetwork, checkActiveOnly)
      .then(async (protocol) => {
        const foundIdentifier = await protocol.getIdentifier()
        const foundNetworkIdentifier = targetNetworkIdentifier !== undefined ? (await protocol.getOptions()).network.identifier : undefined

        return foundIdentifier === identifier && foundNetworkIdentifier === targetNetworkIdentifier
      })
      .catch(() => false)
  }
}
