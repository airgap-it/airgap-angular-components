import { AirGapBlockExplorer, BlockExplorerMetadata, ProtocolNetwork, protocolNetworkIdentifier } from '@airgap/module-kit'
import { BlockExplorerCallMethodOptions, CallMethodOptions, IsolatedModulesPlugin } from '../../capacitor-plugins/definitions'
import { IsolatedBase } from './base-isolated'

export class IsolatedAirGapBlockExplorer extends IsolatedBase<AirGapBlockExplorer> implements AirGapBlockExplorer {
  constructor(
    isolatedModulesPlugin: IsolatedModulesPlugin,
    private readonly protocolIdentifier: string,
    private readonly network: ProtocolNetwork,
    metadata?: BlockExplorerMetadata
  ) {
    super(isolatedModulesPlugin)

    this.metadata = metadata
  }

  private metadata: BlockExplorerMetadata | undefined
  public async getMetadata(): Promise<BlockExplorerMetadata> {
    if (this.metadata === undefined) {
      this.metadata = await this.callMethod('getMetadata')
    }

    return this.metadata
  }

  public async createAddressUrl(address: string): Promise<string> {
    return this.callMethod('createAddressUrl', [address])
  }

  public async createTransactionUrl(transactionId: string): Promise<string> {
    return this.callMethod('createTransactionUrl', [transactionId])
  }

  protected async createCallOptions(method: BlockExplorerCallMethodOptions['method'], args: unknown[]): Promise<CallMethodOptions> {
    return {
      target: 'blockExplorer',
      method,
      args,
      protocolIdentifier: this.protocolIdentifier,
      networkId: protocolNetworkIdentifier(this.network)
    }
  }
}
