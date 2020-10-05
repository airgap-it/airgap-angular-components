import { Injectable } from '@angular/core'
import { Platform } from '@ionic/angular'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let QRScanner: any

@Injectable({
  providedIn: 'root'
})
export class QrScannerService {
  /**
   * Shows if the scanner is currently active (scanning) or not
   */
  public isActive: boolean = false

  private readonly isMobile: boolean

  constructor(private readonly platform: Platform) {
    this.isMobile = this.platform.is('hybrid')
  }

  /**
   * Start the QR scanner. It will make the background of the page transparent and scan until a QR is detected.
   *
   * @param successCallback
   * @param errorCallback
   */
  public scan(successCallback: (text: string) => void, errorCallback: ((text: string) => void) | null = null): void {
    const scanCallback = (scanError: Error, text: string) => {
      if (scanError) {
        console.error('Scanner scan error', scanError)
        if (errorCallback) {
          // TODO: Check type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          errorCallback(scanError as any)
        }
      }

      console.log('Scanner scan success', text)
      successCallback(text)
    }

    QRScanner.scan(scanCallback)
    this.show()
  }

  public destroy(): void {
    if (this.isMobile) {
      this.isActive = false
      QRScanner.destroy()
    }
  }

  private show(): void {
    if (this.isMobile) {
      if (this.isActive) {
        return
      }
      this.isActive = true
      QRScanner.show()
    }
  }
}
