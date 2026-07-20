import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecurrencePickerComponent } from './recurrence-picker.component';

describe('RecurrencePickerComponent', () => {
  let component: RecurrencePickerComponent;
  let fixture: ComponentFixture<RecurrencePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecurrencePickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecurrencePickerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
