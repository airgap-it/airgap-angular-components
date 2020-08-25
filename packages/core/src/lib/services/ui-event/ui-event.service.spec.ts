import { TestBed } from '@angular/core/testing';

import { UiEventService } from './ui-event.service';

describe('UiEventService', () => {
  let service: UiEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UiEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
