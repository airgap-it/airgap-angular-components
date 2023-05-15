import { Storage } from '@ionic/storage'

export class BaseStorage<SettingsKey extends string, SettingsKeyReturnType extends Record<SettingsKey, unknown>> {
  constructor(
    protected readonly storage: Storage,
    protected readonly defaultValues: { [key in SettingsKey]: SettingsKeyReturnType[key] }
  ) {}

  public async get<K extends SettingsKey>(key: K): Promise<SettingsKeyReturnType[K]> {
    await this.storage.ready()
    const value = await this.storage.get(key)
    const result: SettingsKeyReturnType[K] = value !== null && value !== undefined ? value : this.defaultValues[key]
    return result
  }

  public async set<K extends SettingsKey>(key: K, value: SettingsKeyReturnType[K]): Promise<void> {
    await this.storage.ready()

    return this.storage.set(key, value)
  }

  public async delete<K extends SettingsKey>(key: K): Promise<boolean> {
    try {
      await this.storage.ready()
      await this.storage.remove(key)

      return true
    } catch (error) {
      return false
    }
  }
}
