import { Component, Input, OnDestroy, Inject } from '@angular/core'

import { QRCodeErrorCorrectionLevel } from 'angularx-qrcode'
import { ClipboardService } from '../../services/clipboard/clipboard.service'
import { SerializerService } from '../../services/serializer/serializer.service'
import { APP_CONFIG, AppConfig } from '../../config/app-config'
import { IACQrGenerator } from '../../services/iac/qr-generator'
import { SerializerV3Generator } from '../../services/qr/qr-generators/serializer-v3-generator'
import { SerializerV2Generator } from '../../services/qr/qr-generators/serializer-v2-generator'
import { IACMessageDefinitionObjectV3 } from '@airgap/coinlib-core'
import { defaultValues } from '../../services/storage/storage.service'

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
  public availableQRTypes: QRType[] = []
  public numberOfParts: number = 0

  private readonly generatorsMap: Map<string, IACQrGenerator> = new Map()

  private readonly singleChunkSize: number = defaultValues.SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE
  private readonly multiChunkSize: number = defaultValues.SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE

  private activeGenerator: IACQrGenerator | undefined
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

  public qrType: QRType
  public qrdata: string = ''

  public qrError: string = ''

  private _messageDefinitionObjects: IACMessageDefinitionObjectV3[] = []

  private timeout?: NodeJS.Timeout

  constructor(
    private readonly clipboardService: ClipboardService,
    private readonly serializerService: SerializerService,
    @Inject(APP_CONFIG) private readonly appConfig: AppConfig
  ) {
    this.singleChunkSize = this.serializerService.singleChunkSize
    this.multiChunkSize = this.serializerService.multiChunkSize

    const v3Generator = new SerializerV3Generator()
    const v2Generator = new SerializerV2Generator()

    this.generatorsMap.set(QRType.V3, v3Generator)
    this.availableQRTypes.push(QRType.V3)
    this.generatorsMap.set(QRType.V2, v2Generator)
    this.availableQRTypes.push(QRType.V2)

    if (this.serializerService.useV3) {
      this.activeGenerator = v3Generator
      this.qrType = QRType.V3
    } else {
      this.activeGenerator = v2Generator
      this.qrType = QRType.V2
    }
  }

  ngOnInit() {
    this.timeout = setInterval(async () => {
      this.qrdata = this.activeGenerator ? await this.activeGenerator.nextPart() : ''
    }, this.serializerService.displayTimePerChunk)
  }

  public updateGenerator(value: QRType) {
    const generator = this.generatorsMap.get(value)
    if (generator) {
      this.activeGenerator = generator
      this.convertToDataArray()
    } else {
      console.error('NO GENERATOR FOUND FOR ', value)
    }
  }

  public ngOnDestroy(): void {
    if (this.timeout) {
      clearInterval(this.timeout)
    }
  }

  public async copyToClipboard(): Promise<void> {
    let copyString: string = this.activeGenerator ? await this.activeGenerator.getSingle(this.appConfig.otherApp.urlScheme) : ''

    await this.clipboardService.copyAndShowToast(copyString)
  }

  private async convertToDataArray(): Promise<void> {
    this.qrError = ''
    if (this.activeGenerator) {
      try {
        await this.activeGenerator.create(this._messageDefinitionObjects, this.multiChunkSize, this.singleChunkSize)
        this.qrdata = await this.activeGenerator.nextPart()
        this.qrError = ''
        this.numberOfParts = await this.activeGenerator.getNumberOfParts()
      } catch (e) {
        console.log('QR generation error', e)
        this.qrError = 'Message is not compatible with the selected QR code type. Please select another one.'
      }
    } else {
      this.qrdata = ''
      this.qrError = 'No QR type selected.'
      this.numberOfParts = 0
    }
  }
}
