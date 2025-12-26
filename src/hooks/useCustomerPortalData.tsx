import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomerAuth } from './useCustomerAuth';

interface CustomerPortalData {
  customer: any;
  client: any;
  summary: {
    totalActiveLoans: number;
    totalPrincipal: number;
    totalInterestDue: number;
    overdueLoansCount: number;
    totalLoans: number;
  };
  loans: any[];
  recentPayments: any[];
  redemptions: any[];
}

interface LoanDetailsData {
  customer: any;
  client: any;
  loan: any;
  goldItems: any[];
  payments: any[];
  redemption: any | null;
}

export function useCustomerPortalData() {
  const { session, isAuthenticated } = useCustomerAuth();
  const [data, setData] = useState<CustomerPortalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.sessionToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: response, error: fnError } = await supabase.functions.invoke('customer-portal-data', {
        headers: {
          'x-customer-session': session.sessionToken,
        },
        body: {},
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch data');
      }

      setData(response.data);
    } catch (e: any) {
      console.error('Portal data fetch error:', e);
      setError(e.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [session?.sessionToken]);

  useEffect(() => {
    if (isAuthenticated && session) {
      fetchData();
    }
  }, [isAuthenticated, session, fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useCustomerLoanDetails(loanId: string | undefined) {
  const { session, isAuthenticated } = useCustomerAuth();
  const [data, setData] = useState<LoanDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.sessionToken || !loanId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: response, error: fnError } = await supabase.functions.invoke('customer-portal-data?action=loan-details&loanId=' + loanId, {
        headers: {
          'x-customer-session': session.sessionToken,
        },
        body: {},
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch loan details');
      }

      setData(response.data);
    } catch (e: any) {
      console.error('Loan details fetch error:', e);
      setError(e.message || 'Failed to load loan details');
    } finally {
      setIsLoading(false);
    }
  }, [session?.sessionToken, loanId]);

  useEffect(() => {
    if (isAuthenticated && session && loanId) {
      fetchData();
    }
  }, [isAuthenticated, session, loanId, fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
