import { Injectable } from '@angular/core'
import { IACMessageTransport, IACHanderStatus } from '../iac/base.iac.service'
import { InternalStorageKey, InternalStorageService } from '../storage/storage.service'

export interface IACHistoryEntry {
  message: string | string[]
  status: IACHanderStatus
  transport: IACMessageTransport
  outgoing: boolean
  date: string
}

@Injectable({
  providedIn: 'root'
})
export class IACHistoryService {
  constructor(private readonly internalStorageService: InternalStorageService) {}

  public async add(message: string | string[], status: IACHanderStatus, transport: IACMessageTransport, outgoing: boolean): Promise<void> {
    const entry: IACHistoryEntry = {
      message,
      status,
      transport,
      outgoing,
      date: new Date().getTime().toString()
    }
    const history = await this.getAll()
    history.unshift(entry)
    await this.internalStorageService.set(InternalStorageKey.IAC_HISTORY, history)
  }

  public async getAll(): Promise<IACHistoryEntry[]> {
    return this.internalStorageService.get(InternalStorageKey.IAC_HISTORY)
  }
}
