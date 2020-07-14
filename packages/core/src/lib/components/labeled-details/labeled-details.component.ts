import { Component, Input } from '@angular/core'

@Component({
  selector: 'airgap-labeled-details',
  templateUrl: './labeled-details.component.html',
  styleUrls: ['./labeled-details.component.scss']
})
export class LabeledDetailsComponent {
  @Input()
  public readonly label: string | undefined

  @Input()
  public readonly details: string | undefined

  @Input()
  public readonly position: 'fixed' | 'floating' | 'stacked' | undefined

  @Input()
  public readonly selectable: boolean = false
}
