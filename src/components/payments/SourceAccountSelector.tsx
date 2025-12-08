import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface BankNbfc {
  id: string;
  bank_code: string;
  bank_name: string;
  account_number: string | null;
}

interface Loyalty {
  id: string;
  loyalty_code: string;
  full_name: string;
}

interface LoyaltyBankAccount {
  id: string;
  account_number: string;
  account_holder_name: string;
  account_type: string;
  bank?: { bank_name: string };
}

interface SourceAccountSelectorProps {
  clientId: string;
  paymentMode: string;
  sourceType: string;
  setSourceType: (value: string) => void;
  sourceBankId: string;
  setSourceBankId: (value: string) => void;
  sourceAccountId: string;
  setSourceAccountId: (value: string) => void;
  selectedLoyaltyId: string;
  setSelectedLoyaltyId: (value: string) => void;
  disabled?: boolean;
}

export default function SourceAccountSelector({
  clientId,
  paymentMode,
  sourceType,
  setSourceType,
  sourceBankId,
  setSourceBankId,
  sourceAccountId,
  setSourceAccountId,
  selectedLoyaltyId,
  setSelectedLoyaltyId,
  disabled = false,
}: SourceAccountSelectorProps) {
  const [banks, setBanks] = useState<BankNbfc[]>([]);
  const [loyalties, setLoyalties] = useState<Loyalty[]>([]);
  const [loyaltyBankAccounts, setLoyaltyBankAccounts] = useState<LoyaltyBankAccount[]>([]);

  useEffect(() => {
    if (clientId) {
      fetchBanks();
      fetchLoyalties();
    }
  }, [clientId]);

  useEffect(() => {
    if (selectedLoyaltyId && clientId) {
      fetchLoyaltyBankAccounts(selectedLoyaltyId);
    } else {
      setLoyaltyBankAccounts([]);
    }
  }, [selectedLoyaltyId, clientId]);

  const fetchBanks = async () => {
    const { data } = await supabase
      .from('banks_nbfc')
      .select('id, bank_code, bank_name, account_number')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('bank_name');
    setBanks(data || []);
  };

  const fetchLoyalties = async () => {
    const { data } = await supabase
      .from('loyalties')
      .select('id, loyalty_code, full_name')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('full_name');
    setLoyalties(data || []);
  };

  const fetchLoyaltyBankAccounts = async (loyaltyId: string) => {
    const { data } = await supabase
      .from('loyalty_bank_accounts')
      .select('id, account_number, account_holder_name, account_type, bank:banks_nbfc(bank_name)')
      .eq('client_id', clientId)
      .eq('loyalty_id', loyaltyId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false });
    setLoyaltyBankAccounts(data || []);
  };

  // Don't show for cash payments
  if (paymentMode === 'cash') {
    return null;
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        Source Account Details
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Source Type</Label>
          <Select 
            value={sourceType} 
            onValueChange={(val) => {
              setSourceType(val);
              setSourceBankId('');
              setSourceAccountId('');
              setSelectedLoyaltyId('');
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Company Account</SelectItem>
              <SelectItem value="employee">Employee Account</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {sourceType === 'company' && (
          <div className="space-y-2">
            <Label>Company Bank Account</Label>
            <Select value={sourceBankId} onValueChange={setSourceBankId} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                {banks.map(bank => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.bank_name} {bank.account_number && `- ${bank.account_number}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {sourceType === 'employee' && (
          <>
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select 
                value={selectedLoyaltyId} 
                onValueChange={(val) => {
                  setSelectedLoyaltyId(val);
                  setSourceAccountId('');
                }}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {loyalties.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.full_name} ({l.loyalty_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLoyaltyId && (
              <div className="space-y-2 md:col-span-2">
                <Label>Employee Bank Account</Label>
                {loyaltyBankAccounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No bank accounts found for this employee
                  </p>
                ) : (
                  <Select value={sourceAccountId} onValueChange={setSourceAccountId} disabled={disabled}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {loyaltyBankAccounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.bank?.bank_name} - A/C {acc.account_number} ({acc.account_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
