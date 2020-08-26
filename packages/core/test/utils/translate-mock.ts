import { Observable, of } from 'rxjs'

export class TranslateMock {
  private readonly data: { [key: string]: string } = {
    source: 'translated'
  }

  public get(keys: string[]): Observable<any> {
    const translated = {}
    keys.forEach((key) => {
      translated[key] = this.data[key] ?? key
    })
    return of(translated)
  }
}
