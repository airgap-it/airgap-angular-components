import { Location } from '@angular/common'
import { Component } from '@angular/core'
import { SerializerService } from '../../services/serializer/serializer.service'

@Component({
  selector: 'airgap-qr-settings',
  templateUrl: './qr-settings.page.html',
  styleUrls: ['./qr-settings.page.scss']
})
export class QrSettingsPage {
  constructor(public readonly serializerService: SerializerService, private readonly location: Location) {}

  public resetChunkSizes() {
    this.serializerService.resetChunkSizes()
  }

  public dismiss() {
    this.location.back()
  }
}
