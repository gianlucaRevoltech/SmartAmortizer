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
    // Preserva i pagamenti esistenti se il piano è già presente
    const existingPlan = loanItem.amortizationPlan || [];
    const existingPayments = new Map<
      number,
      { paid: boolean; paymentDate: Date | null }
    >();

    // Salva lo stato dei pagamenti esistenti
    existingPlan.forEach((item) => {
      if (item.paid) {
        existingPayments.set(item.installment, {
          paid: item.paid,
          paymentDate: item.paymentDate,
        });
      }
    });

    const plan: AmortizationItem[] = [];

    // Dati reali dal documento ufficiale Stellantis Financial Services
    const baseMonthlyPayment = 378.82; // Rata base (capitale + interessi)
    const insuranceAmount = 30.0; // 30 EUR per i primi 48 mesi (fisso dal documento)
    const startDate = new Date(2025, 5, 29); // 29 giugno 2025 (mese 5 = giugno in JS)

    let remainingBalance = loanItem.totalAmount;

    for (let i = 1; i <= loanItem.installments; i++) {
      // Calcola interesse e capitale basandoti sulla rata fissa di 378.82
      const monthlyRate = loanItem.interestRate / 100 / 12;
      const interest = remainingBalance * monthlyRate;
      const principal = baseMonthlyPayment - interest;
      remainingBalance -= principal;

      // Assicurazione solo per i primi 48 mesi (4 anni)
      const hasInsurance = i <= 48;
      const insuranceForThisInstallment = hasInsurance ? insuranceAmount : 0;
      const totalAmount = baseMonthlyPayment + insuranceForThisInstallment;

      // Calcola la data di scadenza (mensile)
      const dueDate = new Date(startDate);
      dueDate.setMonth(startDate.getMonth() + (i - 1));

      // Recupera lo stato di pagamento esistente se presente
      const existingPayment = existingPayments.get(i);
      const isPaid = existingPayment ? existingPayment.paid : false;
      const paymentDate = existingPayment ? existingPayment.paymentDate : null;

      plan.push({
        installment: i,
        dueDate: dueDate,
        paymentDate: paymentDate,
        amount: totalAmount, // 408.82 per primi 48 mesi, 378.82 per i restanti
        principal: principal,
        interest: interest,
        insurance: insuranceForThisInstallment, // 30.00 per primi 48 mesi, 0.00 per i restanti
        remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
        paid: isPaid,
      });
    }

    // Aggiorna i contatori basandosi sui pagamenti esistenti
    loanItem.paidInstallments = plan.filter((item) => item.paid).length;
    loanItem.remainingAmount =
      loanItem.totalAmount -
      plan
        .filter((item) => item.paid)
        .reduce((sum, item) => sum + item.principal, 0);

    loanItem.amortizationPlan = plan;
    return loanItem;
  }
}
