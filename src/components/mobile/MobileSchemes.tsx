import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Percent, Calendar, IndianRupee, Package, Plus, Pencil, Trash2, Save } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import LoadingButton from './LoadingButton';
import { MobileBottomSheet, MobileFormField, MobileSelectField, MobileDataCard } from './shared';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { vibrateLight, vibrateSuccess } from '@/lib/haptics';

interface Scheme {
  id: string;
  scheme_code: string;
  scheme_name: string;
  interest_rate: number;
  shown_rate: number;
  effective_rate: number;
  ltv_percentage: number;
  min_tenure_days: number;
  max_tenure_days: number;
  advance_interest_months: number;
  rate_22kt: number | null;
  rate_18kt: number | null;
  processing_fee_percentage: number | null;
  document_charges: number | null;
  is_active: boolean;
}

export default function MobileSchemes() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    scheme_code: '',
    scheme_name: '',
    interest_rate: '',
    shown_rate: '',
    effective_rate: '',
    ltv_percentage: '75',
    min_tenure_days: '30',
    max_tenure_days: '365',
    advance_interest_months: '3',
    rate_22kt: '',
    rate_18kt: '',
    processing_fee_percentage: '',
    document_charges: '',
    is_active: true,
  });

  const fetchSchemes = useCallback(async () => {
    if (!profile?.client_id) return;

    try {
      const { data, error } = await supabase
        .from('schemes')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('scheme_name');

      if (error) throw error;
      setSchemes(data || []);
    } catch (error) {
      console.error('Error fetching schemes:', error);
      toast.error('Failed to load schemes');
    } finally {
      setIsLoading(false);
    }
  }, [profile?.client_id]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await fetchSchemes();
  }, [fetchSchemes]);

  const resetForm = () => {
    setEditingScheme(null);
    setFormData({
      scheme_code: '',
      scheme_name: '',
      interest_rate: '',
      shown_rate: '',
      effective_rate: '',
      ltv_percentage: '75',
      min_tenure_days: '30',
      max_tenure_days: '365',
      advance_interest_months: '3',
      rate_22kt: '',
      rate_18kt: '',
      processing_fee_percentage: '',
      document_charges: '',
      is_active: true,
    });
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
    vibrateLight();
  };

  const openEditForm = (scheme: Scheme) => {
    setEditingScheme(scheme);
    setFormData({
      scheme_code: scheme.scheme_code,
      scheme_name: scheme.scheme_name,
      interest_rate: scheme.interest_rate.toString(),
      shown_rate: scheme.shown_rate.toString(),
      effective_rate: scheme.effective_rate.toString(),
      ltv_percentage: scheme.ltv_percentage.toString(),
      min_tenure_days: scheme.min_tenure_days.toString(),
      max_tenure_days: scheme.max_tenure_days.toString(),
      advance_interest_months: scheme.advance_interest_months.toString(),
      rate_22kt: scheme.rate_22kt?.toString() || '',
      rate_18kt: scheme.rate_18kt?.toString() || '',
      processing_fee_percentage: scheme.processing_fee_percentage?.toString() || '',
      document_charges: scheme.document_charges?.toString() || '',
      is_active: scheme.is_active,
    });
    setShowForm(true);
    vibrateLight();
  };

  const handleSave = async () => {
    if (!profile?.client_id || !formData.scheme_code || !formData.scheme_name) {
      toast.error('Please fill required fields');
      return;
    }

    setIsSaving(true);
    try {
      const schemeData = {
        client_id: profile.client_id,
        scheme_code: formData.scheme_code.toUpperCase(),
        scheme_name: formData.scheme_name,
        interest_rate: parseFloat(formData.interest_rate) || 0,
        shown_rate: parseFloat(formData.shown_rate) || 0,
        effective_rate: parseFloat(formData.effective_rate) || 0,
        ltv_percentage: parseFloat(formData.ltv_percentage) || 75,
        min_tenure_days: parseInt(formData.min_tenure_days) || 30,
        max_tenure_days: parseInt(formData.max_tenure_days) || 365,
        advance_interest_months: parseInt(formData.advance_interest_months) || 3,
        rate_22kt: formData.rate_22kt ? parseFloat(formData.rate_22kt) : null,
        rate_18kt: formData.rate_18kt ? parseFloat(formData.rate_18kt) : null,
        processing_fee_percentage: formData.processing_fee_percentage ? parseFloat(formData.processing_fee_percentage) : null,
        document_charges: formData.document_charges ? parseFloat(formData.document_charges) : null,
        is_active: formData.is_active,
      };

      if (editingScheme) {
        const { error } = await supabase
          .from('schemes')
          .update(schemeData)
          .eq('id', editingScheme.id);

        if (error) throw error;
        vibrateSuccess();
        toast.success('Scheme updated');
      } else {
        const { error } = await supabase
          .from('schemes')
          .insert([schemeData]);

        if (error) throw error;
        vibrateSuccess();
        toast.success('Scheme created');
      }

      setShowForm(false);
      resetForm();
      fetchSchemes();
    } catch (error: any) {
      console.error('Error saving scheme:', error);
      toast.error(error.message || 'Failed to save scheme');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('schemes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      vibrateSuccess();
      toast.success('Scheme deleted');
      fetchSchemes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  return (
    <MobileLayout hideNav={showForm}>
      <MobileSimpleHeader 
        title="Loan Schemes" 
        showBack
        showAdd
        onAddClick={openAddForm}
      />

      <PullToRefreshContainer onRefresh={handleRefresh} className="px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold">{schemes.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold">{schemes.filter(s => s.is_active).length}</p>
          </div>
        </div>

        {/* Schemes List */}
        <div className="space-y-3">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
            ))
          ) : schemes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No schemes configured</p>
              <button 
                onClick={openAddForm}
                className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Add Scheme
              </button>
            </div>
          ) : (
            schemes.map((scheme) => (
              <div
                key={scheme.id}
                className="p-4 rounded-xl bg-card border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {scheme.scheme_code}
                      </span>
                      <Badge variant={scheme.is_active ? 'default' : 'secondary'} className="text-xs">
                        {scheme.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold">{scheme.scheme_name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(scheme)}
                      className="p-2 rounded-lg hover:bg-muted"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(scheme.id)}
                      className="p-2 rounded-lg hover:bg-muted"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Percent className="w-3 h-3" />
                      <span className="text-[10px]">Rate</span>
                    </div>
                    <p className="text-sm font-semibold">{scheme.shown_rate}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Percent className="w-3 h-3" />
                      <span className="text-[10px]">LTV</span>
                    </div>
                    <p className="text-sm font-semibold">{scheme.ltv_percentage}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[10px]">Tenure</span>
                    </div>
                    <p className="text-sm font-semibold">{scheme.max_tenure_days}d</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <span>22kt: ₹{scheme.rate_22kt || 0}/g</span>
                  <span>Advance: {scheme.advance_interest_months}mo</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="h-20" />
      </PullToRefreshContainer>

      {/* Add/Edit Form Sheet */}
      <MobileBottomSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingScheme ? 'Edit Scheme' : 'New Scheme'}
        snapPoints={['full']}
        footer={
          <LoadingButton
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Saving..."
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            <Save className="w-5 h-5 mr-2" />
            {editingScheme ? 'Update Scheme' : 'Create Scheme'}
          </LoadingButton>
        }
      >
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <MobileFormField
              label="Scheme Code *"
              placeholder="STD"
              value={formData.scheme_code}
              onChange={(e) => setFormData({ ...formData, scheme_code: e.target.value.toUpperCase() })}
            />
            <MobileFormField
              label="Scheme Name *"
              placeholder="Standard"
              value={formData.scheme_name}
              onChange={(e) => setFormData({ ...formData, scheme_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MobileFormField
              label="Interest %"
              type="number"
              placeholder="24"
              value={formData.interest_rate}
              onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
            />
            <MobileFormField
              label="Shown %"
              type="number"
              placeholder="18"
              value={formData.shown_rate}
              onChange={(e) => setFormData({ ...formData, shown_rate: e.target.value })}
            />
            <MobileFormField
              label="Effective %"
              type="number"
              placeholder="24"
              value={formData.effective_rate}
              onChange={(e) => setFormData({ ...formData, effective_rate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MobileFormField
              label="LTV %"
              type="number"
              placeholder="75"
              value={formData.ltv_percentage}
              onChange={(e) => setFormData({ ...formData, ltv_percentage: e.target.value })}
            />
            <MobileFormField
              label="Advance Months"
              type="number"
              placeholder="3"
              value={formData.advance_interest_months}
              onChange={(e) => setFormData({ ...formData, advance_interest_months: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MobileFormField
              label="Min Tenure (days)"
              type="number"
              placeholder="30"
              value={formData.min_tenure_days}
              onChange={(e) => setFormData({ ...formData, min_tenure_days: e.target.value })}
            />
            <MobileFormField
              label="Max Tenure (days)"
              type="number"
              placeholder="365"
              value={formData.max_tenure_days}
              onChange={(e) => setFormData({ ...formData, max_tenure_days: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MobileFormField
              label="22kt Rate (₹/g)"
              type="number"
              placeholder="5000"
              value={formData.rate_22kt}
              onChange={(e) => setFormData({ ...formData, rate_22kt: e.target.value })}
            />
            <MobileFormField
              label="18kt Rate (₹/g)"
              type="number"
              placeholder="4000"
              value={formData.rate_18kt}
              onChange={(e) => setFormData({ ...formData, rate_18kt: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MobileFormField
              label="Processing %"
              type="number"
              placeholder="0.5"
              value={formData.processing_fee_percentage}
              onChange={(e) => setFormData({ ...formData, processing_fee_percentage: e.target.value })}
            />
            <MobileFormField
              label="Doc Charges (₹)"
              type="number"
              placeholder="100"
              value={formData.document_charges}
              onChange={(e) => setFormData({ ...formData, document_charges: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Active Scheme</Label>
          </div>
        </div>
      </MobileBottomSheet>
    </MobileLayout>
  );
}
