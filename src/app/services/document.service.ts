import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

export interface DocumentItem {
  id: number;
  name: string;
  originalName: string;
  type: string; // 'pdf', 'image', 'excel', 'word', etc.
  size: number;
  uploadDate: Date;
  category: 'contract' | 'insurance' | 'payment' | 'identity' | 'other';
  loanId?: number; // Associated loan ID (optional)
  base64Data: string; // File content as base64
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private readonly STORAGE_KEY = 'smartAmortizer_documents';
  private documents: DocumentItem[] = [];
  private documentsSubject = new BehaviorSubject<DocumentItem[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  getDocuments(): Observable<DocumentItem[]> {
    return this.documentsSubject.asObservable();
  }

  addDocument(
    file: File,
    category: DocumentItem['category'],
    loanId?: number,
    description?: string
  ): Observable<DocumentItem> {
    return new Observable((observer) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        const newDocument: DocumentItem = {
          id: Date.now(),
          name: this.generateFileName(file.name, category),
          originalName: file.name,
          type: this.getFileType(file.name),
          size: file.size,
          uploadDate: new Date(),
          category,
          loanId,
          base64Data,
          description,
        };

        this.documents.push(newDocument);
        this.saveToStorage();
        this.documentsSubject.next([...this.documents]);
        observer.next(newDocument);
        observer.complete();
      };

      reader.onerror = () => {
        observer.error('Errore durante la lettura del file');
      };

      reader.readAsDataURL(file);
    });
  }

  deleteDocument(documentId: number): Observable<DocumentItem[]> {
    this.documents = this.documents.filter((doc) => doc.id !== documentId);
    this.saveToStorage();
    this.documentsSubject.next([...this.documents]);
    return of([...this.documents]);
  }

  downloadDocument(documentId: number): void {
    const doc = this.documents.find((d) => d.id === documentId);
    if (doc) {
      const link = globalThis.document.createElement('a');
      link.href = doc.base64Data;
      link.download = doc.originalName;
      link.click();
    }
  }

  getDocumentsByLoan(loanId: number): Observable<DocumentItem[]> {
    const loanDocuments = this.documents.filter((doc) => doc.loanId === loanId);
    return of(loanDocuments);
  }

  getDocumentsByCategory(
    category: DocumentItem['category']
  ): Observable<DocumentItem[]> {
    const categoryDocuments = this.documents.filter(
      (doc) => doc.category === category
    );
    return of(categoryDocuments);
  }

  updateDocument(
    documentId: number,
    updates: Partial<DocumentItem>
  ): Observable<DocumentItem | null> {
    const index = this.documents.findIndex((doc) => doc.id === documentId);
    if (index !== -1) {
      this.documents[index] = { ...this.documents[index], ...updates };
      this.saveToStorage();
      this.documentsSubject.next([...this.documents]);
      return of(this.documents[index]);
    }
    return of(null);
  }

  private generateFileName(originalName: string, category: string): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    const extension = originalName.split('.').pop();
    return `${category}_${timestamp}_${originalName}`;
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'xls':
      case 'xlsx':
        return 'excel';
      case 'doc':
      case 'docx':
        return 'word';
      case 'txt':
        return 'text';
      default:
        return 'other';
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.documents));
        console.log(
          'Documents saved to localStorage:',
          this.documents.length,
          'items'
        );
      }
    } catch (error) {
      console.error('Error saving documents to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const savedData = localStorage.getItem(this.STORAGE_KEY);
        if (savedData) {
          this.documents = JSON.parse(savedData);
          this.documentsSubject.next([...this.documents]);
          console.log(
            'Documents loaded from localStorage:',
            this.documents.length,
            'items'
          );
        }
      }
    } catch (error) {
      console.error('Error loading documents from localStorage:', error);
    }
  }

  clearAllDocuments(): Observable<DocumentItem[]> {
    this.documents = [];
    this.saveToStorage();
    this.documentsSubject.next([]);
    return of([]);
  }
}
