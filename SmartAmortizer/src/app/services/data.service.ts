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

    // If no saved data or SSR, try to load from JSON file
    // In SSR environment, provide fallback data
    if (typeof window === 'undefined') {
      // SSR environment - return empty array or default data
      const defaultData: LoanItem[] = [];
      this.loanItems = defaultData;
      return of(defaultData);
    }

    // Browser environment - load from JSON file
    return this.http.get<LoanItem[]>(this.dataUrl).pipe(
      tap((data) => {
        this.loanItems = data;
        this.saveToStorage(); // Save initial data to localStorage
      }),
      catchError(() => {
        // If HTTP fails, return empty array instead of throwing error
        console.warn('Could not load data from JSON file, using empty array');
        const emptyData: LoanItem[] = [];
        this.loanItems = emptyData;
        return of(emptyData);
      })
    );
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

  // Method to reset data (useful for testing)
  resetToInitialData(): Observable<LoanItem[]> {
    localStorage.removeItem(this.STORAGE_KEY);
    this.loanItems = [];
    return this.loadInitialData();
  }

  private handleError(error: any) {
    console.error('An error occurred', error);
    return throwError(
      () => new Error('Something bad happened; please try again later.')
    );
  }
}
