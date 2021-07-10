/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export class StorageMock {
  private readonly data: any = {}

  public create(): Promise<void> {
    return Promise.resolve()
  }

  public defineDriver(): Promise<void> {
    return Promise.resolve()
  }

  public get(key: string): Promise<any> {
    return new Promise((resolve, _reject) => {
      resolve(this.data[key])
    })
  }

  public set(key: string, value: any): Promise<void> {
    return new Promise((resolve, _reject) => {
      this.data[key] = value
      resolve()
    })
  }

  public remove(key: string): Promise<void> {
    return new Promise((resolve, _reject) => {
      delete this.data[key]
      resolve()
    })
  }

  public ready(): Promise<void> {
    return Promise.resolve()
  }
}
