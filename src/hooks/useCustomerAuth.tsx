import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CustomerSession {
  sessionToken: string;
  customerId: string;
  customerName: string;
  expiresAt: string;
}

interface CustomerAuthContextType {
  session: CustomerSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requestOtp: (phone: string, clientCode: string) => Promise<{ success: boolean; message?: string; error?: string; devOtp?: string }>;
  verifyOtp: (phone: string, otp: string, clientCode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

const STORAGE_KEY = 'customer_portal_session';

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CustomerSession;
        // Check if session is still valid
        if (new Date(parsed.expiresAt) > new Date()) {
          setSession(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const requestOtp = useCallback(async (phone: string, clientCode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-request-otp', {
        body: { phone, clientCode },
      });

      if (error) {
        console.error('OTP request error:', error);
        return { success: false, error: error.message || 'Failed to send OTP' };
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Failed to send OTP' };
      }

      return { 
        success: true, 
        message: data.message, 
        devOtp: data.devOtp // Only available in dev mode
      };
    } catch (e: any) {
      console.error('OTP request exception:', e);
      return { success: false, error: e.message || 'Network error' };
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string, clientCode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-verify-otp', {
        body: { phone, otp, clientCode },
      });

      if (error) {
        console.error('OTP verify error:', error);
        return { success: false, error: error.message || 'Failed to verify OTP' };
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Invalid OTP' };
      }

      // Store session
      const newSession: CustomerSession = {
        sessionToken: data.sessionToken,
        customerId: data.customer.id,
        customerName: data.customer.name,
        expiresAt: data.expiresAt,
      };

      setSession(newSession);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));

      return { success: true };
    } catch (e: any) {
      console.error('OTP verify exception:', e);
      return { success: false, error: e.message || 'Network error' };
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        session,
        isLoading,
        isAuthenticated: !!session,
        requestOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
