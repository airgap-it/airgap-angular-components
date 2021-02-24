import { Component } from '@angular/core'
import { SerializerService } from '../../services/serializer/serializer.service'

@Component({
  selector: 'airgap-qr-settings',
  templateUrl: './qr-settings.component.html',
  styleUrls: ['./qr-settings.component.scss']
})
export class QrSettingsComponent {
  constructor(public readonly serializerService: SerializerService) {}

  public resetSettings(): void {
    // eslint-disable-next-line no-console
    this.serializerService.resetSettings().catch(console.error)
  }
}
