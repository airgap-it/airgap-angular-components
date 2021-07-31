import { Injectable } from '@angular/core'
import {
  generateId,
  IACMessageDefinitionObject,
  IACMessageDefinitionObjectV3,
  IACMessageType,
  Serializer,
  SerializerV3
} from '@airgap/coinlib-core'
import { parseIACUrl } from '../../utils/utils'
import { defaultValues, InternalStorageKey, InternalStorageService } from '../storage/storage.service'
import { IACMessages as IACMessagesV3 } from '@airgap/coinlib-core/serializer-v3/message' // TODO: Import from index
import { IACMessages as IACMessagesV2 } from '@airgap/coinlib-core/serializer/message' // TODO: Import from index
import { AccountShareResponse as AccountShareResponseV3 } from '@airgap/coinlib-core/serializer-v3/schemas/definitions/account-share-response' // TODO: Import from index
import { AccountShareResponse as AccountShareResponseV2 } from '@airgap/coinlib-core/serializer/schemas/definitions/account-share-response' // TODO: Import from index

export const convertV2ToV3 = async (chunks: IACMessageDefinitionObject[]): Promise<IACMessageDefinitionObjectV3[]> => {
  return chunks.map((message: IACMessageDefinitionObject) => {
    let newPayload: IACMessagesV3
    switch (message.type) {
      case IACMessageType.AccountShareResponse:
        newPayload = {
          ...message.payload,
          masterFingerprint: '',
          isActive: true,
          groupId: '',
          groupLabel: ''
        }
        break

      default:
        newPayload = message.payload as Exclude<IACMessagesV2, AccountShareResponseV2>
        break
    }

    return {
      id: generateId(8),
      type: message.type,
      protocol: message.protocol,
      payload: newPayload
    }
  })
}

export const convertV3ToV2 = async (chunks: IACMessageDefinitionObjectV3[]): Promise<IACMessageDefinitionObject[]> => {
  return chunks.map((message: IACMessageDefinitionObjectV3) => {
    let newPayload: IACMessagesV2
    switch (message.type) {
      case IACMessageType.AccountShareResponse:
        const { masterFingerprint, isActive, groupId, groupLabel, ...rest } = message.payload as AccountShareResponseV3
        newPayload = {
          ...message.payload
        } as any // TODO: REMOVE
        newPayload = rest
        break

      default:
        newPayload = message.payload as Exclude<IACMessagesV3, AccountShareResponseV3> as any // TODO: REMOVE
        break
    }

    return {
      id: message.id.toString().repeat(10).slice(0, 10), // We need to assume the id is "0", so we need to repeat it 10 times
      type: message.type,
      protocol: message.protocol,
      payload: newPayload
    }
  })
}

@Injectable({
  providedIn: 'root'
})
export class SerializerService {
  public _singleChunkSize: number = defaultValues.SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE
  public _multiChunkSize: number = defaultValues.SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE

  private readonly serializer: Serializer = new Serializer()
  private readonly serializerV3: SerializerV3 = new SerializerV3()

  private _useV3: boolean = defaultValues.SETTINGS_SERIALIZER_ENABLE_V3
  private _displayTimePerChunk: number = defaultValues.SETTINGS_SERIALIZER_CHUNK_TIME

  public get useV3(): boolean {
    return this._useV3
  }

  public set useV3(value: boolean) {
    // eslint-disable-next-line no-console
    this.internalStorageService.set(InternalStorageKey.SETTINGS_SERIALIZER_ENABLE_V3, value).catch(console.error)
    this._useV3 = value
  }

  public get singleChunkSize(): number {
    return this._singleChunkSize
  }

  public set singleChunkSize(value: number) {
    // eslint-disable-next-line no-console
    this.internalStorageService.set(InternalStorageKey.SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE, value).catch(console.error)
    this._singleChunkSize = value
  }

  public get multiChunkSize(): number {
    return this._multiChunkSize
  }

  public set multiChunkSize(value: number) {
    // eslint-disable-next-line no-console
    this.internalStorageService.set(InternalStorageKey.SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE, value).catch(console.error)
    this._multiChunkSize = value
  }

  public get displayTimePerChunk(): number {
    return this._displayTimePerChunk
  }

  public set displayTimePerChunk(value: number) {
    // eslint-disable-next-line no-console
    this.internalStorageService.set(InternalStorageKey.SETTINGS_SERIALIZER_CHUNK_TIME, value).catch(console.error)
    this._displayTimePerChunk = value
  }

  constructor(private readonly internalStorageService: InternalStorageService) {
    // eslint-disable-next-line no-console
    this.loadSettings().catch(console.error)
  }

  public async resetSettings(): Promise<void> {
    this._useV3 = defaultValues.SETTINGS_SERIALIZER_ENABLE_V3
    this._singleChunkSize = defaultValues.SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE
    this._multiChunkSize = defaultValues.SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE
    this._displayTimePerChunk = defaultValues.SETTINGS_SERIALIZER_CHUNK_TIME

    await Promise.all([
      this.internalStorageService.delete(InternalStorageKey.SETTINGS_SERIALIZER_ENABLE_V3),
      this.internalStorageService.delete(InternalStorageKey.SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE),
      this.internalStorageService.delete(InternalStorageKey.SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE),
      this.internalStorageService.delete(InternalStorageKey.SETTINGS_SERIALIZER_CHUNK_TIME)
    ])
  }

  public async serialize(chunks: IACMessageDefinitionObjectV3[]): Promise<string[] | string> {
    if (this.useV3) {
      return this.serializeV3(chunks)
    } else {
      return this.serializeV2(chunks)
    }
  }

  public async deserialize(chunks: string | string[]): Promise<IACMessageDefinitionObjectV3[]> {
    const parsedChunks: string[] = parseIACUrl(chunks, 'd')
    try {
      return this.deserializeV2(parsedChunks)
    } catch (error) {
      if (error && error.availablePages && error.totalPages) {
        throw error
      }

      if (parsedChunks.length === 1) {
        return this.deserializeV3(parsedChunks[0])
      } else {
        throw new Error('Could not deserialize input')
      }
    }
  }

  private async loadSettings() {
    this.internalStorageService
      .get(InternalStorageKey.SETTINGS_SERIALIZER_ENABLE_V3)
      .then((setting) => (this._useV3 = setting))
      // eslint-disable-next-line no-console
      .catch(console.error)
    this.internalStorageService
      .get(InternalStorageKey.SETTINGS_SERIALIZER_CHUNK_TIME)
      .then((setting) => (this._displayTimePerChunk = setting))
      // eslint-disable-next-line no-console
      .catch(console.error)
    this.internalStorageService
      .get(InternalStorageKey.SETTINGS_SERIALIZER_SINGLE_CHUNK_SIZE)
      .then((setting) => (this._singleChunkSize = setting))
      // eslint-disable-next-line no-console
      .catch(console.error)
    this.internalStorageService
      .get(InternalStorageKey.SETTINGS_SERIALIZER_MULTI_CHUNK_SIZE)
      .then((setting) => (this._multiChunkSize = setting))
      // eslint-disable-next-line no-console
      .catch(console.error)
  }

  private async serializeV2(chunks: IACMessageDefinitionObjectV3[]): Promise<string[]> {
    const dataV2 = await convertV3ToV2(chunks)

    return this.serializer.serialize(dataV2, this.singleChunkSize, this.multiChunkSize)
  }

  private async deserializeV2(chunks: string[]): Promise<IACMessageDefinitionObjectV3[]> {
    const v2Data = await this.serializer.deserialize(chunks)

    return convertV2ToV3(v2Data)
  }

  private async serializeV3(chunks: IACMessageDefinitionObjectV3[]): Promise<string> {
    return this.serializerV3.serialize(chunks)
  }

  private async deserializeV3(chunks: string): Promise<IACMessageDefinitionObjectV3[]> {
    return this.serializerV3.deserialize(chunks)
  }
}
