import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionFilter } from './transaction-filter';

describe('TransactionFilter', () => {
  let component: TransactionFilter;
  let fixture: ComponentFixture<TransactionFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionFilter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
