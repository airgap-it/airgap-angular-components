export class StorageMock {
  private readonly data: any = {}

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
}
