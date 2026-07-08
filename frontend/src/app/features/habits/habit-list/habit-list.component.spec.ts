import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabitListComponent } from './habit-list.component';

describe('HabitListComponent', () => {
  let component: HabitListComponent;
  let fixture: ComponentFixture<HabitListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabitListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HabitListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
