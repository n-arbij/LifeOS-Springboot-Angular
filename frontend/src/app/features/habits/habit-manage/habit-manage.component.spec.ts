import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabitManageComponent } from './habit-manage.component';

describe('HabitManageComponent', () => {
  let component: HabitManageComponent;
  let fixture: ComponentFixture<HabitManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabitManageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HabitManageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
