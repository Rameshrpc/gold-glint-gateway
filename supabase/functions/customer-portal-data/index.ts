import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interest calculation functions (synced with src/lib/interestCalculations.ts)
function calculateInterest(principal: number, annualRate: number, days: number): number {
  return (principal * annualRate * days) / (100 * 365);
}

function getDaysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

interface DualRateInterest {
  shownInterest: number;
  actualInterest: number;
  differential: number;
  penalty: number;
  totalDue: number;
  days: number;
}

function calculateDualRateInterest(
  actualPrincipal: number,
  shownRate: number,
  effectiveRate: number,
  days: number,
  penaltyRate: number = 2,
  gracePeriodDays: number = 7
): DualRateInterest {
  const shownInterest = calculateInterest(actualPrincipal, shownRate, days);
  const actualInterest = calculateInterest(actualPrincipal, effectiveRate, days);
  const differential = actualInterest - shownInterest;
  
  let penalty = 0;
  const overdueDays = Math.max(0, days - 30 - gracePeriodDays);
  if (overdueDays > 0) {
    penalty = calculateInterest(actualPrincipal, penaltyRate * 12, overdueDays);
  }
  
  const totalDue = shownInterest + differential + penalty;
  
  return {
    shownInterest: Math.round(shownInterest),
    actualInterest: Math.round(actualInterest),
    differential: Math.round(differential),
    penalty: Math.round(penalty),
    totalDue: Math.round(totalDue),
    days,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get session token from header
    const sessionToken = req.headers.get('x-customer-session');
    
    if (!sessionToken) {
      console.error('[customer-portal-data] Missing session token');
      return new Response(
        JSON.stringify({ success: false, error: 'Session token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session
    const { data: session, error: sessionError } = await supabase
      .from('customer_sessions')
      .select('customer_id, client_id, is_verified, session_expires_at')
      .eq('session_token', sessionToken)
      .single();

    if (sessionError || !session) {
      console.error('[customer-portal-data] Session not found');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!session.is_verified || new Date(session.session_expires_at) < new Date()) {
      console.error('[customer-portal-data] Session expired or not verified');
      return new Response(
        JSON.stringify({ success: false, error: 'Session expired. Please login again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { customer_id, client_id } = session;
    console.log('[customer-portal-data] Fetching data for customer:', customer_id);

    // Parse request to determine what data to fetch
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'dashboard';
    const loanId = url.searchParams.get('loanId');

    // Fetch customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, customer_code, full_name, phone, email, address, city, state, pincode, photo_url')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      console.error('[customer-portal-data] Customer not found:', customerError);
      return new Response(
        JSON.stringify({ success: false, error: 'Customer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch client info
    const { data: clientInfo } = await supabase
      .from('clients')
      .select('company_name, logo_url, phone, email')
      .eq('id', client_id)
      .single();

    if (action === 'dashboard' || action === 'loans') {
      // Fetch all loans for this customer
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select(`
          id, loan_number, loan_date, principal_amount, shown_principal, actual_principal,
          advance_interest_shown, advance_interest_actual, differential_capitalized,
          tenure_days, maturity_date, next_interest_due_date, last_interest_paid_date,
          total_interest_paid, status, net_disbursed, interest_rate,
          schemes:scheme_id(id, scheme_name, shown_rate, effective_rate, penalty_rate, grace_period_days),
          branches:branch_id(branch_name, address, phone)
        `)
        .eq('customer_id', customer_id)
        .eq('client_id', client_id)
        .order('loan_date', { ascending: false });

      if (loansError) {
        console.error('[customer-portal-data] Error fetching loans:', loansError);
      }

      // Calculate current interest for active loans
      const loansWithInterest = (loans || []).map((loan: any) => {
        if (loan.status !== 'active') {
          return { ...loan, currentInterest: null };
        }

        const scheme = loan.schemes;
        const lastPaymentDate = loan.last_interest_paid_date || loan.loan_date;
        const days = getDaysBetween(lastPaymentDate, new Date());
        
        const interestCalc = calculateDualRateInterest(
          loan.actual_principal || loan.principal_amount,
          scheme?.shown_rate || 18,
          scheme?.effective_rate || 24,
          days,
          scheme?.penalty_rate || 2,
          scheme?.grace_period_days || 7
        );

        return {
          ...loan,
          currentInterest: interestCalc,
          daysSinceLastPayment: days,
          isOverdue: loan.next_interest_due_date && new Date(loan.next_interest_due_date) < new Date(),
        };
      });

      // Fetch recent payments
      const { data: recentPayments } = await supabase
        .from('interest_payments')
        .select('id, payment_date, amount_paid, shown_interest, receipt_number, loan_id')
        .eq('client_id', client_id)
        .in('loan_id', (loans || []).map((l: any) => l.id))
        .order('payment_date', { ascending: false })
        .limit(10);

      // Fetch redemptions
      const { data: redemptions } = await supabase
        .from('redemptions')
        .select('id, redemption_date, total_settlement, amount_received, redemption_number, loan_id')
        .eq('client_id', client_id)
        .in('loan_id', (loans || []).map((l: any) => l.id))
        .order('redemption_date', { ascending: false });

      // Summary calculations
      const activeLoans = loansWithInterest.filter((l: any) => l.status === 'active');
      const totalPrincipal = activeLoans.reduce((sum: number, l: any) => sum + (l.principal_amount || 0), 0);
      const totalInterestDue = activeLoans.reduce((sum: number, l: any) => sum + (l.currentInterest?.totalDue || 0), 0);
      const overdueLoans = activeLoans.filter((l: any) => l.isOverdue);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            customer,
            client: clientInfo,
            summary: {
              totalActiveLoans: activeLoans.length,
              totalPrincipal,
              totalInterestDue,
              overdueLoansCount: overdueLoans.length,
              totalLoans: loans?.length || 0,
            },
            loans: loansWithInterest,
            recentPayments: recentPayments || [],
            redemptions: redemptions || [],
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'loan-details' && loanId) {
      // Fetch specific loan with full details
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select(`
          *,
          schemes:scheme_id(*),
          branches:branch_id(branch_name, address, phone, email)
        `)
        .eq('id', loanId)
        .eq('customer_id', customer_id)
        .single();

      if (loanError || !loan) {
        console.error('[customer-portal-data] Loan not found:', loanError);
        return new Response(
          JSON.stringify({ success: false, error: 'Loan not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch gold items for this loan
      const { data: goldItems } = await supabase
        .from('gold_items')
        .select('*')
        .eq('loan_id', loanId);

      // Fetch all payments for this loan
      const { data: payments } = await supabase
        .from('interest_payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('payment_date', { ascending: false });

      // Fetch redemption if closed
      const { data: redemption } = await supabase
        .from('redemptions')
        .select('*')
        .eq('loan_id', loanId)
        .single();

      // Calculate current interest if active
      let currentInterest = null;
      if (loan.status === 'active') {
        const scheme = loan.schemes;
        const lastPaymentDate = loan.last_interest_paid_date || loan.loan_date;
        const days = getDaysBetween(lastPaymentDate, new Date());
        
        currentInterest = calculateDualRateInterest(
          loan.actual_principal || loan.principal_amount,
          scheme?.shown_rate || 18,
          scheme?.effective_rate || 24,
          days,
          scheme?.penalty_rate || 2,
          scheme?.grace_period_days || 7
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            customer,
            client: clientInfo,
            loan: {
              ...loan,
              currentInterest,
              daysSinceLastPayment: loan.status === 'active' 
                ? getDaysBetween(loan.last_interest_paid_date || loan.loan_date, new Date())
                : null,
              isOverdue: loan.next_interest_due_date && new Date(loan.next_interest_due_date) < new Date(),
            },
            goldItems: goldItems || [],
            payments: payments || [],
            redemption,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[customer-portal-data] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
