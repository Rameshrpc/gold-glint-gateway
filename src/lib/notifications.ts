// Native SMS and WhatsApp notification utilities
// Uses device URL schemes to open native apps

/**
 * Format phone number for WhatsApp (international format without +)
 */
export const formatPhoneForWhatsApp = (phone: string, countryCode = '91'): string => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // If already has country code, return as is
  if (cleanPhone.startsWith(countryCode) && cleanPhone.length > 10) {
    return cleanPhone;
  }
  
  // If 10 digits, add country code
  if (cleanPhone.length === 10) {
    return `${countryCode}${cleanPhone}`;
  }
  
  return cleanPhone;
};

/**
 * Open native SMS app with pre-filled message
 */
export const openSMS = (phone: string, message: string): void => {
  const encodedMessage = encodeURIComponent(message);
  // Use sms: URL scheme - works on mobile and some desktop
  window.location.href = `sms:${phone}?body=${encodedMessage}`;
};

/**
 * Open WhatsApp with pre-filled message
 * Uses wa.me which works on mobile (opens app) and desktop (opens WhatsApp Web)
 */
export const openWhatsApp = (phone: string, message: string, countryCode = '91'): void => {
  const fullPhone = formatPhoneForWhatsApp(phone, countryCode);
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${fullPhone}?text=${encodedMessage}`, '_blank');
};

/**
 * Replace template variables with actual values
 * Variables are in format {{variable_name}}
 */
export const generateMessageFromTemplate = (
  template: string, 
  variables: Record<string, string | number | undefined>
): string => {
  let message = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    message = message.replace(placeholder, String(value ?? ''));
  }
  
  return message;
};

/**
 * Default notification templates
 */
export const DEFAULT_TEMPLATES = {
  interest_reminder: {
    sms: 'Dear {{customer_name}}, your interest of Rs.{{amount}} for loan {{loan_number}} is due on {{due_date}}. Please pay to avoid penalty. - {{company_name}}',
    whatsapp: 'Dear *{{customer_name}}*,\n\nThis is a reminder that your interest payment of *Rs.{{amount}}* for loan *{{loan_number}}* is due on *{{due_date}}*.\n\nPlease make the payment at your earliest convenience to avoid any penalty charges.\n\nThank you,\n{{company_name}}'
  },
  payment_received: {
    sms: 'Dear {{customer_name}}, we have received Rs.{{amount}} for loan {{loan_number}}. Thank you for your payment. - {{company_name}}',
    whatsapp: 'Dear *{{customer_name}}*,\n\nWe have received your payment of *Rs.{{amount}}* for loan *{{loan_number}}*.\n\nReceipt No: {{receipt_number}}\nDate: {{payment_date}}\n\nThank you for your prompt payment!\n\n{{company_name}}'
  },
  loan_disbursed: {
    sms: 'Dear {{customer_name}}, your loan of Rs.{{amount}} ({{loan_number}}) has been disbursed. Interest rate: {{interest_rate}}% p.a. - {{company_name}}',
    whatsapp: 'Dear *{{customer_name}}*,\n\nYour gold loan has been successfully disbursed.\n\n*Loan Details:*\nLoan No: {{loan_number}}\nAmount: Rs.{{amount}}\nInterest Rate: {{interest_rate}}% p.a.\n\nPlease keep your loan receipt safely.\n\nThank you for choosing {{company_name}}!'
  },
  overdue_notice: {
    sms: 'Dear {{customer_name}}, your loan {{loan_number}} is overdue by {{days}} days. Outstanding: Rs.{{amount}}. Pay immediately to avoid auction. - {{company_name}}',
    whatsapp: 'Dear *{{customer_name}}*,\n\n⚠️ *URGENT: Loan Overdue Notice*\n\nYour loan *{{loan_number}}* is overdue by *{{days}} days*.\n\nOutstanding Amount: *Rs.{{amount}}*\n\nPlease make immediate payment to avoid further penalty and auction proceedings.\n\nContact us immediately if you need assistance.\n\n{{company_name}}'
  },
  redemption_complete: {
    sms: 'Dear {{customer_name}}, your loan {{loan_number}} has been fully redeemed. Gold items released. Thank you for your trust. - {{company_name}}',
    whatsapp: 'Dear *{{customer_name}}*,\n\n✅ *Loan Redemption Complete*\n\nYour loan *{{loan_number}}* has been successfully redeemed.\n\nYour gold items have been released. Please collect them at your earliest convenience.\n\nThank you for choosing {{company_name}}!\n\nWe look forward to serving you again.'
  },
  auction_notice: {
    sms: 'URGENT: Dear {{customer_name}}, your loan {{loan_number}} pledged gold will be auctioned on {{auction_date}} if not redeemed. Contact us immediately. - {{company_name}}',
    whatsapp: '🚨 *URGENT AUCTION NOTICE*\n\nDear *{{customer_name}}*,\n\nThis is to inform you that the gold items pledged against loan *{{loan_number}}* will be put up for auction on *{{auction_date}}* due to non-payment.\n\n*Outstanding Amount:* Rs.{{amount}}\n\nPlease contact us immediately to avoid auction of your pledged items.\n\n{{company_name}}\n📞 {{company_phone}}'
  }
} as const;

export type TemplateType = keyof typeof DEFAULT_TEMPLATES;

/**
 * Get common loan variables for template substitution
 */
export const getLoanVariables = (loan: {
  loan_number: string;
  principal_amount: number;
  interest_rate: number;
  loan_date: string;
  maturity_date: string;
  customer: {
    full_name: string;
    phone: string;
  };
}, companyName: string): Record<string, string | number> => {
  return {
    customer_name: loan.customer.full_name,
    loan_number: loan.loan_number,
    amount: loan.principal_amount.toLocaleString('en-IN'),
    interest_rate: loan.interest_rate,
    loan_date: new Date(loan.loan_date).toLocaleDateString('en-IN'),
    maturity_date: new Date(loan.maturity_date).toLocaleDateString('en-IN'),
    company_name: companyName,
  };
};
