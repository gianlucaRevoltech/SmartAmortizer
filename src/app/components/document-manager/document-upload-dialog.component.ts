import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { DocumentService, DocumentItem } from '../../services/document.service';

@Component({
  selector: 'app-document-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    ReactiveFormsModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>upload</mat-icon>
      Carica Nuovo Documento
    </h2>

    <form [formGroup]="uploadForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="upload-section">
          <div
            class="file-drop-zone"
            [class.dragover]="isDragOver"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            (click)="fileInput.click()"
          >
            <div *ngIf="!selectedFile" class="drop-message">
              <mat-icon class="upload-icon">cloud_upload</mat-icon>
              <p>
                <strong>Clicca per selezionare</strong> o trascina qui il file
              </p>
              <small
                >Formati supportati: PDF, immagini, Excel, Word, documenti di
                testo</small
              >
            </div>
            <div *ngIf="selectedFile" class="file-selected">
              <mat-icon>{{ getFileIcon(selectedFile.name) }}</mat-icon>
              <div class="file-info">
                <strong>{{ selectedFile.name }}</strong>
                <small>{{ formatFileSize(selectedFile.size) }}</small>
              </div>
              <button
                mat-icon-button
                type="button"
                (click)="removeFile(); $event.stopPropagation()"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
          <input
            #fileInput
            type="file"
            hidden
            accept=".pdf,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.docx,.doc,.txt"
            (change)="onFileSelected($event)"
          />
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Categoria</mat-label>
          <mat-select formControlName="category" required>
            <mat-option value="contract">Contratto</mat-option>
            <mat-option value="insurance">Assicurazione</mat-option>
            <mat-option value="payment">Ricevute Pagamento</mat-option>
            <mat-option value="identity">Documenti Identità</mat-option>
            <mat-option value="other">Altro</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descrizione (opzionale)</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="3"
            placeholder="Aggiungi una descrizione del documento..."
          ></textarea>
        </mat-form-field>

        <mat-progress-bar
          *ngIf="isUploading"
          mode="indeterminate"
        ></mat-progress-bar>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button
          mat-button
          type="button"
          (click)="onCancel()"
          [disabled]="isUploading"
        >
          Annulla
        </button>
        <button
          mat-raised-button
          color="primary"
          type="submit"
          [disabled]="!uploadForm.valid || !selectedFile || isUploading"
        >
          <mat-icon>upload</mat-icon>
          {{ isUploading ? 'Caricamento...' : 'Carica Documento' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .upload-section {
        margin-bottom: 20px;
      }

      .file-drop-zone {
        border: 2px dashed #ccc;
        border-radius: 8px;
        padding: 40px 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 20px;
      }

      .file-drop-zone:hover,
      .file-drop-zone.dragover {
        border-color: #3f51b5;
        background-color: #f5f5f5;
      }

      .drop-message {
        color: #666;
      }

      .upload-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
        color: #ccc;
        margin-bottom: 16px;
      }

      .file-selected {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f5f5f5;
        border-radius: 6px;
      }

      .file-selected mat-icon {
        color: #3f51b5;
        font-size: 24px;
      }

      .file-info {
        flex: 1;
        text-align: left;
      }

      .file-info small {
        display: block;
        color: #666;
        font-size: 12px;
      }

      .full-width {
        width: 100%;
        margin-bottom: 16px;
      }

      mat-dialog-content {
        min-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
      }

      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
      }
    `,
  ],
})
export class DocumentUploadDialogComponent {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  isDragOver = false;
  isUploading = false;

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentService,
    private dialogRef: MatDialogRef<DocumentUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.uploadForm = this.fb.group({
      category: ['', Validators.required],
      description: [''],
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  onSubmit(): void {
    if (this.uploadForm.valid && this.selectedFile) {
      this.isUploading = true;

      const formValue = this.uploadForm.value;
      this.documentService
        .addDocument(
          this.selectedFile,
          formValue.category,
          undefined, // loanId - can be added later
          formValue.description
        )
        .subscribe({
          next: (document) => {
            this.isUploading = false;
            this.dialogRef.close(document);
          },
          error: (error) => {
            this.isUploading = false;
            console.error('Error uploading document:', error);
          },
        });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'picture_as_pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'xls':
      case 'xlsx':
        return 'table_chart';
      case 'doc':
      case 'docx':
        return 'description';
      case 'txt':
        return 'article';
      default:
        return 'insert_drive_file';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
