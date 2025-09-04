import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentItem } from '../../services/document.service';

@Component({
  selector: 'app-document-viewer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
  ],
  template: `
    <mat-toolbar>
      <span>{{ document.originalName }}</span>
      <span class="spacer"></span>
      <button mat-icon-button (click)="downloadDocument()">
        <mat-icon>download</mat-icon>
      </button>
      <button mat-icon-button (click)="closeDialog()">
        <mat-icon>close</mat-icon>
      </button>
    </mat-toolbar>

    <div class="viewer-container">
      <!-- PDF Viewer -->
      <iframe
        *ngIf="document.type === 'pdf'"
        [src]="safeUrl"
        class="document-frame"
      >
      </iframe>

      <!-- Image Viewer -->
      <div *ngIf="document.type === 'image'" class="image-viewer">
        <img
          [src]="document.base64Data"
          [alt]="document.originalName"
          class="document-image"
        />
      </div>

      <!-- Text Viewer -->
      <div *ngIf="document.type === 'text'" class="text-viewer">
        <pre class="text-content">{{ getTextContent() }}</pre>
      </div>

      <!-- Not supported -->
      <div *ngIf="!canPreview()" class="not-supported">
        <mat-icon class="large-icon">error_outline</mat-icon>
        <h3>Anteprima non disponibile</h3>
        <p>Questo tipo di file non può essere visualizzato nel browser.</p>
        <button mat-raised-button color="primary" (click)="downloadDocument()">
          <mat-icon>download</mat-icon>
          Scarica per aprire
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .viewer-container {
        height: calc(90vh - 64px);
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .document-frame {
        width: 100%;
        height: 100%;
        border: none;
      }

      .image-viewer {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
      }

      .document-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .text-viewer {
        width: 100%;
        height: 100%;
        overflow: auto;
        padding: 20px;
        background: #fafafa;
      }

      .text-content {
        font-family: 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .not-supported {
        text-align: center;
        padding: 40px;
        color: #666;
      }

      .large-icon {
        font-size: 64px;
        height: 64px;
        width: 64px;
        color: #ccc;
        margin-bottom: 16px;
      }

      .spacer {
        flex: 1 1 auto;
      }

      mat-toolbar {
        background: #3f51b5;
        color: white;
      }
    `,
  ],
})
export class DocumentViewerDialogComponent {
  safeUrl: SafeResourceUrl | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public document: DocumentItem,
    private dialogRef: MatDialogRef<DocumentViewerDialogComponent>,
    private sanitizer: DomSanitizer
  ) {
    if (document.type === 'pdf') {
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        document.base64Data
      );
    }
  }

  canPreview(): boolean {
    return ['pdf', 'image', 'text'].includes(this.document.type);
  }

  getTextContent(): string {
    try {
      // Extract text content from base64 data URL
      const base64Data = this.document.base64Data.split(',')[1];
      return atob(base64Data);
    } catch (error) {
      return 'Errore nel caricamento del contenuto del file.';
    }
  }

  downloadDocument(): void {
    const link = globalThis.document.createElement('a');
    link.href = this.document.base64Data;
    link.download = this.document.originalName;
    link.click();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
