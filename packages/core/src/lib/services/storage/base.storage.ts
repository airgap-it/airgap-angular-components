import { Storage } from '@ionic/storage'

export class BaseStorage<SettingsKey extends string, SettingsKeyReturnType extends Record<SettingsKey, unknown>> {
  constructor(
    protected readonly storage: Storage,
    protected readonly defaultValues: { [key in SettingsKey]: SettingsKeyReturnType[key] }
  ) {}

  public async get<K extends SettingsKey>(key: K): Promise<SettingsKeyReturnType[K]> {
    const value: SettingsKeyReturnType[K] = (await this.storage.get(key)) || this.defaultValues[key]
    // eslint-disable-next-line no-console
    console.log(`[SETTINGS_SERVICE:get] ${key}, returned: ${value}`)

    return value
  }

  public async set<K extends SettingsKey>(key: K, value: SettingsKeyReturnType[K]): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[SETTINGS_SERVICE:set] ${key}, ${value}`)

    return this.storage.set(key, value)
  }

  public async delete<K extends SettingsKey>(key: K): Promise<boolean> {
    try {
      await this.storage.remove(key)

      return true
    } catch (error) {
      return false
    }
  }
}
