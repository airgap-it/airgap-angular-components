import { Component, Input, OnDestroy, Inject } from '@angular/core'

import { QRCodeErrorCorrectionLevel } from 'angularx-qrcode'
import { ClipboardService } from '../../services/clipboard/clipboard.service'
import { SerializerDefaults, SerializerService } from '../../services/serializer/serializer.service'
import { APP_CONFIG, AppConfig } from '../../config/app-config'
import { IACQrGenerator } from '../../services/iac/qr-generator'
import { SerializerV3Generator } from '../../services/qr/qr-generators/serializer-v3-generator'
import { SerializerV2Generator } from '../../services/qr/qr-generators/serializer-v2-generator'
import { IACMessageDefinitionObjectV3 } from '@airgap/coinlib-core'
import { BCURTypesGenerator } from '../../services/qr/qr-generators/bc-ur-generator'

export enum QRType {
  V3 = 'V3',
  V2 = 'V2',
  BC_UR = 'BC UR'
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

  private activeGenerator: IACQrGenerator = new SerializerV3Generator()
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

    this.generatorsMap.set(QRType.V3, new SerializerV3Generator())
    this.generatorsMap.set(QRType.V2, new SerializerV2Generator())
    this.generatorsMap.set(QRType.BC_UR, new BCURTypesGenerator())

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
    if (await BCURTypesGenerator.canHandle(this._messageDefinitionObjects)) {
      if (!this.availableQRTypes.includes(QRType.BC_UR)) {
        this.availableQRTypes.push(QRType.BC_UR)
      }
    } else {
      this.availableQRTypes = this.availableQRTypes.filter((el) => el !== QRType.BC_UR)
      this.activeGenerator = this.generatorsMap.get(QRType.V3)
    }

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
