import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { LoanItem } from '../models/loan.model';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private dataUrl = 'assets/data.json';
  private loanItems: LoanItem[] = [];
  private readonly STORAGE_KEY = 'smartAmortizer_loanItems';

  constructor(private http: HttpClient) {
    this.loadInitialData().subscribe();
  }

  private loadInitialData(): Observable<LoanItem[]> {
    // First check if we have data in localStorage (only in browser)
    if (typeof localStorage !== 'undefined') {
      const savedData = this.loadFromStorage();
      if (savedData && savedData.length > 0) {
        this.loanItems = savedData;
        return of(savedData);
      }
    }

    // If no saved data, create initial real-world loan data
    return this.createInitialLoanData();
  }

  getLoanItems(): Observable<LoanItem[]> {
    // Always return current data from memory
    if (this.loanItems.length > 0) {
      return of(this.loanItems);
    } else {
      return this.loadInitialData();
    }
  }

  addLoanItem(newItem: LoanItem): Observable<LoanItem[]> {
    this.loanItems.push(newItem);
    this.saveToStorage();
    return of([...this.loanItems]);
  }

  updateLoanItem(updatedItem: LoanItem): void {
    const index = this.loanItems.findIndex(
      (item) => item.id === updatedItem.id
    );
    if (index !== -1) {
      this.loanItems[index] = updatedItem;
      this.saveToStorage();
    }
  }

  deleteLoanItem(id: number): Observable<LoanItem[]> {
    this.loanItems = this.loanItems.filter((item) => item.id !== id);
    this.saveToStorage();
    return of([...this.loanItems]);
  }

  private saveToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.loanItems));
        console.log(
          'Data saved to localStorage:',
          this.loanItems.length,
          'items'
        );
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private loadFromStorage(): LoanItem[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const savedData = localStorage.getItem(this.STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log(
            'Data loaded from localStorage:',
            parsedData.length,
            'items'
          );
          return parsedData;
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return [];
  }

  // Method to create initial real-world loan from vehicle financing document
  createInitialLoanData(): Observable<LoanItem[]> {
    const vehicleLoan: LoanItem = {
      id: 1,
      name: 'Finanziamento Veicolo',
      type: 'Car',
      totalAmount: 26789.42, // Capitale finanziato
      remainingAmount: 26789.42, // All'inizio tutto è da pagare
      interestRate: 8.01, // T.A.N.
      installments: 96, // 96 rate mensili (8 anni)
      paidInstallments: 0,
      amortizationPlan: [], // Will be calculated by AmortizationService
      // Additional details from the document
      taeg: 9.11, // T.A.E.G.
      vehiclePrice: 28671.54, // Prezzo di vendita del veicolo
      downPayment: 9000.0, // Importo anticipo
      totalServices: 6722.88, // Totale servizi accessori (ICAR + NOBIS + STELLANTIS)
      practiceExpenses: 395.0, // Spese istruttoria pratica
      totalInterests: 9577.3, // Totale interessi
      insurancePerInstallment: 30.0, // Assicurazione per i primi 48 mesi (4 anni)
    };

    this.loanItems = [vehicleLoan];
    this.saveToStorage();
    return of([vehicleLoan]);
  }

  // Method to reset data (useful for testing)
  resetToInitialData(): Observable<LoanItem[]> {
    localStorage.removeItem(this.STORAGE_KEY);
    this.loanItems = [];
    return this.createInitialLoanData(); // Use real data instead of empty
  }

  private handleError(error: any) {
    console.error('An error occurred', error);
    return throwError(
      () => new Error('Something bad happened; please try again later.')
    );
  }
}
