import { Component } from '@angular/core'
import { RangeCustomEvent, ToggleCustomEvent } from '@ionic/angular'
import { SerializerService } from '../../services/serializer/serializer.service'

@Component({
  selector: 'airgap-qr-settings',
  templateUrl: './qr-settings.component.html',
  styleUrls: ['./qr-settings.component.scss']
})
export class QrSettingsComponent {
  constructor(public readonly serializerService: SerializerService) {}

  public onToggleChange(event: Event): void {
    const value = (event as ToggleCustomEvent).detail.checked
    this.serializerService.useV3 = value
  }

  public onRangeChange(event: Event, setting: 'displayTimePerChunk' | 'singleChunkSize' | 'multiChunkSize'): void {
    const value = (event as RangeCustomEvent).detail.value
    this.serializerService[setting] = value as number
  }

  public resetSettings(): void {
    // eslint-disable-next-line no-console
    this.serializerService.resetSettings().catch(console.error)
  }
}
