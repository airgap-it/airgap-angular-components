import { Injectable } from '@angular/core'
import { generateGUID } from 'src/lib/utils/utils'
import { IACMessageTransport, IACHanderStatus } from '../iac/base.iac.service'
import { InternalStorageKey, InternalStorageService } from '../storage/storage.service'

export interface IACHistoryEntry {
  id: string
  message: string | string[]
  status: IACHanderStatus
  transport: IACMessageTransport
  outgoing: boolean
  hidden: boolean
  date: number
}

/**
 * A local history of all incoming and outgoing messages.
 *
 * The history is used locally to apply certain rate limits. So the user is not allowed to delete entries, they can only be hidden.
 */
@Injectable({
  providedIn: 'root'
})
export class IACHistoryService {
  constructor(private readonly internalStorageService: InternalStorageService) {}

  /**
   * Add a new entry to the history
   *
   * @param message The message that was received or will be sent
   * @param status The status of the handling of the message (eg. if we understood it or not)
   * @param transport The transport how the message was received or how it will be sent
   * @param outgoing A flag indicating whether the request is incoming or outgoing
   */
  public async add(message: string | string[], status: IACHanderStatus, transport: IACMessageTransport, outgoing: boolean): Promise<void> {
    const entry: IACHistoryEntry = {
      id: generateGUID(),
      message,
      status,
      transport,
      outgoing,
      hidden: false,
      date: new Date().getTime()
    }
    const history = await this.getAll()
    history.unshift(entry)
    await this.store(history)
  }

  /**
   * Return a specific entry by ID
   *
   * @param id EntryID
   */
  public async getById(id: string): Promise<IACHistoryEntry | undefined> {
    const history = await this.getAll()
    return history.find((entry) => entry.id === id)
  }

  /**
   * Return all locally saved entries
   */
  public async getAll(): Promise<IACHistoryEntry[]> {
    return this.internalStorageService.get(InternalStorageKey.IAC_HISTORY)
  }

  /**
   * Hide a certain entry by ID.
   *
   * @param id The ID of the entry that should be hidden
   */
  public async hideById(id: string): Promise<void> {
    const history = await this.getAll()
    const newHistory = history.map((entry) => {
      if (entry.id === id) {
        entry.hidden = true
      }
      return entry
    })
    await this.store(newHistory)
  }

  /**
   * Hide all entries
   */
  public async hideAll(): Promise<void> {
    const history = await this.getAll()
    const newHistory = history.map((entry) => {
      entry.hidden = true
      return entry
    })
    await this.store(newHistory)
  }

  /**
   * Save history locally
   *
   * @param history The history that will be persisted
   */
  private async store(history: IACHistoryEntry[]): Promise<void> {
    await this.internalStorageService.set(InternalStorageKey.IAC_HISTORY, history)
  }
}
