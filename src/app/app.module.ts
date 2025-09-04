import { NgModule, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AmortizationPlanComponent } from './components/amortization-plan/amortization-plan.component';
import { MaterialModule } from './material.module';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NewLoanComponent } from './components/new-loan/new-loan.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';

// Register the Italian locale
registerLocaleData(localeIt);

@NgModule({
  declarations: [
    AppComponent,
    AmortizationPlanComponent,
    NewLoanComponent,
    ConfirmDialogComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MaterialModule,
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'it-IT' },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
