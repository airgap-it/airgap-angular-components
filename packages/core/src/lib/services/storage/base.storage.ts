import { Storage } from '@ionic/storage-angular'

export class BaseStorage<SettingsKey extends string, SettingsKeyReturnType extends Record<SettingsKey, unknown>> {
  protected readonly waitReady: Promise<void>

  constructor(
    protected readonly storage: Storage,
    protected readonly defaultValues: { [key in SettingsKey]: SettingsKeyReturnType[key] }
  ) {
    this.waitReady = new Promise(async (resolve) => {
      await this.storage.create()
      await this.init()
      resolve()
    })
  }

  protected async init(): Promise<void> {
    /* called after Storage has been created */
  }

  public async get<K extends SettingsKey>(key: K): Promise<SettingsKeyReturnType[K]> {
    await this.waitReady
    const value: SettingsKeyReturnType[K] = (await this.storage.get(key)) || this.defaultValues[key]

    return value
  }

  public async set<K extends SettingsKey>(key: K, value: SettingsKeyReturnType[K]): Promise<void> {
    await this.waitReady

    return this.storage.set(key, value)
  }

  public async delete<K extends SettingsKey>(key: K): Promise<boolean> {
    try {
      await this.waitReady
      await this.storage.remove(key)

      return true
    } catch (error) {
      return false
    }
  }
}
