import { Inject, Injectable } from '@angular/core'
import { BarcodeScannerPlugin, ScanResult } from '@capacitor-community/barcode-scanner'
import { Platform } from '@ionic/angular'
import { BehaviorSubject, Observable } from 'rxjs'

import { BARCODE_SCANNER_PLUGIN } from '../../capacitor-plugins/injection-tokens'

@Injectable({
  providedIn: 'root'
})
export class QrScannerService {
  /**
   * Shows if the scanner is currently active (scanning) or not
   */
  public isActive: boolean = false

  private initScan$ = new BehaviorSubject<boolean>(true)

  private readonly isMobile: boolean

  constructor(private readonly platform: Platform, @Inject(BARCODE_SCANNER_PLUGIN) private readonly barcodeScanner: BarcodeScannerPlugin) {
    this.isMobile = this.platform.is('hybrid')
  }

  public async prepare(): Promise<void> {
    return this.barcodeScanner.prepare()
  }

  /**
   * Start the QR scanner. It will make the background of the page transparent and scan until a QR is detected.
   *
   * @param successCallback
   * @param errorCallback
   */
  public async scan(): Promise<string> {
    await this.show()

    const scanResult: ScanResult = await this.barcodeScanner.startScan({})
    if (scanResult.hasContent) {
      return scanResult.content || ''
    } else {
      throw new Error('Failed to scan QR code')
    }
  }

  public async destroy(): Promise<void> {
    if (this.isMobile) {
      this.isActive = false
      await this.barcodeScanner.showBackground()
      await this.barcodeScanner.stopScan()
    }
  }

  public resetScanner(): void {
    this.initScan$.next(true)
  }

  public getScanObservable(): Observable<boolean> {
    return this.initScan$.asObservable()
  }

  private async show(): Promise<void> {
    if (this.isMobile) {
      if (this.isActive) {
        return
      }
      this.isActive = true
      await this.barcodeScanner.hideBackground()
    }
  }
}
