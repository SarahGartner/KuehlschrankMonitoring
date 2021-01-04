import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FridgesComponent } from './fridges.component';

describe('FridgesComponent', () => {
  let component: FridgesComponent;
  let fixture: ComponentFixture<FridgesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FridgesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FridgesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
