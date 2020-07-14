import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { NetworkBadgeComponent } from './network-badge.component'

describe('NetworkBadgeComponent', () => {
  let component: NetworkBadgeComponent
  let fixture: ComponentFixture<NetworkBadgeComponent>

  beforeEach(async(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    TestBed.configureTestingModule({
      declarations: [NetworkBadgeComponent]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkBadgeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
