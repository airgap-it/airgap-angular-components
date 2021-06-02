/* eslint-disable max-classes-per-file */
import { newSpy } from './unit-test-helper'

export class AppMock {
  public addListener = newSpy('addListener', {})
  public openUrl = newSpy('openUrl', Promise.resolve())
}

export class AppInfoMock {
  public get: jasmine.Spy = newSpy(
    'set',
    Promise.resolve({
      appName: 'AirGap.UnitTest',
      packageName: 'AirGap',
      versionName: '0.0.0',
      versionCode: 0
    })
  )
}

export class ClipboardMock {
  public read: jasmine.Spy = newSpy('read', Promise.resolve({ value: 'text-from-clipboard' }))
  public write: jasmine.Spy = newSpy('write', Promise.resolve())
}

export class AppPluginMock {
  public openUrl: jasmine.Spy = newSpy('openUrl', Promise.resolve({ value: 'text-from-clipboard' }))
}

export class PermissionsPluginMock {
  public query: jasmine.Spy = newSpy('query', Promise.resolve({ value: true }))
}
