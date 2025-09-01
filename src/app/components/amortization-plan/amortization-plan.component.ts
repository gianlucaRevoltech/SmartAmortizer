import { Component, OnInit } from '@angular/core';
import { AmortizationService } from '../../services/amortization.service';
import { DataService } from '../../services/data.service';
import { LoanItem, AmortizationItem } from '../../models/loan.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

interface LoanWithStatus extends LoanItem {
  statusClass: 'paid' | 'unpaid';
  statusText: string;
  nextPaymentDue?: Date;
  completionPercentage: number;
}

@Component({
  selector: 'app-amortization-plan',
  templateUrl: './amortization-plan.component.html',
  styleUrls: ['./amortization-plan.component.scss'],
})
export class AmortizationPlanComponent implements OnInit {
  loans: LoanWithStatus[] = [];
  selectedLoanItem: LoanItem | null = null;
  displayedColumns: string[] = [
    'name',
    'amount',
    'interestRate',
    'monthlyPayment',
    'progress',
    'status',
    'actions',
  ];

  // Colonne per la tabella del prospetto ammortamenti (ordine come nella foto)
  amortizationColumns: string[] = [
    'installment',
    'dueDate',
    'principal',
    'interest',
    'insurance',
    'amount',
    'remainingBalance',
    'status',
    'actions',
  ];

  isLoading = true;
  showAmortizationPlan = false;

  constructor(
    private amortizationService: AmortizationService,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadLoans();
  }

  loadLoans(): void {
    this.isLoading = true;
    this.amortizationService.getLoanItems().subscribe({
      next: (loans: LoanItem[]) => {
        this.loans = loans.map((loan) => this.processLoanStatus(loan));
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Errore nel caricamento dei prestiti:', error);
        this.snackBar.open('Errore nel caricamento dei prestiti', 'Chiudi', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  private processLoanStatus(loan: LoanItem): LoanWithStatus {
    const amortizationPlan = loan.amortizationPlan || [];
    const paidInstallments = amortizationPlan.filter(
      (item: AmortizationItem) => item.paid
    ).length;
    const totalInstallments = amortizationPlan.length;
    const completionPercentage =
      totalInstallments > 0 ? (paidInstallments / totalInstallments) * 100 : 0;

    // Find next unpaid installment
    const nextUnpaidInstallment = amortizationPlan.find(
      (item: AmortizationItem) => !item.paid
    );

    return {
      ...loan,
      statusClass: completionPercentage === 100 ? 'paid' : 'unpaid',
      statusText: completionPercentage === 100 ? 'COMPLETATO' : 'IN CORSO',
      nextPaymentDue: nextUnpaidInstallment?.paymentDate || undefined,
      completionPercentage: Math.round(completionPercentage),
    };
  }

  getTypeDisplayName(type: string): string {
    const typeMap: { [key: string]: string } = {
      House: 'Casa',
      Car: 'Auto',
      Appliance: 'Elettrodomestici',
    };
    return typeMap[type] || type;
  }

  getTypeIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      House: 'home',
      Car: 'directions_car',
      Appliance: 'kitchen',
    };
    return iconMap[type] || 'account_balance';
  }

  getMonthlyPayment(loan: LoanWithStatus): number {
    if (loan.amortizationPlan && loan.amortizationPlan.length > 0) {
      return loan.amortizationPlan[0].amount;
    }
    return 0;
  }

  getCompletedLoansCount(): number {
    return this.loans.filter((loan) => loan.statusClass === 'paid').length;
  }

  getActiveLoansCount(): number {
    return this.loans.filter((loan) => loan.statusClass === 'unpaid').length;
  }

  getTotalMonthlyPayment(): number {
    return this.loans.reduce((total, loan) => {
      return total + this.getMonthlyPayment(loan);
    }, 0);
  }

  getTotalPaidAmount(): number {
    return this.loans.reduce((total, loan) => {
      const amortizationPlan = loan.amortizationPlan || [];
      const paidAmount = amortizationPlan
        .filter((item: AmortizationItem) => item.paid)
        .reduce((paidTotal, item) => paidTotal + item.amount, 0);
      return total + paidAmount;
    }, 0);
  }

  getTotalRemainingAmount(): number {
    return this.loans.reduce((total, loan) => {
      return total + loan.remainingAmount;
    }, 0);
  }

  hasPaymentsToUndo(loan: LoanWithStatus): boolean {
    const amortizationPlan = loan.amortizationPlan || [];
    return amortizationPlan.some((item: AmortizationItem) => item.paid);
  }

  onViewDetails(loan: LoanWithStatus): void {
    this.selectedLoanItem = loan;
    this.showAmortizationPlan = true;
  }

  onBackToLoansList(): void {
    this.selectedLoanItem = null;
    this.showAmortizationPlan = false;
  }

  onPayInstallment(installmentNumber: number): void {
    if (!this.selectedLoanItem) return;

    const installment = this.selectedLoanItem.amortizationPlan.find(
      (item) => item.installment === installmentNumber
    );

    if (installment && !installment.paid) {
      // Pay the installment
      this.amortizationService.payInstallment(
        this.selectedLoanItem,
        installmentNumber
      );

      this.snackBar.open(
        `Rata #${installmentNumber} pagata con successo!`,
        'Chiudi',
        {
          duration: 3000,
          panelClass: ['success-snackbar'],
        }
      );

      // Refresh both the selected loan and the loans list
      this.loadLoans();
    }
  }

  onUndoInstallmentPayment(installmentNumber: number): void {
    if (!this.selectedLoanItem) return;

    const installment = this.selectedLoanItem.amortizationPlan.find(
      (item) => item.installment === installmentNumber
    );

    if (installment && installment.paid) {
      if (
        confirm(
          `Sei sicuro di voler annullare il pagamento della rata #${installmentNumber}?`
        )
      ) {
        installment.paid = false;
        installment.paymentDate = null;
        this.selectedLoanItem.paidInstallments--;
        this.selectedLoanItem.remainingAmount += installment.principal;

        // Salva le modifiche nel DataService
        this.dataService.updateLoanItem(this.selectedLoanItem);

        this.snackBar.open(
          `Pagamento della rata #${installmentNumber} annullato!`,
          'Chiudi',
          {
            duration: 3000,
            panelClass: ['warning-snackbar'],
          }
        );

        // Refresh both the selected loan and the loans list
        this.loadLoans();
      }
    }
  }

  onEditLoan(loan: LoanWithStatus): void {
    this.router.navigate(['/edit-loan', loan.id]);
  }

  onDeleteLoan(loan: LoanWithStatus): void {
    if (confirm(`Sei sicuro di voler eliminare il prestito "${loan.name}"?`)) {
      this.amortizationService.deleteLoanItem(loan).subscribe({
        next: () => {
          this.snackBar.open('Prestito eliminato con successo', 'Chiudi', {
            duration: 3000,
          });
          this.loadLoans(); // Refresh the list
        },
        error: (error: any) => {
          console.error("Errore nell'eliminazione del prestito:", error);
          this.snackBar.open(
            "Errore nell'eliminazione del prestito",
            'Chiudi',
            { duration: 3000 }
          );
        },
      });
    }
  }

  onNewLoan(): void {
    this.router.navigate(['/new-loan']);
  }

  onPayNextInstallmentFromList(loan: LoanWithStatus): void {
    if (loan.statusClass === 'paid') {
      this.snackBar.open(
        'Questo prestito è già completamente pagato',
        'Chiudi',
        { duration: 3000 }
      );
      return;
    }

    const amortizationPlan = loan.amortizationPlan || [];
    const nextUnpaidInstallment = amortizationPlan.find(
      (item: AmortizationItem) => !item.paid
    );

    if (nextUnpaidInstallment) {
      // Use the existing payInstallment method
      const updatedLoan = this.amortizationService.payInstallment(
        loan,
        nextUnpaidInstallment.installment
      );

      this.snackBar.open(
        `Rata #${nextUnpaidInstallment.installment} pagata con successo!`,
        'Chiudi',
        {
          duration: 3000,
          panelClass: ['success-snackbar'],
        }
      );

      this.loadLoans(); // Refresh the list
    }
  }

  onUndoLastPaymentFromList(loan: LoanWithStatus): void {
    const amortizationPlan = loan.amortizationPlan || [];
    // Find the last paid installment (highest installment number that is paid)
    const paidInstallments = amortizationPlan
      .filter((item: AmortizationItem) => item.paid)
      .sort((a, b) => b.installment - a.installment);

    if (paidInstallments.length === 0) {
      this.snackBar.open('Non ci sono pagamenti da annullare', 'Chiudi', {
        duration: 3000,
      });
      return;
    }

    const lastPaidInstallment = paidInstallments[0];

    // Confirm before undoing
    const confirmMessage = `Sei sicuro di voler annullare il pagamento della rata #${lastPaidInstallment.installment}?`;
    if (confirm(confirmMessage)) {
      // Undo the payment
      lastPaidInstallment.paid = false;
      lastPaidInstallment.paymentDate = null;
      loan.paidInstallments--;
      loan.remainingAmount += lastPaidInstallment.principal;

      this.snackBar.open(
        `Pagamento della rata #${lastPaidInstallment.installment} annullato!`,
        'Chiudi',
        {
          duration: 3000,
          panelClass: ['warning-snackbar'],
        }
      );

      this.loadLoans(); // Refresh the list
    }
  }

  getInsurancePerInstallment(loan?: LoanItem): number {
    return loan?.insurancePerInstallment || 0;
  }

  hasInsurance(loan?: LoanItem): boolean {
    return (loan?.insurancePerInstallment || 0) > 0;
  }

  getInsuranceForInstallment(
    installmentNumber: number,
    loan?: LoanItem
  ): number {
    // Assicurazione solo per le prime 48 rate (4 anni)
    if (installmentNumber <= 48) {
      return loan?.insurancePerInstallment || 0;
    }
    return 0;
  }

  hasInsuranceForInstallment(installmentNumber: number): boolean {
    return installmentNumber <= 48;
  }

  onResetData(): void {
    if (
      confirm(
        'Sei sicuro di voler cancellare tutti i dati e ricominciare da capo? Questa azione pulirà anche i piani di ammortamento con date errate.'
      )
    ) {
      // Prima pulisci i piani di ammortamento corrotti
      this.dataService.clearAmortizationPlans();

      // Poi reset completo dei dati
      this.dataService.resetToInitialData().subscribe({
        next: () => {
          this.snackBar.open(
            'Dati ripristinati con successo! Piano di ammortamento aggiornato.',
            'Chiudi',
            {
              duration: 4000,
            }
          );
          this.loadLoans();
        },
        error: (error: any) => {
          console.error('Errore nel ripristino dei dati:', error);
          this.snackBar.open('Errore nel ripristino dei dati', 'Chiudi', {
            duration: 3000,
          });
        },
      });
    }
  }
}
