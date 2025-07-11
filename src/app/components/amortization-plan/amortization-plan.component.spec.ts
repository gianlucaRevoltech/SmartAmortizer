import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmortizationPlanComponent } from './amortization-plan.component';

describe('AmortizationPlanComponent', () => {
  let component: AmortizationPlanComponent;
  let fixture: ComponentFixture<AmortizationPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AmortizationPlanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmortizationPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
