import { Component, Input } from '@angular/core'

@Component({
  selector: 'airgap-titled-text',
  templateUrl: './titled-text.component.html',
  styleUrls: ['./titled-text.component.scss']
})
export class TitledTextComponent {
  @Input()
  public title: string | undefined | null

  @Input()
  public text: string | undefined | null

  @Input()
  public selectable: boolean = false

  @Input()
  public capitalize: boolean = false
}
