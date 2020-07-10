import { Component, Input } from '@angular/core'

@Component({
  selector: 'airgap-labeled-details',
  templateUrl: './labeled-details.component.html',
  styleUrls: ['./labeled-details.component.scss']
})
export class LabeledDetailsComponent {
  @Input()
  public readonly label: string

  @Input()
  public readonly details: string

  @Input()
  public readonly position?: 'fixed' | 'floating' | 'stacked'

  @Input()
  public readonly selectable: boolean = false
}
