import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabitDrawerComponent } from './habit-drawer.component';

describe('HabitDrawerComponent', () => {
  let component: HabitDrawerComponent;
  let fixture: ComponentFixture<HabitDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabitDrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HabitDrawerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
