import { Injectable } from '@angular/core';
import { LoanItem, AmortizationItem } from '../models/loan.model';
import { DataService } from './data.service';
import { Observable, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AmortizationService {
  constructor(private dataService: DataService) {}

  getLoanItems(): Observable<LoanItem[]> {
    return this.dataService
      .getLoanItems()
      .pipe(
        map((items) =>
          items.map((item) => this.calculateAmortizationPlan(item))
        )
      );
  }

  addLoanItem(newLoan: LoanItem): Observable<LoanItem[]> {
    const calculatedLoan = this.calculateAmortizationPlan(newLoan);
    return this.dataService
      .addLoanItem(calculatedLoan)
      .pipe(
        map((items) =>
          items.map((item) => this.calculateAmortizationPlan(item))
        )
      );
  }

  getLoanItem(id: number): Observable<LoanItem | undefined> {
    return this.getLoanItems().pipe(
      map((items) => items.find((item) => item.id === id))
    );
  }

  payInstallment(loanItem: LoanItem, installmentNumber: number): LoanItem {
    const installment = loanItem.amortizationPlan.find(
      (i) => i.installment === installmentNumber
    );
    if (installment && !installment.paid) {
      installment.paymentDate = new Date();
      installment.paid = true;
      loanItem.paidInstallments++;
      loanItem.remainingAmount -= installment.principal;
      // After payment, we should ideally save the state
      this.dataService.updateLoanItem(loanItem);
    }
    return loanItem;
  }

  deleteLoanItem(loanItemToDelete: LoanItem): Observable<LoanItem[]> {
    return this.dataService.deleteLoanItem(loanItemToDelete.id);
  }

  calculateAmortizationPlan(loanItem: LoanItem): LoanItem {
    if (loanItem.amortizationPlan && loanItem.amortizationPlan.length > 0) {
      return loanItem;
    }

    const plan: AmortizationItem[] = [];
    const monthlyRate = loanItem.interestRate / 100 / 12;
    const monthlyPayment =
      (loanItem.totalAmount *
        monthlyRate *
        Math.pow(1 + monthlyRate, loanItem.installments)) /
      (Math.pow(1 + monthlyRate, loanItem.installments) - 1);

    let remainingBalance = loanItem.totalAmount;

    for (let i = 1; i <= loanItem.installments; i++) {
      const interest = remainingBalance * monthlyRate;
      const principal = monthlyPayment - interest;
      remainingBalance -= principal;

      plan.push({
        installment: i,
        paymentDate: null,
        amount: monthlyPayment,
        principal: principal,
        interest: interest,
        remainingBalance: remainingBalance,
        paid: false,
      });
    }

    loanItem.amortizationPlan = plan;
    return loanItem;
  }
}
