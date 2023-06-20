import { Component, Input, OnDestroy, Inject } from '@angular/core'
import { IACMessageDefinitionObjectV3 } from '@airgap/serializer'
import { QRCodeErrorCorrectionLevel } from 'qrcode'

import { ClipboardService } from '../../services/clipboard/clipboard.service'
import { SerializerService } from '../../services/serializer/serializer.service'
import { APP_CONFIG, AppConfig } from '../../config/app-config'
import { IACQrGenerator } from '../../services/iac/qr-generator'
import { SerializerV3Generator } from '../../services/qr/qr-generators/serializer-v3-generator'
import { SerializerV2Generator } from '../../services/qr/qr-generators/serializer-v2-generator'
import { BCURTypesGenerator } from '../../services/qr/qr-generators/bc-ur-generator'
import { MetamaskGenerator } from '../../services/qr/qr-generators/metamask-generator'
import { defaultValues } from '../../services/storage/storage.service'
import { XPubGenerator } from '../../services/qr/qr-generators/xpub-generator'
import { OutputDescriptorGenerator } from '../../services/qr/qr-generators/output-descriptor-generator'

export enum QRType {
  V2 = 'QR Code V2',
  V3 = 'QR Code V3',
  BC_UR = 'BC UR (Beta)',
  XPUB = 'xPub (Beta)',
  OUTPUT_DESCRIPTOR = 'Output Descriptor (Beta)',
  METAMASK = 'MetaMask'
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
  public level: QRCodeErrorCorrectionLevel = 'L'

  @Input()
  public size: number = 300

  @Input()
  public margin: number = 2

  @Input()
  public qrFormatPreference: QRType

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
  }

  public ngOnInit(): void {
    this.timeout = setInterval(async () => {
      this.qrdata = this.activeGenerator ? await this.activeGenerator.nextPart() : ''
    }, this.serializerService.displayTimePerChunk)
    const v3Generator = new SerializerV3Generator()
    const v2Generator = new SerializerV2Generator()

    this.generatorsMap.set(QRType.V3, v3Generator)
    this.generatorsMap.set(QRType.V2, v2Generator)
    this.generatorsMap.set(QRType.BC_UR, new BCURTypesGenerator())
    this.generatorsMap.set(QRType.OUTPUT_DESCRIPTOR, new OutputDescriptorGenerator())
    this.generatorsMap.set(QRType.XPUB, new XPubGenerator())
    this.generatorsMap.set(QRType.METAMASK, new MetamaskGenerator())

    this.availableQRTypes.push(QRType.V3)
    this.availableQRTypes.push(QRType.V2)

    if (this.qrFormatPreference) {
      switch (this.qrFormatPreference) {
        case QRType.BC_UR:
          this.qrType = QRType.BC_UR
          this.activeGenerator = new BCURTypesGenerator()
          break

        case QRType.OUTPUT_DESCRIPTOR:
          this.qrType = QRType.OUTPUT_DESCRIPTOR
          this.activeGenerator = new OutputDescriptorGenerator()
          break

        case QRType.XPUB:
          this.qrType = QRType.XPUB
          this.activeGenerator = new XPubGenerator()
          break

        case QRType.METAMASK:
          this.qrType = QRType.METAMASK
          this.activeGenerator = new MetamaskGenerator()
          break

        default:
          this.activeGenerator = v3Generator
          this.qrType = QRType.V3
          break
      }
    } else {
      if (this.serializerService.useV3) {
        this.activeGenerator = v3Generator
        this.qrType = QRType.V3
      } else {
        this.activeGenerator = v2Generator
        this.qrType = QRType.V2
      }
    }
  }

  public updateGenerator(value: QRType): void {
    const generator = this.generatorsMap.get(value)
    if (generator) {
      this.qrType = value
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
    const copyString: string = this.activeGenerator ? await this.activeGenerator.getSingle(this.appConfig.otherApp.urlScheme) : ''

    await this.clipboardService.copyAndShowToast(copyString)
  }

  private async convertToDataArray(): Promise<void> {
    // Add BC_UR type, if supported
    if (!this.availableQRTypes.includes(QRType.BC_UR) && (await BCURTypesGenerator.canHandle(this._messageDefinitionObjects))) {
      this.availableQRTypes.push(QRType.BC_UR)
    }
    // Add Ouput Descriptor, if supported
    if (
      !this.availableQRTypes.includes(QRType.OUTPUT_DESCRIPTOR) &&
      (await OutputDescriptorGenerator.canHandle(this._messageDefinitionObjects))
    ) {
      this.availableQRTypes.push(QRType.OUTPUT_DESCRIPTOR)
    }
    // Add xPub, if supported
    if (!this.availableQRTypes.includes(QRType.XPUB) && (await XPubGenerator.canHandle(this._messageDefinitionObjects))) {
      this.availableQRTypes.push(QRType.XPUB)
    }
    // Add MetaMask, if supported
    if (!this.availableQRTypes.includes(QRType.METAMASK) && (await MetamaskGenerator.canHandle(this._messageDefinitionObjects))) {
      this.availableQRTypes.push(QRType.METAMASK)

      // If we know the message ID, we activate the MetaMask toggle
      this._messageDefinitionObjects.forEach((message) => {
        const IDs = JSON.parse(localStorage.getItem('TEMP-MM-REQUEST-IDS') ?? '{}')
        const id = IDs[message.id]

        if (id) {
          this.updateGenerator(QRType.METAMASK)
        }
      })
    }

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
