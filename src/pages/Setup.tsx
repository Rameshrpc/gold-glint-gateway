import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Setup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [step, setStep] = useState<'check' | 'signup' | 'client' | 'complete'>('check');
  const [submitting, setSubmitting] = useState(false);

  // Admin signup form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Client form
  const [clientCode, setClientCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');

  useEffect(() => {
    checkPlatformStatus();
  }, []);

  const checkPlatformStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('platform_initialized');
      
      if (error) {
        console.error('Error checking platform status:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setIsInitialized(true);
        toast.info('Platform already initialized. Redirecting to login...');
        setTimeout(() => navigate('/auth'), 2000);
      } else {
        setStep('signup');
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleAdminSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        toast.error(authError.message);
        setSubmitting(false);
        return;
      }

      if (authData.user) {
        // Store user id for next step
        localStorage.setItem('setup_user_id', authData.user.id);
        setStep('client');
      }
    } catch (error) {
      toast.error('Failed to create admin account');
    }
    setSubmitting(false);
  };

  const handleClientSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const userId = localStorage.getItem('setup_user_id');
    if (!userId) {
      toast.error('Session expired. Please start over.');
      setStep('signup');
      setSubmitting(false);
      return;
    }

    try {
      // Create the first client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          client_code: clientCode.toUpperCase(),
          company_name: companyName,
          email: companyEmail || null,
          phone: companyPhone || null,
          is_active: true,
        })
        .select()
        .single();

      if (clientError) {
        toast.error(clientError.message);
        setSubmitting(false);
        return;
      }

      // Create profile for super admin
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          client_id: clientData.id,
          full_name: fullName,
          email: email,
          is_active: true,
        });

      if (profileError) {
        toast.error('Failed to create profile: ' + profileError.message);
        setSubmitting(false);
        return;
      }

      // Assign super_admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'super_admin',
        });

      if (roleError) {
        toast.error('Failed to assign role: ' + roleError.message);
        setSubmitting(false);
        return;
      }

      // Create default main branch
      const { error: branchError } = await supabase
        .from('branches')
        .insert({
          client_id: clientData.id,
          branch_code: 'MAIN',
          branch_name: 'Main Branch',
          branch_type: 'main_branch',
          is_active: true,
        });

      if (branchError) {
        console.error('Branch creation error:', branchError);
      }

      localStorage.removeItem('setup_user_id');
      setStep('complete');
      toast.success('Platform setup complete!');
    } catch (error) {
      toast.error('Setup failed. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p>Platform already initialized. Redirecting...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 rounded-2xl mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Zenith One Setup</h1>
          <p className="text-gray-600 mt-2">Initialize your gold loan management platform</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-3 h-3 rounded-full ${step === 'signup' || step === 'client' || step === 'complete' ? 'bg-amber-600' : 'bg-gray-300'}`} />
          <div className={`w-12 h-1 ${step === 'client' || step === 'complete' ? 'bg-amber-600' : 'bg-gray-300'}`} />
          <div className={`w-3 h-3 rounded-full ${step === 'client' || step === 'complete' ? 'bg-amber-600' : 'bg-gray-300'}`} />
          <div className={`w-12 h-1 ${step === 'complete' ? 'bg-amber-600' : 'bg-gray-300'}`} />
          <div className={`w-3 h-3 rounded-full ${step === 'complete' ? 'bg-amber-600' : 'bg-gray-300'}`} />
        </div>

        {step === 'signup' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600" />
                <CardTitle>Create Super Admin</CardTitle>
              </div>
              <CardDescription>
                Set up the platform administrator account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Continue
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'client' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-600" />
                <CardTitle>Create First Client</CardTitle>
              </div>
              <CardDescription>
                Set up your company/organization details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleClientSetup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientCode">Client Code</Label>
                  <Input
                    id="clientCode"
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value.toUpperCase())}
                    placeholder="e.g., ZENITH01"
                    required
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique code for login identification
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Your Company Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email (Optional)</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="info@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Company Phone (Optional)</Label>
                  <Input
                    id="companyPhone"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Complete Setup
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'complete' && (
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">Setup Complete!</h2>
              <p className="text-gray-600 mb-6">
                Your platform is ready. You can now log in with your super admin account.
              </p>
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}