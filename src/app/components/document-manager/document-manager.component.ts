import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DocumentService, DocumentItem } from '../../services/document.service';
import { DocumentUploadDialogComponent } from './document-upload-dialog.component';
import { DocumentViewerDialogComponent } from './document-viewer-dialog.component';

@Component({
  selector: 'app-document-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTooltipModule,
    DocumentUploadDialogComponent,
    DocumentViewerDialogComponent,
  ],
  template: `
    <div class="document-manager">
      <div class="header">
        <h3><mat-icon>folder</mat-icon> Gestione Documenti</h3>
        <button mat-raised-button color="primary" (click)="openUploadDialog()">
          <mat-icon>upload</mat-icon>
          Carica Documento
        </button>
      </div>

      <div
        class="documents-grid"
        *ngIf="documents.length > 0; else noDocuments"
      >
        <mat-card *ngFor="let doc of documents" class="document-card">
          <mat-card-header>
            <div mat-card-avatar [class]="'file-icon ' + doc.type">
              <mat-icon>{{ getFileIcon(doc.type) }}</mat-icon>
            </div>
            <mat-card-title class="document-title">{{
              doc.originalName
            }}</mat-card-title>
            <mat-card-subtitle>
              <mat-chip [class]="'category-' + doc.category">{{
                getCategoryLabel(doc.category)
              }}</mat-chip>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="document-info">
              <small>
                <strong>Data:</strong>
                {{ doc.uploadDate | date : 'dd/MM/yyyy HH:mm' }}<br />
                <strong>Dimensione:</strong> {{ formatFileSize(doc.size)
                }}<br />
                <span *ngIf="doc.description"
                  ><strong>Descrizione:</strong> {{ doc.description }}</span
                >
              </small>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button
              mat-button
              (click)="viewDocument(doc)"
              [disabled]="!canPreview(doc.type)"
            >
              <mat-icon>visibility</mat-icon>
              Visualizza
            </button>
            <button mat-button (click)="downloadDocument(doc)">
              <mat-icon>download</mat-icon>
              Scarica
            </button>
            <button mat-button [matMenuTriggerFor]="menu" color="warn">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="editDocument(doc)">
                <mat-icon>edit</mat-icon>
                Modifica
              </button>
              <button
                mat-menu-item
                (click)="deleteDocument(doc)"
                class="delete-action"
              >
                <mat-icon>delete</mat-icon>
                Elimina
              </button>
            </mat-menu>
          </mat-card-actions>
        </mat-card>
      </div>

      <ng-template #noDocuments>
        <div class="no-documents">
          <mat-icon class="large-icon">folder_open</mat-icon>
          <h4>Nessun documento caricato</h4>
          <p>
            Inizia caricando i tuoi primi documenti relativi ai finanziamenti
          </p>
          <button
            mat-raised-button
            color="primary"
            (click)="openUploadDialog()"
          >
            <mat-icon>upload</mat-icon>
            Carica il primo documento
          </button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .document-manager {
        padding: 20px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .header h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        color: #333;
      }

      .documents-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 16px;
      }

      .document-card {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .document-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .file-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        color: white;
      }

      .file-icon.pdf {
        background: #e53e3e;
      }
      .file-icon.image {
        background: #38b2ac;
      }
      .file-icon.excel {
        background: #22c35e;
      }
      .file-icon.word {
        background: #3182ce;
      }
      .file-icon.text {
        background: #805ad5;
      }
      .file-icon.other {
        background: #718096;
      }

      .document-title {
        font-size: 14px !important;
        font-weight: 500 !important;
        margin-bottom: 4px !important;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .document-info {
        margin: 12px 0;
        color: #666;
        font-size: 12px;
        line-height: 1.4;
      }

      mat-chip {
        font-size: 11px;
        height: 20px;
        font-weight: 500;
      }

      .category-contract {
        background: #e53e3e;
        color: white;
      }
      .category-insurance {
        background: #3182ce;
        color: white;
      }
      .category-payment {
        background: #22c35e;
        color: white;
      }
      .category-identity {
        background: #805ad5;
        color: white;
      }
      .category-other {
        background: #718096;
        color: white;
      }

      .no-documents {
        text-align: center;
        padding: 60px 20px;
        color: #666;
      }

      .large-icon {
        font-size: 64px;
        height: 64px;
        width: 64px;
        color: #ccc;
        margin-bottom: 16px;
      }

      .delete-action {
        color: #e53e3e !important;
      }

      mat-card-actions {
        padding: 8px 16px 16px !important;
      }

      mat-card-actions button {
        margin-right: 8px;
      }
    `,
  ],
})
export class DocumentManagerComponent implements OnInit {
  documents: DocumentItem[] = [];

  constructor(
    private documentService: DocumentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  private loadDocuments(): void {
    this.documentService.getDocuments().subscribe((docs) => {
      this.documents = docs;
    });
  }

  openUploadDialog(): void {
    const dialogRef = this.dialog.open(DocumentUploadDialogComponent, {
      width: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Documento caricato con successo!', 'Chiudi', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
      }
    });
  }

  viewDocument(doc: DocumentItem): void {
    if (this.canPreview(doc.type)) {
      this.dialog.open(DocumentViewerDialogComponent, {
        width: '90vw',
        height: '90vh',
        maxWidth: '1200px',
        data: doc,
      });
    }
  }

  downloadDocument(doc: DocumentItem): void {
    this.documentService.downloadDocument(doc.id);
    this.snackBar.open('Download avviato', 'Chiudi', {
      duration: 2000,
    });
  }

  editDocument(doc: DocumentItem): void {
    // TODO: Implement edit functionality
    this.snackBar.open('Funzionalità di modifica in arrivo', 'Chiudi', {
      duration: 2000,
    });
  }

  deleteDocument(doc: DocumentItem): void {
    if (
      confirm(
        `Sei sicuro di voler eliminare il documento "${doc.originalName}"?`
      )
    ) {
      this.documentService.deleteDocument(doc.id).subscribe(() => {
        this.snackBar.open('Documento eliminato', 'Chiudi', {
          duration: 2000,
          panelClass: ['warning-snackbar'],
        });
      });
    }
  }

  getFileIcon(type: string): string {
    switch (type) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'image':
        return 'image';
      case 'excel':
        return 'table_chart';
      case 'word':
        return 'description';
      case 'text':
        return 'article';
      default:
        return 'insert_drive_file';
    }
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'contract':
        return 'Contratto';
      case 'insurance':
        return 'Assicurazione';
      case 'payment':
        return 'Pagamento';
      case 'identity':
        return 'Documenti Identità';
      case 'other':
        return 'Altro';
      default:
        return 'Sconosciuto';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  canPreview(type: string): boolean {
    return ['pdf', 'image', 'text'].includes(type);
  }
}
