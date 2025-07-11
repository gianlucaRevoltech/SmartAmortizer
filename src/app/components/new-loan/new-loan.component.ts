import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoanItem } from '../../models/loan.model';

@Component({
  selector: 'app-new-loan',
  templateUrl: './new-loan.component.html',
  styleUrls: ['./new-loan.component.scss'],
})
export class NewLoanComponent {
  @Output() newLoan = new EventEmitter<LoanItem>();

  loanForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loanForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      totalAmount: ['', [Validators.required, Validators.min(1)]],
      interestRate: ['', [Validators.required, Validators.min(0)]],
      installments: ['', [Validators.required, Validators.min(1)]],
      // Optional fields
      taeg: [''],
      vehiclePrice: [''],
      downPayment: [''],
      totalServices: [''],
      practiceExpenses: [''],
    });
  }

  formatCurrency(event: any): void {
    let value = event.target.value;
    // Remove all non-digit characters except comma and dot
    value = value.replace(/[^\d,.-]/g, '');

    // Replace dot with comma for decimal separator (Italian format)
    value = value.replace('.', ',');

    // Ensure only one comma
    const parts = value.split(',');
    if (parts.length > 2) {
      value = parts[0] + ',' + parts.slice(1).join('');
    }

    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + ',' + parts[1].substring(0, 2);
    }

    event.target.value = value;
    this.loanForm.patchValue({ totalAmount: value });
  }

  validateCurrency(event: any): void {
    const value = event.target.value;
    if (value) {
      // Convert Italian format to number
      const numericValue = this.parseItalianCurrency(value);
      if (!isNaN(numericValue) && numericValue > 0) {
        // Format the value nicely
        const formattedValue = this.formatItalianCurrency(numericValue);
        event.target.value = formattedValue;
        this.loanForm.patchValue({ totalAmount: formattedValue });
      }
    }
  }

  private parseItalianCurrency(value: string): number {
    // Remove thousands separators (dots) and replace comma with dot for decimal
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleanValue);
  }

  private formatItalianCurrency(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  onSubmit(): void {
    if (this.loanForm.valid) {
      const totalAmountValue = this.parseItalianCurrency(
        this.loanForm.value.totalAmount
      );

      const newLoan: LoanItem = {
        id: Date.now(),
        name: this.loanForm.value.name,
        type: this.loanForm.value.type,
        totalAmount: totalAmountValue,
        remainingAmount: totalAmountValue,
        interestRate: this.loanForm.value.interestRate,
        installments: this.loanForm.value.installments,
        paidInstallments: 0,
        amortizationPlan: [],
      };

      // Add optional fields if they have values
      if (this.loanForm.value.taeg) {
        newLoan.taeg = this.loanForm.value.taeg;
      }
      if (this.loanForm.value.vehiclePrice) {
        newLoan.vehiclePrice = this.parseItalianCurrency(
          this.loanForm.value.vehiclePrice
        );
      }
      if (this.loanForm.value.downPayment) {
        newLoan.downPayment = this.parseItalianCurrency(
          this.loanForm.value.downPayment
        );
      }
      if (this.loanForm.value.totalServices) {
        newLoan.totalServices = this.parseItalianCurrency(
          this.loanForm.value.totalServices
        );
      }
      if (this.loanForm.value.practiceExpenses) {
        newLoan.practiceExpenses = this.parseItalianCurrency(
          this.loanForm.value.practiceExpenses
        );
      }

      this.newLoan.emit(newLoan);
      this.loanForm.reset();
    }
  }
}
