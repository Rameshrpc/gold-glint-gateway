import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Phone, Lock, Building2, Check } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileGradientHeader from './MobileGradientHeader';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MobileProfile() {
  const navigate = useNavigate();
  const { profile, client } = useAuth();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone: phone || null })
        .eq('id', profile?.id);

      if (error) throw error;
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password changed');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <MobileLayout hideNav>
      <MobileGradientHeader 
        title="Profile" 
        variant="minimal"
        showBack
        onBackClick={() => navigate(-1)}
      />

      <div className="px-4 py-4 space-y-6 animate-fade-in">
        {/* Avatar Section */}
        <div className="flex flex-col items-center py-6">
          <div className="w-24 h-24 rounded-full gradient-gold flex items-center justify-center text-white text-3xl font-bold mb-3">
            {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
          </div>
          <h2 className="text-xl font-bold">{profile?.full_name}</h2>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
          {client && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3" />
              {client.company_name}
            </div>
          )}
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Personal Information
          </h3>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <button
            onClick={handleUpdateProfile}
            disabled={isUpdating}
            className="w-full py-3.5 rounded-xl gradient-gold text-white font-semibold tap-scale disabled:opacity-50"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Change Password */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Lock className="w-3 h-3" /> Change Password
          </h3>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={isChangingPassword || !newPassword}
            className="w-full py-3.5 rounded-xl bg-card border border-border font-semibold tap-scale disabled:opacity-50"
          >
            {isChangingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </div>

        <div className="h-20" />
      </div>
    </MobileLayout>
  );
}
