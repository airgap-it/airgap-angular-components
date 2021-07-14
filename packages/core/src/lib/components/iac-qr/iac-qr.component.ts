import { Component, Input, OnDestroy, Inject } from '@angular/core'

import { QRCodeErrorCorrectionLevel } from 'angularx-qrcode'
import { ClipboardService } from '../../services/clipboard/clipboard.service'
import { SerializerDefaults, SerializerService } from '../../services/serializer/serializer.service'
import { APP_CONFIG, AppConfig } from '../../config/app-config'
import { IACQrGenerator } from '../../services/iac/qr-generator'
import { SerializerV3Generator } from '../../services/qr/qr-generators/serializer-v3-generator'
import { SerializerV2Generator } from '../../services/qr/qr-generators/serializer-v2-generator'
import { IACMessageDefinitionObjectV3 } from '@airgap/coinlib-core'

export enum QRType {
  V2 = 'QR Code V2',
  V3 = 'QR Code V3'
}

@Component({
  selector: 'airgap-iac-qr',
  templateUrl: './iac-qr.component.html',
  styleUrls: ['./iac-qr.component.scss']
})
export class IACQrComponent implements OnDestroy {
  public availableQRTypes = [QRType.V2, QRType.V3]
  public numberOfParts: number = 0

  private readonly generatorsMap: Map<string, IACQrGenerator>

  private readonly singleChunkSize: number = SerializerDefaults.SINGLE
  private readonly multiChunkSize: number = SerializerDefaults.MULTI

  private activeGenerator: IACQrGenerator
  @Input()
  public level: keyof typeof QRCodeErrorCorrectionLevel = 'L'

  @Input()
  public size: number = 300

  @Input()
  public margin: number = 2

  @Input()
  public set messageDefinitionObjects(value: IACMessageDefinitionObjectV3[]) {
    this._messageDefinitionObjects = value
    this.convertToDataArray()
  }

  public qrdataArray: string[] = ['']

  public qrType: QRType = QRType.V3
  public qrdata: string = ''

  private _messageDefinitionObjects: IACMessageDefinitionObjectV3[] = []

  private readonly timeout: NodeJS.Timeout
  constructor(
    private readonly clipboardService: ClipboardService,
    private readonly serializerService: SerializerService,
    @Inject(APP_CONFIG) private readonly appConfig: AppConfig
  ) {
    this.singleChunkSize = this.serializerService.singleChunkSize
    this.multiChunkSize = this.serializerService.multiChunkSize
    this.generatorsMap = new Map()
    const v3Generator = new SerializerV3Generator()
    const v2Generator = new SerializerV2Generator()
    this.generatorsMap.set(QRType.V3, v3Generator)
    this.generatorsMap.set(QRType.V2, v2Generator)

    this.activeGenerator = v3Generator

    if (!this.serializerService.useV3) {
      this.activeGenerator = v2Generator
    }

    this.timeout = setInterval(async () => {
      this.qrdata = this.activeGenerator ? await this.activeGenerator.nextPart() : ''
    }, this.serializerService.displayTimePerChunk)
  }

  public updateGenerator(value: QRType) {
    const generator = this.generatorsMap.get(value)
    if (generator) {
      this.activeGenerator = generator
      this.convertToDataArray()
    }
  }

  public ngOnDestroy(): void {
    if (this.timeout) {
      clearInterval(this.timeout)
    }
  }

  public async copyToClipboard(): Promise<void> {
    let copyString: string = await this.activeGenerator.getSingle(this.appConfig.otherApp.urlScheme)

    await this.clipboardService.copyAndShowToast(copyString)
  }

  private async convertToDataArray(): Promise<void> {
    if (this.activeGenerator) {
      await this.activeGenerator.create(this._messageDefinitionObjects, this.multiChunkSize, this.singleChunkSize)
      this.qrdata = await this.activeGenerator.nextPart()
      this.numberOfParts = await this.activeGenerator.getNumberOfParts()
    } else {
      this.qrdata = ''
      this.numberOfParts = 0
    }
  }
}
