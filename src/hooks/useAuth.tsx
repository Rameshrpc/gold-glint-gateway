import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'super_admin' | 'moderator' | 'tenant_admin' | 'branch_manager' | 'loan_officer' | 'appraiser' | 'collection_agent' | 'auditor';

interface Profile {
  id: string;
  user_id: string;
  client_id: string;
  branch_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

interface Client {
  id: string;
  client_code: string;
  company_name: string;
}

interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_type: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  client: Client | null;
  branches: Branch[];
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch | null) => void;
  loading: boolean;
  signIn: (email: string, password: string, clientCode: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, clientCode: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isPlatformAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setClient(null);
    setBranches([]);
    setCurrentBranch(null);
  };

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      if (profileData) {
        setProfile(profileData as Profile);

        // Fetch client
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, client_code, company_name')
          .eq('id', profileData.client_id)
          .maybeSingle();

        if (clientData) {
          setClient(clientData as Client);
        }

        // Fetch branches
        const { data: branchesData } = await supabase
          .from('branches')
          .select('id, branch_code, branch_name, branch_type, is_active')
          .eq('client_id', profileData.client_id)
          .eq('is_active', true);

        if (branchesData) {
          setBranches(branchesData as Branch[]);
          // Set current branch to user's assigned branch or first branch
          if (profileData.branch_id) {
            const userBranch = branchesData.find(b => b.id === profileData.branch_id);
            setCurrentBranch(userBranch as Branch || null);
          } else if (branchesData.length > 0) {
            setCurrentBranch(branchesData[0] as Branch);
          }
        }
      }

      // Fetch roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesData) {
        setRoles(rolesData.map(r => r.role as AppRole));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          clearAuthState();
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, clientCode: string) => {
    try {
      // First verify client code exists
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, client_code')
        .eq('client_code', clientCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (clientError) {
        console.error('Client lookup error:', clientError);
        return { error: new Error('Unable to verify client code. Please try again.') };
      }

      if (!clientData) {
        return { error: new Error('Invalid client code. Please check and try again.') };
      }

      // Attempt sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Provide user-friendly error messages
        if (authError.message.includes('Invalid login credentials')) {
          return { error: new Error('Invalid email or password. Please check your credentials.') };
        }
        if (authError.message.includes('Email not confirmed')) {
          return { error: new Error('Please confirm your email address before signing in.') };
        }
        return { error: authError };
      }

      if (!authData.user) {
        return { error: new Error('Sign in failed. Please try again.') };
      }

      // Verify user belongs to the provided client code
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile verification error:', profileError);
        await supabase.auth.signOut({ scope: 'local' });
        return { error: new Error('Unable to verify your account. Please contact support.') };
      }

      if (!profileData) {
        await supabase.auth.signOut({ scope: 'local' });
        return { error: new Error('Your profile was not found. Please contact support.') };
      }

      // Verify the profile's client_id matches the provided client code
      if (profileData.client_id !== clientData.id) {
        await supabase.auth.signOut({ scope: 'local' });
        return { error: new Error('Your account does not belong to this organization. Please check the client code.') };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: new Error('An unexpected error occurred. Please try again.') };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, clientCode: string) => {
    try {
      // First verify client code exists
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('client_code', clientCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (clientError) {
        console.error('Client lookup error:', clientError);
        return { error: new Error('Unable to verify client code. Please try again.') };
      }

      if (!clientData) {
        return { error: new Error('Invalid client code. Please contact your administrator.') };
      }

      const redirectUrl = `${window.location.origin}/`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) {
        // Handle specific auth errors
        if (authError.message.includes('already registered')) {
          return { error: new Error('This email is already registered. Please login instead.') };
        }
        if (authError.message.includes('Password should be at least')) {
          return { error: new Error('Password must be at least 6 characters long.') };
        }
        if (authError.message.includes('valid email')) {
          return { error: new Error('Please enter a valid email address.') };
        }
        return { error: authError };
      }

      if (!authData.user) {
        return { error: new Error('Account creation failed. Please try again.') };
      }

      // Check if email confirmation is pending
      if (authData.user.identities && authData.user.identities.length === 0) {
        return { error: new Error('This email is already registered. Please login instead.') };
      }

      // Create profile for the new user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          client_id: clientData.id,
          full_name: fullName,
          email: email,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't delete the auth user - they can try to complete setup later
        return { error: new Error('Account created but profile setup failed. Please contact support.') };
      }

      // Assign default role (loan_officer)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'loan_officer',
        });

      if (roleError) {
        console.error('Role assignment error:', roleError);
        // Profile was created, but role assignment failed
        // The user can still login, admin will need to assign role manually
        return { error: new Error('Account created but role assignment failed. Please contact your administrator.') };
      }

      // Check if email confirmation is required
      if (!authData.user.email_confirmed_at) {
        // User was created but needs email confirmation
        // Note: If auto-confirm is enabled, this won't trigger
        console.log('Email confirmation may be required');
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: new Error('An unexpected error occurred. Please try again.') };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Always clear local state regardless of API result
      clearAuthState();
    }
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  const isPlatformAdmin = () => hasRole('super_admin') || hasRole('moderator');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        client,
        branches,
        currentBranch,
        setCurrentBranch,
        loading,
        signIn,
        signUp,
        signOut,
        hasRole,
        isPlatformAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
