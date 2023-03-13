import { ICoinProtocol, ICoinSubProtocol, ProtocolSymbols } from '@airgap/coinlib-core'
import { Inject, Injectable } from '@angular/core'
import { SerializerV3, TransactionValidator } from '@airgap/serializer'
import {
  AirGapAnyProtocol,
  AirGapBlockExplorer,
  AirGapV3SerializerCompanion,
  isSubProtocol,
  ProtocolConfiguration,
  V3SchemaConfiguration
} from '@airgap/module-kit'
import { Directory, FileInfo, FilesystemPlugin, ReaddirResult } from '@capacitor/filesystem'
import {
  createICoinProtocolAdapter,
  createICoinSubProtocolAdapter,
  ICoinProtocolAdapter,
  ICoinSubProtocolAdapter,
  TransactionValidatorAdapter
} from '../../protocol/adapter/protocol-v0-adapter'
import { FILESYSTEM_PLUGIN, ISOLATED_MODULES_PLUGIN, ZIP_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { IsolatedModulesPlugin, LoadModulesResult, PreviewModuleResult, ZipPlugin } from '../../capacitor-plugins/definitions'
import { IsolatedModule, IsolatedProtocol } from '../../types/isolated-modules/IsolatedModule'
import { IsolatedAirGapV3SerializerCompanion } from '../../protocol/isolated/v3-serializer-companion-isolated'
import { flattened } from '../../utils/array'
import { IsolatedAirGapOfflineProtocol } from '../../protocol/isolated/protocol-offline-isolated'
import { IsolatedAirGapOnlineProtocol } from '../../protocol/isolated/protocol-online-isolated'
import { IsolatedAirGapBlockExplorer } from '../../protocol/isolated/block-explorer-isolated'
import { IsolatedModuleMetadata } from '../../types/isolated-modules/IsolatedModuleMetadata'
import { ProtocolService } from '../protocol/protocol.service'

type LoadedProtocolStatus = 'active' | 'passive'

interface LoadedMainProtocol {
  type: 'main'
  status: LoadedProtocolStatus
  value: ICoinProtocolAdapter
}

interface LoadedSubProtocol {
  type: 'sub'
  status: LoadedProtocolStatus
  value: [ICoinProtocolAdapter, ICoinSubProtocolAdapter]
}

type LoadedProtocol = LoadedMainProtocol | LoadedSubProtocol

interface Protocols {
  activeProtocols: ICoinProtocol[]
  passiveProtocols: ICoinProtocol[]
  activeSubProtocols: [ICoinProtocol, ICoinSubProtocol][]
  passiveSubProtocols: [ICoinProtocol, ICoinSubProtocol][]
}

const MANIFEST_FILENAME = 'manifest.json'

@Injectable({
  providedIn: 'root'
})
export class IsolatedModulesService {
  constructor(
    @Inject(ISOLATED_MODULES_PLUGIN) private readonly isolatedModules: IsolatedModulesPlugin,
    @Inject(FILESYSTEM_PLUGIN) private readonly filesystem: FilesystemPlugin,
    @Inject(ZIP_PLUGIN) private readonly zip: ZipPlugin,
    private readonly protocolService: ProtocolService
  ) {}

  public async loadProtocols(type?: ProtocolConfiguration['type'], ignore: string[] = []): Promise<Protocols> {
    const { modules }: LoadModulesResult = await this.isolatedModules.loadModules({ protocolType: type })
    const loadedProtocols: LoadedProtocol[] = await this.loadFromModules(modules, type, new Set(ignore))

    return this.processLoadedProtocols(loadedProtocols)
  }

  private processLoadedProtocols(protocols: LoadedProtocol[]): Protocols {
    const activeProtocols: ICoinProtocol[] = []
    const passiveProtocols: ICoinProtocol[] = []

    const activeSubProtocols: [ICoinProtocol, ICoinSubProtocol][] = []
    const passiveSubProtocols: [ICoinProtocol, ICoinSubProtocol][] = []

    for (const protocol of protocols) {
      if (protocol.type === 'main' && protocol.status === 'active') {
        activeProtocols.push(protocol.value)
      }

      if (protocol.type === 'main' && protocol.status === 'passive') {
        passiveProtocols.push(protocol.value)
      }

      if (protocol.type === 'sub' && protocol.status === 'active') {
        activeSubProtocols.push(protocol.value)
      }

      if (protocol.type === 'sub' && protocol.status === 'passive') {
        passiveSubProtocols.push(protocol.value)
      }
    }

    return {
      activeProtocols,
      passiveProtocols,
      activeSubProtocols,
      passiveSubProtocols
    }
  }

  private async loadFromModules(
    modules: IsolatedModule[],
    type?: ProtocolConfiguration['type'],
    ignore: Set<string> = new Set()
  ): Promise<LoadedProtocol[]> {
    const loadedProtocols: LoadedProtocol[][] = await Promise.all(
      modules.map(async (module: IsolatedModule) => {
        const v3SerializerCompanion: AirGapV3SerializerCompanion = new IsolatedAirGapV3SerializerCompanion(
          this.isolatedModules,
          module.v3SchemaConfigurations,
          module.identifier
        )
        this.loadSerializerCompanion(v3SerializerCompanion)

        const activeProtocols: Record<string, ICoinProtocolAdapter> = {}
        const activeSubProtocols: [ICoinProtocolAdapter, ICoinSubProtocolAdapter][] = []

        const targetProtocols: Record<string, IsolatedProtocol> = module.protocols
          .filter((protocol: IsolatedProtocol) => (!ignore.has(protocol.identifier) && type ? protocol.mode === type : true))
          .reduce((obj: Record<string, IsolatedProtocol>, next: IsolatedProtocol) => Object.assign(obj, { [next.identifier]: next }), {})

        for (const protocol of Object.values(targetProtocols)) {
          const adapter: ICoinProtocolAdapter = await this.createProtocolAdapter(protocol, v3SerializerCompanion)

          if (adapter instanceof ICoinSubProtocolAdapter && protocol.type === 'sub') {
            const mainIdentifier: string = protocol.mainProtocolIdentifier
            if (!(mainIdentifier in activeProtocols)) {
              const mainAdapter: ICoinProtocolAdapter = await this.createProtocolAdapter(
                targetProtocols[mainIdentifier],
                v3SerializerCompanion
              )
              activeProtocols[mainIdentifier] = mainAdapter
            }

            activeSubProtocols.push([activeProtocols[mainIdentifier], adapter])
          } else {
            activeProtocols[protocol.identifier] = adapter
          }
        }

        const loadedMainProtocols: LoadedProtocol[] = Object.values(activeProtocols).map((protocol) => ({
          type: 'main',
          status: 'active',
          value: protocol
        }))

        const loadedSubProtocols: LoadedProtocol[] = activeSubProtocols.map((protocol) => ({
          type: 'sub',
          status: 'active',
          value: protocol
        }))

        return loadedMainProtocols.concat(loadedSubProtocols)
      })
    )

    return flattened(loadedProtocols)
  }

  private async createProtocolAdapter(
    isolatedProtocol: IsolatedProtocol,
    v3SerializerCompanion: AirGapV3SerializerCompanion
  ): Promise<ICoinProtocolAdapter> {
    const protocol: AirGapAnyProtocol =
      isolatedProtocol.mode === 'offline'
        ? new IsolatedAirGapOfflineProtocol(this.isolatedModules, isolatedProtocol)
        : new IsolatedAirGapOnlineProtocol(this.isolatedModules, isolatedProtocol)

    const blockExplorer: AirGapBlockExplorer = new IsolatedAirGapBlockExplorer(
      this.isolatedModules,
      isolatedProtocol.identifier,
      isolatedProtocol.network,
      isolatedProtocol.blockExplorerMetadata
    )

    return isSubProtocol(protocol) && isolatedProtocol.type === 'sub'
      ? createICoinSubProtocolAdapter(protocol, blockExplorer, v3SerializerCompanion, {
          protocolMetadata: isolatedProtocol.protocolMetadata,
          crypto: isolatedProtocol.crypto,
          network: isolatedProtocol.network,
          blockExplorerMetadata: isolatedProtocol.blockExplorerMetadata,
          type: isolatedProtocol.subType,
          contractAddress: isolatedProtocol.contractAddress
        })
      : createICoinProtocolAdapter(protocol, blockExplorer, v3SerializerCompanion, {
          protocolMetadata: isolatedProtocol.protocolMetadata,
          crypto: isolatedProtocol.crypto,
          network: isolatedProtocol.network,
          blockExplorerMetadata: isolatedProtocol.blockExplorerMetadata
        })
  }

  private loadSerializerCompanion(v3SerializerCompanion: AirGapV3SerializerCompanion) {
    v3SerializerCompanion.schemas.forEach((configuration: V3SchemaConfiguration) => {
      SerializerV3.addSchema(configuration.type, configuration.schema, configuration.protocolIdentifier as ProtocolSymbols)

      if (configuration.protocolIdentifier) {
        SerializerV3.addValidator(configuration.protocolIdentifier as ProtocolSymbols, {
          create(): TransactionValidator {
            return new TransactionValidatorAdapter(configuration.protocolIdentifier, v3SerializerCompanion)
          }
        })
      }
    })
  }

  public async readModuleMetadata(name: string, path: string): Promise<IsolatedModuleMetadata> {
    if (!path.endsWith('.zip')) {
      throw new Error('Invalid protocol module format, expected .zip')
    }

    const tempDir = await this.createTempProtocolModuleDir(name)

    try {
      await this.zip.unzip({
        from: path,
        to: tempDir.path,
        toDirectory: tempDir.directory
      })

      const root: string | undefined = await this.findModuleRoot(tempDir.path, tempDir.directory)
      if (root === undefined) {
        throw new Error('Invalid protocol module structure, manifest not found')
      }

      const preview: PreviewModuleResult = await this.isolatedModules.previewModule({
        path: `${tempDir.path}/${root}`.replace(/\/+$/, ''),
        directory: tempDir.directory
      })

      return {
        module: preview.module,
        manifest: preview.manifest,
        path: tempDir.path,
        root,
        directory: tempDir.directory
      }
    } catch (error) {
      await this.removeTempProtocolModuleDir(tempDir.path, tempDir.directory).catch(() => {
        /* no action */
      })
      throw error
    }
  }

  private async findModuleRoot(path: string, directory: Directory): Promise<string | undefined> {
    const { type } = await this.filesystem.stat({ path, directory })
    if (type === 'directory') {
      const root = await this.findModuleRootInDir(path, directory)

      return root?.replace(`${path}/`, '')
    } else {
      return undefined
    }
  }

  private async findModuleRootInDir(path: string, directory: Directory): Promise<string | undefined> {
    const { files }: ReaddirResult = await this.filesystem.readdir({ path, directory })
    const hasManifest = files.find((file: FileInfo) => file.type === 'file' && file.name === MANIFEST_FILENAME)
    if (hasManifest) {
      return path
    }

    for (const file of files) {
      if (file.type === 'directory') {
        const root: string | undefined = await this.findModuleRootInDir(`${path}/${file.name}`, directory)
        if (root !== undefined) {
          return root
        }
      }
    }

    return undefined
  }

  public async installModule(metadata: IsolatedModuleMetadata): Promise<void> {
    const newIdentifier: string = metadata.manifest.name
      .replace(/\s+/, '_')
      .replace(/[^a-zA-Z\d_-]/g, '')
      .toLocaleLowerCase()
    const newPath: string = `protocol_modules/${newIdentifier}`
    const newDirectory: Directory = Directory.Data

    try {
      for (const file of [MANIFEST_FILENAME, ...metadata.manifest.include]) {
        const lastSegmentIndex: number = file.lastIndexOf('/')
        const parent = file.substring(0, lastSegmentIndex).replace(/^\/+/, '')

        await this.filesystem
          .mkdir({
            path: `${newPath}/${parent}`,
            directory: newDirectory,
            recursive: true
          })
          .catch(() => {
            /* no action */
          })

        await this.filesystem.copy({
          from: `${metadata.path}/${metadata.root}/${file}`,
          directory: metadata.directory,
          to: `${newPath}/${file}`,
          toDirectory: newDirectory
        })

        await this.isolatedModules.registerModule({
          identifier: newIdentifier,
          protocolIdentifiers: metadata.module.protocols.map((protocol) => protocol.identifier)
        })
      }

      const loadedProtocols = await this.loadFromModules([metadata.module])
      const protocols = this.processLoadedProtocols(loadedProtocols)

      await this.protocolService.addActiveMainProtocols(protocols.activeProtocols)
      await this.protocolService.addActiveSubProtocols(protocols.activeSubProtocols.map(([_, protocol]) => protocol))
    } catch (error) {
      await this.removeTempProtocolModuleDir(newPath, newDirectory).catch(() => {
        /* no action */
      })
      throw error
    } finally {
      await this.removeTempProtocolModuleDir(metadata.path, metadata.directory).catch(() => {
        /* no action */
      })
    }
  }

  private async createTempProtocolModuleDir(moduleName: string): Promise<{ path: string; directory: Directory }> {
    const tempDir: string = `protocolmodule_${moduleName.replace(/\.zip$/, '')}_${Date.now()}`
    const directory: Directory = Directory.Cache

    await this.filesystem.mkdir({
      path: tempDir,
      directory
    })

    return { path: tempDir, directory }
  }

  private async removeTempProtocolModuleDir(path: string, directory: Directory): Promise<void> {
    return this.filesystem.rmdir({
      path,
      directory,
      recursive: true
    })
  }
}
