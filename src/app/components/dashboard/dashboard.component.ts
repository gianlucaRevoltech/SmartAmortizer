import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AmortizationService } from '../../services/amortization.service';
import { LoanItem } from '../../models/loan.model';

export interface DashboardStats {
  totalLoans: number;
  totalDebt: number;
  totalInterestsPaid: number;
  totalInterestsRemaining: number;
  totalInstallmentsPaid: number;
  totalInstallmentsRemaining: number;
  averageInterestRate: number;
  monthlyPayment: number;
  completionPercentage: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  loanItems: LoanItem[] = [];
  stats: DashboardStats = {
    totalLoans: 0,
    totalDebt: 0,
    totalInterestsPaid: 0,
    totalInterestsRemaining: 0,
    totalInstallmentsPaid: 0,
    totalInstallmentsRemaining: 0,
    averageInterestRate: 0,
    monthlyPayment: 0,
    completionPercentage: 0,
  };

  constructor(
    private amortizationService: AmortizationService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.amortizationService.getLoanItems().subscribe((items) => {
      this.loanItems = items;
      this.calculateStats();
    });
  }

  private calculateStats(): void {
    if (this.loanItems.length === 0) {
      return;
    }

    // Basic counts
    this.stats.totalLoans = this.loanItems.length;

    // Initialize totals
    let totalOriginalAmount = 0;
    let totalRemainingDebt = 0;
    let totalInterestsPaid = 0;
    let totalInterestsRemaining = 0;
    let totalInstallmentsPaid = 0;
    let totalInstallments = 0;
    let totalInterestRates = 0;
    let monthlyPayment = 0;

    this.loanItems.forEach((loan) => {
      totalOriginalAmount += loan.totalAmount;
      totalInstallmentsPaid += loan.paidInstallments;
      totalInstallments += loan.installments;
      totalInterestRates += loan.interestRate;

      // Calculate remaining debt (unpaid installments)
      const unpaidInstallments = loan.amortizationPlan.filter(
        (inst) => !inst.paid
      );
      const remainingDebt = unpaidInstallments.reduce(
        (sum, inst) => sum + inst.amount,
        0
      );
      totalRemainingDebt += remainingDebt;

      // Calculate monthly payment (sum of all installment amounts)
      monthlyPayment +=
        unpaidInstallments.length > 0 ? unpaidInstallments[0].amount : 0;

      // Calculate interests
      const paidInstallments = loan.amortizationPlan.filter(
        (inst) => inst.paid
      );
      const paidInterests = paidInstallments.reduce(
        (sum, inst) => sum + inst.interest,
        0
      );
      const remainingInterests = unpaidInstallments.reduce(
        (sum, inst) => sum + inst.interest,
        0
      );

      totalInterestsPaid += paidInterests;
      totalInterestsRemaining += remainingInterests;
    });

    // Set calculated values
    this.stats.totalDebt = totalRemainingDebt;
    this.stats.totalInterestsPaid = totalInterestsPaid;
    this.stats.totalInterestsRemaining = totalInterestsRemaining;
    this.stats.totalInstallmentsPaid = totalInstallmentsPaid;
    this.stats.totalInstallmentsRemaining =
      totalInstallments - totalInstallmentsPaid;
    this.stats.averageInterestRate = totalInterestRates / this.loanItems.length;
    this.stats.monthlyPayment = monthlyPayment;
    this.stats.completionPercentage =
      totalInstallments > 0
        ? (totalInstallmentsPaid / totalInstallments) * 100
        : 0;
  }

  getLoansByType(): { [key: string]: number } {
    const typeCount: { [key: string]: number } = {};
    this.loanItems.forEach((loan) => {
      typeCount[loan.type] = (typeCount[loan.type] || 0) + 1;
    });
    return typeCount;
  }

  getTopLoanByAmount(): LoanItem | null {
    if (this.loanItems.length === 0) return null;
    return this.loanItems.reduce((max, loan) =>
      loan.totalAmount > max.totalAmount ? loan : max
    );
  }

  getNextPaymentDue(): { loan: LoanItem; installment: any } | null {
    for (const loan of this.loanItems) {
      const nextInstallment = loan.amortizationPlan.find((inst) => !inst.paid);
      if (nextInstallment) {
        return { loan, installment: nextInstallment };
      }
    }
    return null;
  }

  // Utility methods for template
  getTypeIcon(type: string): string {
    switch (type) {
      case 'casa':
        return 'home';
      case 'auto':
        return 'directions_car';
      case 'elettrodomestico':
        return 'kitchen';
      default:
        return 'account_balance_wallet';
    }
  }

  getTypeName(type: string): string {
    switch (type) {
      case 'casa':
        return 'Casa';
      case 'auto':
        return 'Auto';
      case 'elettrodomestico':
        return 'Elettrodomestico';
      default:
        return 'Altro';
    }
  }

  // Action methods
  onStatCardClick(statType: string): void {
    switch (statType) {
      case 'totalLoans':
        this.router.navigate(['/loans']);
        break;
      case 'totalDebt':
        this.showSnackBar(
          'Debito rimanente: somma di tutte le rate non pagate'
        );
        break;
      case 'averageRate':
        this.showSnackBar(
          `Tasso medio: ${this.stats.averageInterestRate.toFixed(2)}%`
        );
        break;
      case 'completion':
        this.showSnackBar(
          `Progresso: ${this.stats.totalInstallmentsPaid}/${
            this.stats.totalInstallmentsPaid +
            this.stats.totalInstallmentsRemaining
          } rate pagate`
        );
        break;
    }
  }

  onNewLoan(): void {
    this.router.navigate(['/new-loan']);
  }

  onViewAllLoans(): void {
    this.router.navigate(['/loans']);
  }

  onPayInstallment(): void {
    const nextPayment = this.getNextPaymentDue();
    if (nextPayment) {
      try {
        const updatedLoan = this.amortizationService.payInstallment(
          nextPayment.loan,
          nextPayment.installment.installment
        );
        this.showSnackBar(
          `Rata #${nextPayment.installment.installment} pagata con successo!`
        );
        this.loadData(); // Refresh data
      } catch (error: any) {
        console.error('Errore nel pagamento:', error);
        this.showSnackBar('Errore nel pagamento della rata');
      }
    }
  }

  onExportData(): void {
    try {
      const dataStr = JSON.stringify(this.loanItems, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `smart-amortizer-data-${
        new Date().toISOString().split('T')[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.showSnackBar('Dati esportati con successo!');
    } catch (error) {
      console.error("Errore nell'esportazione:", error);
      this.showSnackBar("Errore nell'esportazione dei dati");
    }
  }

  onGenerateReport(): void {
    // Prepare detailed report data
    const report = {
      generatedAt: new Date().toLocaleString('it-IT'),
      summary: this.stats,
      loans: this.loanItems.map((loan) => ({
        name: loan.name,
        type: this.getTypeName(loan.type),
        totalAmount: loan.totalAmount,
        installments: loan.installments,
        paidInstallments: loan.paidInstallments,
        remainingInstallments: loan.installments - loan.paidInstallments,
        interestRate: loan.interestRate,
        completionPercentage: (loan.paidInstallments / loan.installments) * 100,
        totalInterests: loan.amortizationPlan.reduce(
          (sum, inst) => sum + inst.interest,
          0
        ),
        remainingDebt: loan.amortizationPlan
          .filter((inst) => !inst.paid)
          .reduce((sum, inst) => sum + inst.amount, 0),
      })),
    };

    try {
      const reportStr = this.formatReportAsText(report);
      const reportBlob = new Blob([reportStr], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(reportBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `smart-amortizer-report-${
        new Date().toISOString().split('T')[0]
      }.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.showSnackBar('Report generato con successo!');
    } catch (error) {
      console.error('Errore nella generazione del report:', error);
      this.showSnackBar('Errore nella generazione del report');
    }
  }

  private formatReportAsText(report: any): string {
    let text = '=== SMART AMORTIZER - REPORT DETTAGLIATO ===\n\n';
    text += `Generato il: ${report.generatedAt}\n\n`;

    text += '--- RIEPILOGO GENERALE ---\n';
    text += `Numero finanziamenti: ${report.summary.totalLoans}\n`;
    text += `Debito rimanente: €${report.summary.totalDebt.toLocaleString(
      'it-IT',
      { minimumFractionDigits: 2 }
    )}\n`;
    text += `Interessi pagati: €${report.summary.totalInterestsPaid.toLocaleString(
      'it-IT',
      { minimumFractionDigits: 2 }
    )}\n`;
    text += `Interessi rimanenti: €${report.summary.totalInterestsRemaining.toLocaleString(
      'it-IT',
      { minimumFractionDigits: 2 }
    )}\n`;
    text += `Rate pagate: ${report.summary.totalInstallmentsPaid}\n`;
    text += `Rate rimanenti: ${report.summary.totalInstallmentsRemaining}\n`;
    text += `Tasso medio: ${report.summary.averageInterestRate.toFixed(2)}%\n`;
    text += `Pagamento mensile: €${report.summary.monthlyPayment.toLocaleString(
      'it-IT',
      { minimumFractionDigits: 2 }
    )}\n`;
    text += `Completamento: ${report.summary.completionPercentage.toFixed(
      1
    )}%\n\n`;

    text += '--- DETTAGLIO FINANZIAMENTI ---\n';
    report.loans.forEach((loan: any, index: number) => {
      text += `\n${index + 1}. ${loan.name} (${loan.type})\n`;
      text += `   Importo totale: €${loan.totalAmount.toLocaleString('it-IT', {
        minimumFractionDigits: 2,
      })}\n`;
      text += `   Rate: ${loan.paidInstallments}/${
        loan.installments
      } (${loan.completionPercentage.toFixed(1)}%)\n`;
      text += `   Tasso: ${loan.interestRate}%\n`;
      text += `   Interessi totali: €${loan.totalInterests.toLocaleString(
        'it-IT',
        { minimumFractionDigits: 2 }
      )}\n`;
      text += `   Debito rimanente: €${loan.remainingDebt.toLocaleString(
        'it-IT',
        { minimumFractionDigits: 2 }
      )}\n`;
    });

    return text;
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Chiudi', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  // Additional utility methods for enhanced dashboard insights
  getEstimatedSavings(): number {
    if (this.loanItems.length === 0) return 0;

    // Calculate potential savings from early payment
    const totalInterestsRemaining = this.stats.totalInterestsRemaining;
    const avgMonthlyPayment = this.stats.monthlyPayment;

    // Estimate 10% savings potential with extra payments
    return avgMonthlyPayment * 0.1;
  }

  getEstimatedTimeRemaining(): string {
    if (this.stats.totalInstallmentsRemaining === 0) return 'Completato';

    const months = this.stats.totalInstallmentsRemaining;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0) {
      return `${years} anni ${
        remainingMonths > 0 ? remainingMonths + ' mesi' : ''
      }`;
    } else {
      return `${months} mesi`;
    }
  }

  getPaymentEfficiency(): number {
    if (this.stats.totalInstallmentsPaid === 0) return 0;

    const totalInstallments =
      this.stats.totalInstallmentsPaid + this.stats.totalInstallmentsRemaining;
    return Math.round(
      (this.stats.totalInstallmentsPaid / totalInstallments) * 100
    );
  }

  // Metodi per il nuovo template
  getTotalPaidAmount(): number {
    return this.loanItems.reduce((total, loan) => {
      const amortizationPlan = loan.amortizationPlan || [];
      const paidAmount = amortizationPlan
        .filter((item) => item.paid)
        .reduce((paidTotal, item) => paidTotal + item.amount, 0);
      return total + paidAmount;
    }, 0);
  }

  getRecentLoans(): any[] {
    return this.loanItems.map((loan) => ({
      ...loan,
      statusClass:
        loan.paidInstallments >= loan.installments ? 'paid' : 'unpaid',
      statusText:
        loan.paidInstallments >= loan.installments ? 'Completato' : 'In Corso',
      completionPercentage: Math.round(
        (loan.paidInstallments / loan.installments) * 100
      ),
    }));
  }
}
