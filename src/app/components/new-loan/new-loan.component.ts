import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AmortizationService } from '../../services/amortization.service';
import { LoanItem } from '../../models/loan.model';

@Component({
  selector: 'app-new-loan',
  templateUrl: './new-loan.component.html',
  styleUrls: ['./new-loan.component.scss'],
})
export class NewLoanComponent implements OnInit {
  loanForm: FormGroup;
  isSubmitting = false;
  monthlyPaymentPreview = 0;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private amortizationService: AmortizationService
  ) {
    this.loanForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      totalAmount: [
        '',
        [Validators.required, Validators.min(1000), Validators.max(1000000)],
      ],
      interestRate: [
        '',
        [Validators.required, Validators.min(0.1), Validators.max(20)],
      ],
      installments: [
        '',
        [Validators.required, Validators.min(12), Validators.max(480)],
      ],
    });
  }

  ngOnInit(): void {
    // Ascolta i cambiamenti del form per calcolare l'anteprima della rata
    this.loanForm.valueChanges.subscribe(() => {
      this.calculateMonthlyPaymentPreview();
    });
  }

  calculateMonthlyPaymentPreview(): void {
    const values = this.loanForm.value;

    if (
      values.totalAmount &&
      values.interestRate &&
      values.installments &&
      values.totalAmount >= 1000 &&
      values.interestRate > 0 &&
      values.installments >= 12
    ) {
      const principal = parseFloat(values.totalAmount);
      const monthlyRate = parseFloat(values.interestRate) / 100 / 12;
      const numPayments = parseInt(values.installments);

      // Formula per calcolare la rata mensile
      const monthlyPayment =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);

      this.monthlyPaymentPreview = monthlyPayment;
    } else {
      this.monthlyPaymentPreview = 0;
    }
  }

  onSubmit(): void {
    if (this.loanForm.valid) {
      this.isSubmitting = true;

      const formValues = this.loanForm.value;
      const newLoan: Omit<LoanItem, 'id' | 'amortizationPlan'> = {
        name: formValues.name,
        type: formValues.type,
        totalAmount: parseFloat(formValues.totalAmount),
        remainingAmount: parseFloat(formValues.totalAmount), // Inizialmente tutto da pagare
        interestRate: parseFloat(formValues.interestRate),
        installments: parseInt(formValues.installments),
        paidInstallments: 0,
      };

      this.amortizationService.addLoanItem(newLoan as LoanItem).subscribe({
        next: (loans) => {
          this.snackBar.open('Finanziamento creato con successo!', 'Chiudi', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.router.navigate(['/loans']);
        },
        error: (error) => {
          console.error('Errore nella creazione del finanziamento:', error);
          this.snackBar.open(
            'Errore nella creazione del finanziamento',
            'Chiudi',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
          this.isSubmitting = false;
        },
      });
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Compila tutti i campi obbligatori', 'Chiudi', {
        duration: 3000,
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/loans']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loanForm.controls).forEach((key) => {
      const control = this.loanForm.get(key);
      control?.markAsTouched();
    });
  }
}
