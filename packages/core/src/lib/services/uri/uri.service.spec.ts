import { TestBed } from '@angular/core/testing';

import { UriService } from './uri.service';

describe('UriService', () => {
  let service: UriService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UriService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
