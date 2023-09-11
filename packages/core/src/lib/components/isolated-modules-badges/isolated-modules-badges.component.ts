import { Component, Input } from '@angular/core'

import { IsolatedModuleMetadata } from '../../types/isolated-modules/IsolatedModuleMetadata'

@Component({
  selector: 'airgap-isolated-modules-badges',
  templateUrl: './isolated-modules-badges.component.html',
  styleUrls: ['./isolated-modules-badges.component.scss']
})
export class IsolatedModulesBadgesComponent {
  @Input()
  public module: IsolatedModuleMetadata
}
