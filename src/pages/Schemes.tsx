import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Edit, Trash2, Percent, Calendar, IndianRupee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Scheme {
  id: string;
  scheme_code: string;
  scheme_name: string;
  description: string | null;
  interest_rate: number;
  shown_rate: number;
  effective_rate: number;
  min_amount: number;
  max_amount: number;
  min_tenure_days: number;
  max_tenure_days: number;
  minimum_days: number;
  advance_interest_months: number;
  rate_per_gram: number | null;
  rate_18kt: number | null;
  rate_22kt: number | null;
  ltv_percentage: number;
  processing_fee_percentage: number | null;
  document_charges: number | null;
  penalty_rate: number | null;
  grace_period_days: number | null;
  is_active: boolean;
  created_at: string;
}

export default function Schemes() {
  const { client, isPlatformAdmin, hasRole } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<Scheme | null>(null);
  const [schemeToDelete, setSchemeToDelete] = useState<Scheme | null>(null);

  // Form state
  const [schemeCode, setSchemeCode] = useState('');
  const [schemeName, setSchemeName] = useState('');
  const [description, setDescription] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [shownRate, setShownRate] = useState('18');
  const [effectiveRate, setEffectiveRate] = useState('24');
  const [minimumDays, setMinimumDays] = useState('30');
  const [advanceInterestMonths, setAdvanceInterestMonths] = useState('3');
  const [ratePerGram, setRatePerGram] = useState('');
  const [rate18kt, setRate18kt] = useState('');
  const [rate22kt, setRate22kt] = useState('');
  const [minAmount, setMinAmount] = useState('1000');
  const [maxAmount, setMaxAmount] = useState('10000000');
  const [minTenureDays, setMinTenureDays] = useState('30');
  const [maxTenureDays, setMaxTenureDays] = useState('365');
  const [ltvPercentage, setLtvPercentage] = useState('75');
  const [processingFeePercentage, setProcessingFeePercentage] = useState('0');
  const [documentChargesPercentage, setDocumentChargesPercentage] = useState('0');
  const [penaltyRate, setPenaltyRate] = useState('2');
  const [gracePeriodDays, setGracePeriodDays] = useState('7');
  const [submitting, setSubmitting] = useState(false);

  const canManageSchemes = isPlatformAdmin() || hasRole('tenant_admin');

  useEffect(() => {
    fetchSchemes();
  }, [client]);

  const fetchSchemes = async () => {
    if (!client) return;

    try {
      const { data, error } = await supabase
        .from('schemes')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSchemes(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch schemes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSchemeCode('');
    setSchemeName('');
    setDescription('');
    setInterestRate('');
    setShownRate('18');
    setEffectiveRate('24');
    setMinimumDays('30');
    setAdvanceInterestMonths('3');
    setRatePerGram('');
    setRate18kt('');
    setRate22kt('');
    setMinAmount('1000');
    setMaxAmount('10000000');
    setMinTenureDays('30');
    setMaxTenureDays('365');
    setLtvPercentage('75');
    setProcessingFeePercentage('0');
    setDocumentChargesPercentage('0');
    setPenaltyRate('2');
    setGracePeriodDays('7');
    setEditingScheme(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (scheme: Scheme) => {
    setEditingScheme(scheme);
    setSchemeCode(scheme.scheme_code);
    setSchemeName(scheme.scheme_name);
    setDescription(scheme.description || '');
    setInterestRate(scheme.interest_rate.toString());
    setShownRate(scheme.shown_rate?.toString() || '18');
    setEffectiveRate(scheme.effective_rate?.toString() || '24');
    setMinimumDays(scheme.minimum_days?.toString() || '30');
    setAdvanceInterestMonths(scheme.advance_interest_months?.toString() || '3');
    setRatePerGram(scheme.rate_per_gram?.toString() || '');
    setRate18kt(scheme.rate_18kt?.toString() || '');
    setRate22kt(scheme.rate_22kt?.toString() || '');
    setMinAmount(scheme.min_amount.toString());
    setMaxAmount(scheme.max_amount.toString());
    setMinTenureDays(scheme.min_tenure_days.toString());
    setMaxTenureDays(scheme.max_tenure_days.toString());
    setLtvPercentage(scheme.ltv_percentage.toString());
    setProcessingFeePercentage(scheme.processing_fee_percentage?.toString() || '0');
    setDocumentChargesPercentage(scheme.document_charges?.toString() || '0');
    setPenaltyRate(scheme.penalty_rate?.toString() || '2');
    setGracePeriodDays(scheme.grace_period_days?.toString() || '7');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setSubmitting(true);
    try {
      const schemeData = {
        client_id: client.id,
        scheme_code: schemeCode.trim().toUpperCase(),
        scheme_name: schemeName.trim(),
        description: description.trim() || null,
        interest_rate: parseFloat(interestRate),
        shown_rate: parseFloat(shownRate) || 18,
        effective_rate: parseFloat(effectiveRate) || 24,
        minimum_days: parseInt(minimumDays) || 30,
        advance_interest_months: parseInt(advanceInterestMonths) || 3,
        rate_per_gram: parseFloat(ratePerGram) || null,
        rate_18kt: parseFloat(rate18kt) || null,
        rate_22kt: parseFloat(rate22kt) || null,
        min_amount: parseFloat(minAmount),
        max_amount: parseFloat(maxAmount),
        min_tenure_days: parseInt(minTenureDays),
        max_tenure_days: parseInt(maxTenureDays),
        ltv_percentage: parseFloat(ltvPercentage),
        processing_fee_percentage: parseFloat(processingFeePercentage) || null,
        document_charges: parseFloat(documentChargesPercentage) || null,
        penalty_rate: parseFloat(penaltyRate) || null,
        grace_period_days: parseInt(gracePeriodDays) || null,
      };

      if (editingScheme) {
        const { error } = await supabase
          .from('schemes')
          .update(schemeData)
          .eq('id', editingScheme.id);
        if (error) throw error;
        toast.success('Scheme updated successfully');
      } else {
        const { error } = await supabase
          .from('schemes')
          .insert(schemeData);
        if (error) throw error;
        toast.success('Scheme created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchSchemes();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Scheme code already exists. Please use a different code.');
      } else {
        toast.error(error.message || 'Operation failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (scheme: Scheme) => {
    try {
      const { error } = await supabase
        .from('schemes')
        .update({ is_active: !scheme.is_active })
        .eq('id', scheme.id);

      if (error) throw error;
      toast.success(`Scheme ${scheme.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchSchemes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update scheme status');
    }
  };

  const handleDeleteScheme = async () => {
    if (!schemeToDelete) return;

    try {
      const { error } = await supabase
        .from('schemes')
        .delete()
        .eq('id', schemeToDelete.id);

      if (error) throw error;
      toast.success('Scheme deleted successfully');
      setDeleteDialogOpen(false);
      setSchemeToDelete(null);
      fetchSchemes();
    } catch (error: any) {
      if (error.code === '23503') {
        toast.error('Cannot delete scheme. It is being used by existing loans.');
      } else {
        toast.error(error.message || 'Failed to delete scheme');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Loan Schemes</h1>
            <p className="text-muted-foreground">Configure loan products and interest rates</p>
          </div>
          {canManageSchemes && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Scheme
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingScheme ? 'Edit Scheme' : 'Add New Scheme'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schemeCode">Scheme Code *</Label>
                      <Input
                        id="schemeCode"
                        value={schemeCode}
                        onChange={(e) => setSchemeCode(e.target.value.toUpperCase())}
                        placeholder="e.g., GOLD01"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="schemeName">Scheme Name *</Label>
                      <Input
                        id="schemeName"
                        value={schemeName}
                        onChange={(e) => setSchemeName(e.target.value)}
                        placeholder="e.g., Standard Gold Loan"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter scheme description"
                      rows={2}
                    />
                  </div>

                  {/* Dual Rate Configuration */}
                  <div className="p-4 border rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Dual Rate Configuration (NBFC Logic)
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shownRate">Shown Rate (% p.a.) *</Label>
                        <Input
                          id="shownRate"
                          type="number"
                          step="0.01"
                          value={shownRate}
                          onChange={(e) => setShownRate(e.target.value)}
                          placeholder="18"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Customer sees this rate</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="effectiveRate">Effective Rate (% p.a.) *</Label>
                        <Input
                          id="effectiveRate"
                          type="number"
                          step="0.01"
                          value={effectiveRate}
                          onChange={(e) => setEffectiveRate(e.target.value)}
                          placeholder="24"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Actual internal rate</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Differential Rate</Label>
                        <div className="h-10 flex items-center px-3 bg-muted rounded-md font-semibold text-amber-600 dark:text-amber-400">
                          {((parseFloat(effectiveRate) || 0) - (parseFloat(shownRate) || 0)).toFixed(2)}% p.a.
                        </div>
                        <p className="text-xs text-muted-foreground">Capitalized silently</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="minimumDays">Minimum Days (for rebate) *</Label>
                        <Input
                          id="minimumDays"
                          type="number"
                          value={minimumDays}
                          onChange={(e) => setMinimumDays(e.target.value)}
                          placeholder="30"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="advanceInterestMonths">Advance Interest (months) *</Label>
                        <Input
                          id="advanceInterestMonths"
                          type="number"
                          value={advanceInterestMonths}
                          onChange={(e) => setAdvanceInterestMonths(e.target.value)}
                          placeholder="3"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="rate22kt" className="text-amber-700 dark:text-amber-400 font-semibold">22KT Rate (₹/gram) *</Label>
                        <Input
                          id="rate22kt"
                          type="number"
                          value={rate22kt}
                          onChange={(e) => setRate22kt(e.target.value)}
                          placeholder="e.g., 5800"
                          className="border-amber-500/50"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Most common jewelry purity</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rate18kt" className="text-amber-700 dark:text-amber-400 font-semibold">18KT Rate (₹/gram) *</Label>
                        <Input
                          id="rate18kt"
                          type="number"
                          value={rate18kt}
                          onChange={(e) => setRate18kt(e.target.value)}
                          placeholder="e.g., 4800"
                          className="border-amber-500/50"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Lower purity items</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interestRate">Interest Rate (% per month) *</Label>
                      <Input
                        id="interestRate"
                        type="number"
                        step="0.01"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        placeholder="e.g., 1.5"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ltvPercentage">LTV Percentage *</Label>
                      <Input
                        id="ltvPercentage"
                        type="number"
                        step="0.01"
                        value={ltvPercentage}
                        onChange={(e) => setLtvPercentage(e.target.value)}
                        placeholder="e.g., 75"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="processingFeePercentage">Processing Fee (%)</Label>
                      <Input
                        id="processingFeePercentage"
                        type="number"
                        step="0.01"
                        value={processingFeePercentage}
                        onChange={(e) => setProcessingFeePercentage(e.target.value)}
                        placeholder="e.g., 0.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="documentChargesPercentage">Document Charges (%)</Label>
                      <Input
                        id="documentChargesPercentage"
                        type="number"
                        step="0.01"
                        value={documentChargesPercentage}
                        onChange={(e) => setDocumentChargesPercentage(e.target.value)}
                        placeholder="e.g., 0.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minAmount">Minimum Amount (₹) *</Label>
                      <Input
                        id="minAmount"
                        type="number"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxAmount">Maximum Amount (₹) *</Label>
                      <Input
                        id="maxAmount"
                        type="number"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minTenureDays">Min Tenure (days) *</Label>
                      <Input
                        id="minTenureDays"
                        type="number"
                        value={minTenureDays}
                        onChange={(e) => setMinTenureDays(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxTenureDays">Max Tenure (days) *</Label>
                      <Input
                        id="maxTenureDays"
                        type="number"
                        value={maxTenureDays}
                        onChange={(e) => setMaxTenureDays(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="penaltyRate">Penalty Rate (% per month)</Label>
                      <Input
                        id="penaltyRate"
                        type="number"
                        step="0.01"
                        value={penaltyRate}
                        onChange={(e) => setPenaltyRate(e.target.value)}
                        placeholder="e.g., 2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gracePeriodDays">Grace Period (days)</Label>
                      <Input
                        id="gracePeriodDays"
                        type="number"
                        value={gracePeriodDays}
                        onChange={(e) => setGracePeriodDays(e.target.value)}
                        placeholder="e.g., 7"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Saving...' : editingScheme ? 'Update Scheme' : 'Create Scheme'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Scheme List */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </CardContent>
          </Card>
        ) : schemes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Settings className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Schemes Yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Create loan schemes to define interest rates, tenure limits, and LTV ratios for your gold loans.
              </p>
              {canManageSchemes && (
                <Button onClick={openAddDialog} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Scheme
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {schemes.map((scheme) => (
              <Card key={scheme.id} className={`relative ${!scheme.is_active ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant={scheme.is_active ? 'default' : 'secondary'} className="mb-2">
                        {scheme.scheme_code}
                      </Badge>
                      <CardTitle className="text-lg">{scheme.scheme_name}</CardTitle>
                    </div>
                    {canManageSchemes && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(scheme)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSchemeToDelete(scheme);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {scheme.description && (
                    <p className="text-sm text-muted-foreground">{scheme.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-amber-600" />
                      <div>
                        <p className="text-muted-foreground">Interest</p>
                        <p className="font-semibold">{scheme.interest_rate}% / month</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-muted-foreground">LTV</p>
                        <p className="font-semibold">{scheme.ltv_percentage}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-muted-foreground">Amount Range</p>
                        <p className="font-semibold">{formatCurrency(scheme.min_amount)} - {formatCurrency(scheme.max_amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-muted-foreground">Tenure</p>
                        <p className="font-semibold">{scheme.min_tenure_days} - {scheme.max_tenure_days} days</p>
                      </div>
                    </div>
                  </div>
                  {canManageSchemes && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleToggleStatus(scheme)}
                    >
                      {scheme.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Scheme</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{schemeToDelete?.scheme_name}"? This action cannot be undone.
                Note: Schemes with existing loans cannot be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteScheme} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
