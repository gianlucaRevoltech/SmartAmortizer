export interface LoanItem {
  id: number;
  name: string;
  type: 'House' | 'Car' | 'Appliance';
  totalAmount: number;
  remainingAmount: number;
  interestRate: number; // T.A.N.
  installments: number;
  paidInstallments: number;
  amortizationPlan: AmortizationItem[];
  // Additional financial details
  taeg?: number; // T.A.E.G.
  vehiclePrice?: number; // Prezzo di vendita del veicolo
  downPayment?: number; // Importo anticipo
  totalServices?: number; // Totale servizi accessori
  practiceExpenses?: number; // Spese istruttoria pratica
  totalInterests?: number; // Totale interessi calcolato
  insurancePerInstallment?: number; // Assicurazione per rata
}

export interface AmortizationItem {
  installment: number;
  dueDate: Date; // Data di scadenza della rata
  paymentDate: Date | null; // Data effettiva di pagamento
  amount: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  paid: boolean;
}
