import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LabeledDetailsComponent } from './labeled-details.component';

describe('LabeledDetailsComponent', () => {
  let component: LabeledDetailsComponent;
  let fixture: ComponentFixture<LabeledDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LabeledDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LabeledDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
