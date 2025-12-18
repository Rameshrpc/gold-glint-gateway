import { LanguageMode } from '@/lib/bilingual-utils';

export interface GoldItemPrintData {
  item_type: string;
  description?: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  stone_weight_grams?: number;
  purity: string;
  purity_percentage: number;
  appraised_value: number;
  market_rate_per_gram: number;
  market_value?: number;
  image_url?: string;
}

export interface CustomerPrintData {
  full_name: string;
  full_name_tamil?: string;
  customer_code: string;
  phone: string;
  alternate_phone?: string;
  address?: string;
  address_tamil?: string;
  city?: string;
  state?: string;
  pincode?: string;
  date_of_birth?: string;
  gender?: string;
  photo_url?: string;
  aadhaar_front_url?: string;
  aadhaar_back_url?: string;
  pan_card_url?: string;
  nominee_name?: string;
  nominee_relation?: string;
}

export interface BranchPrintData {
  branch_name: string;
  branch_code: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface ClientPrintData {
  company_name: string;
  company_name_tamil?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  license_number?: string;
}

export interface SchemePrintData {
  scheme_name: string;
  interest_rate: number;
  shown_rate?: number;
  tenure_days: number;
}

export interface LoanPrintData {
  loan: {
    id: string;
    loan_number: string;
    loan_date: string;
    principal_amount: number;
    shown_principal?: number;
    actual_principal?: number;
    interest_rate: number;
    tenure_days: number;
    maturity_date: string;
    net_disbursed: number;
    processing_fee?: number;
    document_charges?: number;
    advance_interest_shown?: number;
    advance_interest_actual?: number;
    jewel_photo_url?: string;
    appraiser_sheet_url?: string;
    status: string;
    remarks?: string;
    disbursement_mode?: string;
    payment_reference?: string;
  };
  customer: CustomerPrintData;
  gold_items: GoldItemPrintData[];
  branch: BranchPrintData;
  client: ClientPrintData;
  scheme: SchemePrintData;
  meta: {
    created_by?: string;
    created_by_name?: string;
    created_at: string;
    language: LanguageMode;
    print_timestamp: string;
  };
}

export interface InterestPaymentPrintData {
  id: string;
  receipt_number: string;
  loan_number: string;
  payment_date: string;
  period_from: string;
  period_to: string;
  days_covered: number;
  shown_interest: number;
  actual_interest: number;
  amount_paid: number;
  penalty_amount?: number;
  payment_mode: string;
  outstanding_principal: number;
  customer: CustomerPrintData;
  branch: BranchPrintData;
  client: ClientPrintData;
  meta: {
    collected_by?: string;
    language: LanguageMode;
    print_timestamp: string;
  };
}

export interface RedemptionPrintData {
  id: string;
  redemption_number: string;
  loan_number: string;
  redemption_date: string;
  principal_settled: number;
  interest_settled: number;
  penalty_settled?: number;
  total_settled: number;
  rebate_amount?: number;
  payment_mode: string;
  gold_items: GoldItemPrintData[];
  customer: CustomerPrintData;
  branch: BranchPrintData;
  client: ClientPrintData;
  meta: {
    processed_by?: string;
    language: LanguageMode;
    print_timestamp: string;
  };
}

export interface AuctionPrintData {
  id: string;
  auction_lot_number: string;
  loan_number: string;
  loan_date: string;
  maturity_date: string;
  auction_date: string;
  auction_time?: string;
  auction_venue?: string;
  outstanding_principal: number;
  outstanding_interest: number;
  outstanding_penalty?: number;
  total_outstanding: number;
  reserve_price: number;
  total_gold_weight_grams: number;
  total_appraised_value: number;
  last_date_to_pay?: string;
  gold_items: GoldItemPrintData[];
  customer: CustomerPrintData;
  branch: BranchPrintData;
  client: ClientPrintData;
  meta: {
    notice_sent_date?: string;
    language: LanguageMode;
    print_timestamp: string;
  };
}

export type PrintDocumentType = 
  | 'loan_receipt_customer'
  | 'loan_receipt_office'
  | 'kyc_cards'
  | 'jewel_photo'
  | 'gold_declaration'
  | 'terms_conditions'
  | 'interest_receipt'
  | 'redemption_receipt'
  | 'auction_notice';

export interface PrintPackConfig {
  id: string;
  pack_name: string;
  pack_type: 'loan' | 'interest' | 'redemption' | 'auction';
  language: LanguageMode;
  documents: PrintPackDocument[];
}

export interface PrintPackDocument {
  document_type: PrintDocumentType;
  sequence_order: number;
  copies: number;
  copy_label?: string;
  is_mandatory: boolean;
  page_layout: 'full' | 'half' | 'quarter';
}

// Default 6-page loan pack configuration
export const DEFAULT_LOAN_PACK: PrintPackDocument[] = [
  { document_type: 'loan_receipt_customer', sequence_order: 1, copies: 1, copy_label: 'CUSTOMER COPY', is_mandatory: true, page_layout: 'full' },
  { document_type: 'loan_receipt_office', sequence_order: 2, copies: 1, copy_label: 'OFFICE COPY', is_mandatory: true, page_layout: 'full' },
  { document_type: 'kyc_cards', sequence_order: 3, copies: 1, is_mandatory: true, page_layout: 'full' },
  { document_type: 'jewel_photo', sequence_order: 4, copies: 1, is_mandatory: true, page_layout: 'full' },
  { document_type: 'gold_declaration', sequence_order: 5, copies: 1, is_mandatory: true, page_layout: 'full' },
  { document_type: 'terms_conditions', sequence_order: 6, copies: 1, is_mandatory: true, page_layout: 'full' },
];
