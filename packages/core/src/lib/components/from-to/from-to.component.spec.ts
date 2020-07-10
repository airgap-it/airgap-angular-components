import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FromToComponent } from './from-to.component';

describe('FromToComponent', () => {
  let component: FromToComponent;
  let fixture: ComponentFixture<FromToComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FromToComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FromToComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
