import React from 'react';
import { LoanDisbursementPDF } from '@/components/receipts/LoanDisbursementPDF';
import { LoanBilingualTemplate } from '@/components/receipts/templates/LoanBilingualTemplate';
import { TamilNaduPawnbrokerA4Template } from '@/components/receipts/templates/TamilNaduPawnbrokerA4Template';
import { TamilNaduPawnbrokerThermalTemplate } from '@/components/receipts/templates/TamilNaduPawnbrokerThermalTemplate';

export interface TemplateData {
  company: {
    name: string;
    nameTamil?: string;
    address?: string;
    phone?: string;
    email?: string;
    license_number?: string;
  };
  loan: {
    loan_number: string;
    loan_date: string;
    principal_amount: number;
    interest_rate: number;
    tenure_days: number;
    maturity_date: string;
    advance_interest?: number;
    net_disbursed: number;
  };
  customer: {
    full_name: string;
    father_name?: string;
    customer_code: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    photo_url?: string;
    aadhaar_front_url?: string;
    aadhaar_back_url?: string;
    pan_card_url?: string;
  };
  scheme: {
    name: string;
    rate: number;
    ltvPercentage: number;
  };
  goldItems: Array<{
    item_type: string;
    description?: string;
    gross_weight_grams: number;
    net_weight_grams: number;
    purity: string;
    purity_percentage: number;
    appraised_value: number;
    image_url?: string;
  }>;
  calculation: {
    totalAppraisedValue: number;
    principalAmount: number;
    advanceInterest: number;
    processingFee: number;
    documentCharges?: number;
    netDisbursed: number;
  };
  jewelPhotos?: {
    timestamp?: string;
    appraiser_name?: string;
    appraiser_sheet_url?: string;
  };
  rebateSchedule?: Array<{
    dayRange: string;
    rebateAmount: number;
  }>;
  customTerms?: string[];
  logoUrl?: string | null;
  place?: string;
}

// Map template codes to components
const TEMPLATE_MAP: Record<string, {
  component: React.ComponentType<any>;
  transformer: (data: TemplateData) => any;
}> = {
  // Tamil Nadu Pawnbroker Templates
  'LOAN_TN_PAWNBROKER_A4': {
    component: TamilNaduPawnbrokerA4Template,
    transformer: transformToTNPawnbroker,
  },
  'LOAN_TN_PAWNBROKER_THERMAL': {
    component: TamilNaduPawnbrokerThermalTemplate,
    transformer: transformToTNPawnbroker,
  },
  // Bilingual Templates
  'LOAN_BILINGUAL_FORMAL': {
    component: LoanBilingualTemplate,
    transformer: transformToBilingual,
  },
  // Default Template
  'LOAN_DEFAULT': {
    component: LoanDisbursementPDF,
    transformer: transformToDefault,
  },
};

// Transform data for Tamil Nadu Pawnbroker templates
function transformToTNPawnbroker(data: TemplateData) {
  return {
    company: {
      name: data.company.name,
      nameTamil: data.company.nameTamil || '',
      address: data.company.address || '',
      phone: data.company.phone || '',
      email: data.company.email || '',
      license_number: data.company.license_number || '',
    },
    loan: {
      loan_number: data.loan.loan_number,
      loan_date: data.loan.loan_date,
      principal_amount: data.loan.principal_amount,
      interest_rate: data.loan.interest_rate,
      tenure_days: data.loan.tenure_days,
      maturity_date: data.loan.maturity_date,
      advance_interest: data.loan.advance_interest || 0,
      net_disbursed: data.loan.net_disbursed,
    },
    customer: {
      full_name: data.customer.full_name,
      father_name: data.customer.father_name || '',
      customer_code: data.customer.customer_code,
      phone: data.customer.phone,
      address: [
        data.customer.address,
        data.customer.city,
        data.customer.state,
        data.customer.pincode
      ].filter(Boolean).join(', '),
      photo_url: data.customer.photo_url || undefined,
      aadhaar_front_url: data.customer.aadhaar_front_url || undefined,
      aadhaar_back_url: data.customer.aadhaar_back_url || undefined,
      pan_card_url: data.customer.pan_card_url || undefined,
    },
    goldItems: data.goldItems.map(item => ({
      item_type: item.item_type,
      description: item.description || '',
      gross_weight_grams: item.gross_weight_grams,
      net_weight_grams: item.net_weight_grams,
      purity: item.purity,
      purity_percentage: item.purity_percentage,
      appraised_value: item.appraised_value,
      image_url: item.image_url,
    })),
    rebateSchedule: data.rebateSchedule || [],
    jewelPhotos: data.jewelPhotos ? {
      timestamp: data.jewelPhotos.timestamp,
      appraiser_name: data.jewelPhotos.appraiser_name,
      appraiser_sheet_url: data.jewelPhotos.appraiser_sheet_url,
    } : undefined,
    customTerms: data.customTerms,
    logoUrl: data.logoUrl,
    place: data.place || '',
  };
}

// Transform data for Bilingual templates
function transformToBilingual(data: TemplateData) {
  return {
    company: {
      name: data.company.name,
      nameTamil: data.company.nameTamil || '',
      address: data.company.address || '',
      phone: data.company.phone || '',
    },
    loan: {
      number: data.loan.loan_number,
      date: data.loan.loan_date,
      maturityDate: data.loan.maturity_date,
      tenureDays: data.loan.tenure_days,
    },
    customer: {
      name: data.customer.full_name,
      code: data.customer.customer_code,
      phone: data.customer.phone,
      address: data.customer.address || '',
    },
    scheme: {
      name: data.scheme.name,
      rate: data.scheme.rate,
    },
    goldItems: data.goldItems,
    calculation: data.calculation,
    language: 'bilingual' as const,
  };
}

// Transform data for default LoanDisbursementPDF
function transformToDefault(data: TemplateData) {
  return {
    company: {
      name: data.company.name,
      address: data.company.address,
      phone: data.company.phone,
      email: data.company.email,
    },
    loan: {
      number: data.loan.loan_number,
      date: data.loan.loan_date,
      maturityDate: data.loan.maturity_date,
      tenureDays: data.loan.tenure_days,
    },
    customer: {
      name: data.customer.full_name,
      code: data.customer.customer_code,
      phone: data.customer.phone,
    },
    scheme: {
      name: data.scheme.name,
      rate: data.scheme.rate,
      ltvPercentage: data.scheme.ltvPercentage,
    },
    goldItems: data.goldItems.map(item => ({
      item_type: item.item_type,
      gross_weight_grams: item.gross_weight_grams,
      net_weight_grams: item.net_weight_grams,
      purity: item.purity,
      appraised_value: item.appraised_value,
    })),
    calculation: data.calculation,
    rebateSchedule: data.rebateSchedule ? {
      slots: data.rebateSchedule.map(slot => ({
        dayRange: slot.dayRange,
        rebateAmount: slot.rebateAmount,
      })),
    } : undefined,
  };
}

// Resolve template code to component and render
export function resolveTemplate(templateCode: string, data: TemplateData): React.ReactElement {
  const template = TEMPLATE_MAP[templateCode] || TEMPLATE_MAP['LOAN_DEFAULT'];
  const Component = template.component;
  const transformedData = template.transformer(data);
  
  return <Component {...transformedData} />;
}

// Get template by paper size
export function getTemplateCodeByPaperSize(baseTemplateCode: string, paperSize: 'a4' | 'a5' | 'thermal'): string {
  // If the template already specifies a paper size, return as-is
  if (baseTemplateCode.includes('_A4') || baseTemplateCode.includes('_THERMAL')) {
    return baseTemplateCode;
  }
  
  // For TN Pawnbroker, switch between A4 and Thermal
  if (baseTemplateCode === 'LOAN_TN_PAWNBROKER_A4' && paperSize === 'thermal') {
    return 'LOAN_TN_PAWNBROKER_THERMAL';
  }
  if (baseTemplateCode === 'LOAN_TN_PAWNBROKER_THERMAL' && paperSize !== 'thermal') {
    return 'LOAN_TN_PAWNBROKER_A4';
  }
  
  return baseTemplateCode;
}

// Check if a template code is valid
export function isValidTemplateCode(templateCode: string): boolean {
  return templateCode in TEMPLATE_MAP;
}

// Get all available template codes
export function getAvailableTemplateCodes(): string[] {
  return Object.keys(TEMPLATE_MAP);
}
