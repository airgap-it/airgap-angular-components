import { Component, Input } from '@angular/core'

@Component({
  selector: 'airgap-titled-text',
  templateUrl: './titled-text.component.html',
  styleUrls: ['./titled-text.component.scss']
})
export class TitledTextComponent {
  @Input()
  public readonly title: string | undefined

  @Input()
  public readonly text: string | undefined

  @Input()
  public readonly selectable: boolean = false

  @Input()
  public readonly capitalize: boolean = false
}
