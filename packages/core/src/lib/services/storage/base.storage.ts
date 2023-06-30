import { Storage } from '@ionic/storage-angular'

export class BaseStorage<SettingsKey extends string, SettingsKeyReturnType extends Record<SettingsKey, unknown>> {
  private readonly storage: Promise<Storage>

  constructor(
    storage: Storage,
    protected readonly defaultValues: { [key in SettingsKey]: SettingsKeyReturnType[key] },
    drivers: any[] = []
  ) {
    this.storage = Promise.all(drivers.map((driver) => storage.defineDriver(driver))).then(() => storage.create())
  }

  protected async getStorage(): Promise<Storage> {
    return this.storage
  }

  public async get<K extends SettingsKey>(key: K): Promise<SettingsKeyReturnType[K]> {
    const storage = await this.getStorage()
    const value = await storage.get(key)
    const result: SettingsKeyReturnType[K] = value !== null && value !== undefined ? value : this.defaultValues[key]

    return result
  }

  public async set<K extends SettingsKey>(key: K, value: SettingsKeyReturnType[K]): Promise<void> {
    const storage = await this.getStorage()

    return storage.set(key, value)
  }

  public async delete<K extends SettingsKey>(key: K): Promise<boolean> {
    try {
      const storage = await this.getStorage()
      await storage.remove(key)

      return true
    } catch (error) {
      return false
    }
  }
}
