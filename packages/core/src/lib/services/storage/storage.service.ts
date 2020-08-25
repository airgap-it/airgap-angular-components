import { Injectable } from '@angular/core'
import { Storage } from '@ionic/storage'
import { IACHistoryEntry } from '../iac-history/iac-history.service'
import { BaseStorage } from './base.storage'

export enum InternalStorageKey {
  IAC_HISTORY = 'COMMON_IAC_HISTORY',
  SETTINGS_SERIALIZER_ENABLE_V2 = 'SETTINGS_SERIALIZER_ENABLE_V2',
  SETTINGS_SERIALIZER_CHUNK_TIME = 'SETTINGS_SERIALIZER_CHUNK_TIME',
  SETTINGS_SERIALIZER_CHUNK_SIZE = 'SETTINGS_SERIALIZER_CHUNK_SIZE'
}

interface InternalStorageKeyReturnType {
  [InternalStorageKey.IAC_HISTORY]: IACHistoryEntry[]
  [InternalStorageKey.SETTINGS_SERIALIZER_ENABLE_V2]: boolean
  [InternalStorageKey.SETTINGS_SERIALIZER_CHUNK_TIME]: number
  [InternalStorageKey.SETTINGS_SERIALIZER_CHUNK_SIZE]: number
}

type InternalStorageKeyReturnDefaults = { [key in InternalStorageKey]: InternalStorageKeyReturnType[key] }

const defaultValues: InternalStorageKeyReturnDefaults = {
  [InternalStorageKey.IAC_HISTORY]: [],
  [InternalStorageKey.SETTINGS_SERIALIZER_ENABLE_V2]: false,
  [InternalStorageKey.SETTINGS_SERIALIZER_CHUNK_TIME]: 500,
  [InternalStorageKey.SETTINGS_SERIALIZER_CHUNK_SIZE]: 100
}

@Injectable({
  providedIn: 'root'
})
export class InternalStorageService extends BaseStorage<InternalStorageKey, InternalStorageKeyReturnType> {
  constructor(storage: Storage) {
    super(storage, defaultValues)
  }
}
