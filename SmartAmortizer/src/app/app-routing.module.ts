import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AmortizationPlanComponent } from './components/amortization-plan/amortization-plan.component';
import { NewLoanComponent } from './components/new-loan/new-loan.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'loans', component: AmortizationPlanComponent },
  { path: 'new-loan', component: NewLoanComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
