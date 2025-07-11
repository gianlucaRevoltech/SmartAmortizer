import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AmortizationService } from '../../services/amortization.service';
import { AmortizationItem, LoanItem } from '../../models/loan.model';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-amortization-plan',
  templateUrl: './amortization-plan.component.html',
  styleUrls: ['./amortization-plan.component.scss'],
})
export class AmortizationPlanComponent implements OnInit {
  loanItems: LoanItem[] = [];
  selectedLoanItem: LoanItem | null = null;
  displayedColumns: string[] = [
    'installment',
    'paymentDate',
    'amount',
    'principal',
    'interest',
    'remainingBalance',
    'paid',
    'action',
  ];
  showNewLoanForm = false;

  constructor(
    private amortizationService: AmortizationService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.amortizationService.getLoanItems().subscribe((items) => {
      this.loanItems = items;
    });
  }

  selectLoanItem(item: LoanItem): void {
    this.selectedLoanItem = item;
  }

  deleteLoan(itemToDelete: LoanItem, event: MouseEvent): void {
    event.stopPropagation(); // Prevent loan selection when clicking the delete button

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: 'Conferma Eliminazione',
        message: `Sei sicuro di voler eliminare il finanziamento "${itemToDelete.name}"?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.amortizationService
          .deleteLoanItem(itemToDelete)
          .subscribe((updatedItems) => {
            this.loanItems = updatedItems;
            if (this.selectedLoanItem?.id === itemToDelete.id) {
              this.selectedLoanItem = null;
            }
          });
      }
    });
  }

  payInstallment(installment: AmortizationItem): void {
    if (this.selectedLoanItem) {
      this.selectedLoanItem = this.amortizationService.payInstallment(
        this.selectedLoanItem,
        installment.installment
      );
      // Force table update
      this.selectedLoanItem.amortizationPlan = [
        ...this.selectedLoanItem.amortizationPlan,
      ];
    }
  }

  // Calculate total amount to be paid (capital + interests)
  getTotalAmountToPay(loanItem: LoanItem): number {
    return loanItem.amortizationPlan.reduce((total, installment) => {
      return total + installment.amount;
    }, 0);
  }

  // Calculate remaining amount to be paid (including future interests)
  getRemainingAmountToPay(loanItem: LoanItem): number {
    return loanItem.amortizationPlan
      .filter((installment) => !installment.paid)
      .reduce((total, installment) => {
        return total + installment.amount;
      }, 0);
  }

  // Calculate total interests
  getTotalInterests(loanItem: LoanItem): number {
    return this.getTotalAmountToPay(loanItem) - loanItem.totalAmount;
  }

  // Calculate remaining interests
  getRemainingInterests(loanItem: LoanItem): number {
    return loanItem.amortizationPlan
      .filter((installment) => !installment.paid)
      .reduce((total, installment) => {
        return total + installment.interest;
      }, 0);
  }

  addNewLoan(newLoan: LoanItem): void {
    this.amortizationService.addLoanItem(newLoan).subscribe((updatedItems) => {
      this.loanItems = updatedItems;
      this.showNewLoanForm = false;
      // Optionally select the newly added loan
      const addedLoan = updatedItems.find((item) => item.id === newLoan.id);
      if (addedLoan) {
        this.selectedLoanItem = addedLoan;
      }
    });
  }

  getItemIcon(type: string): string {
    switch (type) {
      case 'House':
        return 'home';
      case 'Car':
        return 'directions_car';
      case 'Appliance':
        return 'kitchen';
      default:
        return 'monetization_on';
    }
  }
}
