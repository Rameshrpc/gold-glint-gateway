import { useState } from 'react';

export function useSourceAccount() {
  const [sourceType, setSourceType] = useState('');
  const [sourceBankId, setSourceBankId] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [selectedLoyaltyId, setSelectedLoyaltyId] = useState('');

  const resetSourceAccount = () => {
    setSourceType('');
    setSourceBankId('');
    setSourceAccountId('');
    setSelectedLoyaltyId('');
  };

  const getSourceAccountData = (paymentMode: string) => {
    if (paymentMode === 'cash') {
      return {
        source_type: 'cash' as const,
        source_bank_id: null,
        source_account_id: null,
      };
    }

    return {
      source_type: sourceType || null,
      source_bank_id: sourceType === 'company' ? sourceBankId || null : null,
      source_account_id: sourceType === 'employee' ? sourceAccountId || null : null,
    };
  };

  return {
    sourceType,
    setSourceType,
    sourceBankId,
    setSourceBankId,
    sourceAccountId,
    setSourceAccountId,
    selectedLoyaltyId,
    setSelectedLoyaltyId,
    resetSourceAccount,
    getSourceAccountData,
  };
}
