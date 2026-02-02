import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Calculator, Info, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  calculateSaleAgreement,
  calculateSimpleStrikePrices,
  marginToAnnualRate,
  annualRateToMargin,
  generateTenureOptions,
  formatSaleAgreementCurrency,
  type SaleAgreementScheme,
} from '@/lib/saleAgreementCalculations';

interface SaleScheme {
  id: string;
  scheme_code: string;
  scheme_name: string;
  margin_per_month: number;
  advance_interest_months: number;
  ltv_percentage: number;
  min_amount: number;
  max_amount: number;
  min_tenure_days: number;
  max_tenure_days: number;
  processing_fee_percentage: number | null;
  document_charges: number | null;
  rate_18kt: number | null;
  rate_22kt: number | null;
  strike_periods: unknown;
  is_active: boolean;
  // Legacy fields (for backward compatibility)
  shown_rate?: number;
  effective_rate?: number;
}

export default function SaleSchemes() {
  const { client } = useAuth();
  const [schemes, setSchemes] = useState<SaleScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<SaleScheme | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [schemeToDelete, setSchemeToDelete] = useState<SaleScheme | null>(null);
  
  // Form state - simplified for sale agreements
  const [formData, setFormData] = useState({
    scheme_code: '',
    scheme_name: '',
    margin_per_month: '1500',       // ₹ per month per ₹1 lakh
    advance_interest_months: '1',    // Months collected upfront
    ltv_percentage: '100',
    min_amount: '5000',
    max_amount: '10000000',
    min_tenure_days: '15',
    max_tenure_days: '90',
    processing_fee_percentage: '0',
    document_charges: '0',
    rate_18kt: '',
    rate_22kt: '',
  });

  useEffect(() => {
    if (client) fetchSchemes();
  }, [client]);

  const fetchSchemes = async () => {
    if (!client) return;
    try {
      const { data, error } = await supabase
        .from('schemes')
        .select('*')
        .eq('client_id', client.id)
        .eq('scheme_type', 'sale_agreement')
        .order('scheme_name');
      
      if (error) throw error;
      setSchemes((data || []) as unknown as SaleScheme[]);
    } catch (error: any) {
      toast.error('Failed to fetch schemes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      scheme_code: '',
      scheme_name: '',
      margin_per_month: '1500',
      advance_interest_months: '1',
      ltv_percentage: '100',
      min_amount: '5000',
      max_amount: '10000000',
      min_tenure_days: '15',
      max_tenure_days: '90',
      processing_fee_percentage: '0',
      document_charges: '0',
      rate_18kt: '',
      rate_22kt: '',
    });
    setEditingScheme(null);
  };

  const handleToggleStatus = async (scheme: SaleScheme) => {
    try {
      const { error } = await supabase
        .from('schemes')
        .update({ is_active: !scheme.is_active })
        .eq('id', scheme.id);
      
      if (error) throw error;
      toast.success(`Scheme ${!scheme.is_active ? 'activated' : 'deactivated'}`);
      fetchSchemes();
    } catch (error: any) {
      toast.error('Failed to update scheme status');
    }
  };

  const handleDelete = async () => {
    if (!schemeToDelete) return;
    
    try {
      // First delete any versions
      await supabase
        .from('scheme_versions')
        .delete()
        .eq('scheme_id', schemeToDelete.id);
      
      // Then delete the scheme
      const { error } = await supabase
        .from('schemes')
        .delete()
        .eq('id', schemeToDelete.id);
      
      if (error) throw error;
      toast.success('Scheme deleted successfully');
      setSchemeToDelete(null);
      fetchSchemes();
    } catch (error: any) {
      toast.error('Failed to delete scheme');
    }
  };

  const handleEdit = (scheme: SaleScheme) => {
    setEditingScheme(scheme);
    
    // If scheme has legacy shown_rate but no margin_per_month, convert
    let marginPerMonth = scheme.margin_per_month || 0;
    if (marginPerMonth === 0 && scheme.shown_rate) {
      marginPerMonth = annualRateToMargin(scheme.shown_rate);
    }
    
    setFormData({
      scheme_code: scheme.scheme_code,
      scheme_name: scheme.scheme_name,
      margin_per_month: marginPerMonth.toString(),
      advance_interest_months: scheme.advance_interest_months.toString(),
      ltv_percentage: scheme.ltv_percentage.toString(),
      min_amount: scheme.min_amount.toString(),
      max_amount: scheme.max_amount.toString(),
      min_tenure_days: scheme.min_tenure_days.toString(),
      max_tenure_days: scheme.max_tenure_days.toString(),
      processing_fee_percentage: (scheme.processing_fee_percentage || 0).toString(),
      document_charges: (scheme.document_charges || 0).toString(),
      rate_18kt: (scheme.rate_18kt || '').toString(),
      rate_22kt: (scheme.rate_22kt || '').toString(),
    });
    setIsFormOpen(true);
  };

  // Auto-generate strike periods based on tenure settings
  const generateStrikePeriods = (maxTenure: number, step: number = 15) => {
    const periods: { days: number; label_en: string; label_ta: string }[] = [];
    let currentDay = step;
    let previousDay = 0;
    
    while (currentDay <= maxTenure) {
      const label_en = previousDay === 0 
        ? `0-${currentDay} Days` 
        : `${previousDay + 1}-${currentDay} Days`;
      const label_ta = previousDay === 0 
        ? `0-${currentDay} நாட்கள்` 
        : `${previousDay + 1}-${currentDay} நாட்கள்`;
      
      periods.push({ days: currentDay, label_en, label_ta });
      previousDay = currentDay;
      currentDay += step;
    }
    
    return periods;
  };

  const handleSubmit = async () => {
    if (!client) return;
    
    if (!formData.scheme_code || !formData.scheme_name || !formData.margin_per_month) {
      toast.error('Please fill all required fields');
      return;
    }

    const marginPerMonth = parseFloat(formData.margin_per_month) || 0;
    const maxTenure = parseInt(formData.max_tenure_days) || 90;
    
    // Auto-generate strike periods (15-day intervals)
    const strikePeriods = generateStrikePeriods(maxTenure, 15);
    
    // Convert margin to equivalent annual rate for legacy fields
    const equivalentAnnualRate = marginToAnnualRate(marginPerMonth);

    try {
      const schemeData = {
        client_id: client.id,
        scheme_code: formData.scheme_code,
        scheme_name: formData.scheme_name,
        scheme_type: 'sale_agreement' as const,
        
        // New simplified fields
        margin_per_month: marginPerMonth,
        tenure_step: 15,  // Fixed 15-day intervals
        
        // Legacy fields (for backward compatibility)
        interest_rate: equivalentAnnualRate,
        shown_rate: equivalentAnnualRate,
        effective_rate: equivalentAnnualRate,  // No differential for sale agreements
        minimum_days: parseInt(formData.min_tenure_days),
        
        // Common fields
        advance_interest_months: parseInt(formData.advance_interest_months),
        ltv_percentage: parseFloat(formData.ltv_percentage),
        min_amount: parseFloat(formData.min_amount),
        max_amount: parseFloat(formData.max_amount),
        min_tenure_days: parseInt(formData.min_tenure_days),
        max_tenure_days: maxTenure,
        processing_fee_percentage: parseFloat(formData.processing_fee_percentage) || 0,
        document_charges: parseFloat(formData.document_charges) || 0,
        rate_18kt: formData.rate_18kt ? parseFloat(formData.rate_18kt) : null,
        rate_22kt: formData.rate_22kt ? parseFloat(formData.rate_22kt) : null,
        strike_periods: strikePeriods as unknown as null,
      };

      if (editingScheme) {
        const { error } = await supabase
          .from('schemes')
          .update(schemeData)
          .eq('id', editingScheme.id);
        if (error) throw error;
        toast.success('Scheme updated successfully');
      } else {
        // Create new scheme
        const { data: newScheme, error: schemeError } = await supabase
          .from('schemes')
          .insert(schemeData)
          .select()
          .single();

        if (schemeError) throw schemeError;

        // Create initial version for the scheme
        const { data: newVersion, error: versionError } = await supabase
          .from('scheme_versions')
          .insert({
            scheme_id: newScheme.id,
            client_id: client.id,
            version_number: 1,
            effective_from: new Date().toISOString().split('T')[0],
            change_reason: 'Initial version',
            margin_per_month: marginPerMonth,
            tenure_step: 15,
            interest_rate: schemeData.interest_rate,
            shown_rate: schemeData.shown_rate,
            effective_rate: schemeData.effective_rate,
            minimum_days: schemeData.minimum_days,
            advance_interest_months: schemeData.advance_interest_months,
            rate_18kt: schemeData.rate_18kt,
            rate_22kt: schemeData.rate_22kt,
            min_amount: schemeData.min_amount,
            max_amount: schemeData.max_amount,
            min_tenure_days: schemeData.min_tenure_days,
            max_tenure_days: schemeData.max_tenure_days,
            ltv_percentage: schemeData.ltv_percentage,
            processing_fee_percentage: schemeData.processing_fee_percentage,
            document_charges: schemeData.document_charges,
          })
          .select()
          .single();

        if (versionError) throw versionError;

        // Update scheme with current version id
        await supabase
          .from('schemes')
          .update({ current_version_id: newVersion.id })
          .eq('id', newScheme.id);

        toast.success('Scheme created successfully');
      }

      setIsFormOpen(false);
      resetForm();
      fetchSchemes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Preview calculation
  const previewCalc = useMemo(() => {
    const marginPerMonth = parseFloat(formData.margin_per_month) || 1500;
    const maxTenure = parseInt(formData.max_tenure_days) || 90;
    const advanceMonths = parseInt(formData.advance_interest_months) || 1;
    const processingFee = parseFloat(formData.processing_fee_percentage) || 0;
    const documentCharges = parseFloat(formData.document_charges) || 0;
    
    const scheme: SaleAgreementScheme = {
      id: 'preview',
      scheme_name: 'Preview',
      margin_per_month: marginPerMonth,
      advance_interest_months: advanceMonths,
      min_tenure_days: parseInt(formData.min_tenure_days) || 15,
      max_tenure_days: maxTenure,
      tenure_step: 15,
      processing_fee_percentage: processingFee,
      document_charges: documentCharges,
      rate_22kt: parseFloat(formData.rate_22kt) || 6500,
      rate_18kt: parseFloat(formData.rate_18kt) || 4875,
      ltv_percentage: parseFloat(formData.ltv_percentage) || 100,
    };
    
    return calculateSaleAgreement(100000, scheme, maxTenure, format(new Date(), 'yyyy-MM-dd'));
  }, [formData]);

  // Get tenure options for the form display
  const tenureOptions = useMemo(() => {
    const min = parseInt(formData.min_tenure_days) || 15;
    const max = parseInt(formData.max_tenure_days) || 90;
    return generateTenureOptions(min, max, 15);
  }, [formData.min_tenure_days, formData.max_tenure_days]);

  // Calculate equivalent annual rate for display
  const equivalentAnnualRate = useMemo(() => {
    const margin = parseFloat(formData.margin_per_month) || 0;
    return marginToAnnualRate(margin).toFixed(2);
  }, [formData.margin_per_month]);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sale Agreement Schemes</h1>
            <p className="text-muted-foreground">Configure schemes for Bill of Sale & Repurchase Option agreements</p>
          </div>
          <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> New Scheme
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Monthly Margin</TableHead>
                  <TableHead className="text-right">22KT Rate</TableHead>
                  <TableHead className="text-center">Tenure</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : schemes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No sale agreement schemes configured. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  schemes.map(scheme => {
                    // Display margin - convert from legacy rate if needed
                    const displayMargin = scheme.margin_per_month || 
                      (scheme.shown_rate ? annualRateToMargin(scheme.shown_rate) : 0);
                    
                    return (
                      <TableRow key={scheme.id}>
                        <TableCell className="font-medium">{scheme.scheme_code}</TableCell>
                        <TableCell>{scheme.scheme_name}</TableCell>
                        <TableCell className="text-right">
                          ₹{displayMargin.toLocaleString('en-IN')}/L/mo
                          <span className="text-xs text-muted-foreground block">
                            (~{marginToAnnualRate(displayMargin).toFixed(1)}% p.a.)
                          </span>
                        </TableCell>
                        <TableCell className="text-right">₹{scheme.rate_22kt?.toLocaleString() || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{scheme.min_tenure_days}-{scheme.max_tenure_days} days</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={scheme.is_active}
                              onCheckedChange={() => handleToggleStatus(scheme)}
                            />
                            <span className={cn(
                              "text-xs font-medium",
                              scheme.is_active ? "text-primary" : "text-muted-foreground"
                            )}>
                              {scheme.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(scheme)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setSchemeToDelete(scheme)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingScheme ? 'Edit Scheme' : 'New Sale Agreement Scheme'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Scheme Code *</Label>
                  <Input 
                    value={formData.scheme_code}
                    onChange={e => setFormData({ ...formData, scheme_code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SALE-01"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scheme Name *</Label>
                  <Input 
                    value={formData.scheme_name}
                    onChange={e => setFormData({ ...formData, scheme_name: e.target.value })}
                    placeholder="e.g., Standard Sale Agreement"
                  />
                </div>
              </div>

              <Separator />

              {/* Margin Configuration - Simplified */}
              <div>
                <h3 className="font-medium mb-3">Margin Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Monthly Margin (₹ per ₹1 Lakh) *</Label>
                    <Input 
                      type="number"
                      value={formData.margin_per_month}
                      onChange={e => setFormData({ ...formData, margin_per_month: e.target.value })}
                      placeholder="1500"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Equivalent to ~{equivalentAnnualRate}% p.a.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Advance Margin (Months)</Label>
                    <Input 
                      type="number"
                      value={formData.advance_interest_months}
                      onChange={e => setFormData({ ...formData, advance_interest_months: e.target.value })}
                      placeholder="1"
                      min="1"
                      max="3"
                    />
                    <p className="text-xs text-muted-foreground">Months collected upfront</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Fees */}
              <div>
                <h3 className="font-medium mb-3">Fees & Charges</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Processing Fee %</Label>
                    <Input 
                      type="number"
                      value={formData.processing_fee_percentage}
                      onChange={e => setFormData({ ...formData, processing_fee_percentage: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Document Charges %</Label>
                    <Input 
                      type="number"
                      value={formData.document_charges}
                      onChange={e => setFormData({ ...formData, document_charges: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Gold Rates */}
              <div>
                <h3 className="font-medium mb-3">Gold Valuation Rates (₹ per gram)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>22KT Rate *</Label>
                    <Input 
                      type="number"
                      value={formData.rate_22kt}
                      onChange={e => setFormData({ ...formData, rate_22kt: e.target.value })}
                      placeholder="6500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>18KT Rate</Label>
                    <Input 
                      type="number"
                      value={formData.rate_18kt}
                      onChange={e => setFormData({ ...formData, rate_18kt: e.target.value })}
                      placeholder="4875"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tenure - 15-day intervals */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">Option Period (Tenure)</h3>
                    <p className="text-sm text-muted-foreground">Tenure in 15-day intervals</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                    <Calculator className="h-4 w-4 mr-2" /> Preview
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum Tenure (Days)</Label>
                    <Input 
                      type="number"
                      value={formData.min_tenure_days}
                      onChange={e => {
                        const val = Math.ceil(parseInt(e.target.value) / 15) * 15;
                        setFormData({ ...formData, min_tenure_days: val.toString() });
                      }}
                      step="15"
                      min="15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Tenure (Days)</Label>
                    <Input 
                      type="number"
                      value={formData.max_tenure_days}
                      onChange={e => {
                        const val = Math.ceil(parseInt(e.target.value) / 15) * 15;
                        setFormData({ ...formData, max_tenure_days: val.toString() });
                      }}
                      step="15"
                      min="15"
                    />
                  </div>
                </div>
                
                {/* Show available tenure options */}
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Available Option Periods:</p>
                  <div className="flex flex-wrap gap-2">
                    {tenureOptions.map(days => (
                      <Badge key={days} variant="secondary">{days} days</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Amount Limits */}
              <div>
                <h3 className="font-medium mb-3">Amount Limits</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>LTV %</Label>
                    <Input 
                      type="number"
                      value={formData.ltv_percentage}
                      onChange={e => setFormData({ ...formData, ltv_percentage: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">100% for sale agreements</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Min Amount</Label>
                    <Input 
                      type="number"
                      value={formData.min_amount}
                      onChange={e => setFormData({ ...formData, min_amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Amount</Label>
                    <Input 
                      type="number"
                      value={formData.max_amount}
                      onChange={e => setFormData({ ...formData, max_amount: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsFormOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingScheme ? 'Update Scheme' : 'Create Scheme'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Strike Price Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Repurchase Price Preview</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Example calculation for ₹1,00,000 purchase
              </p>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spot Purchase Price:</span>
                  <span className="font-medium">₹1,00,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Margin:</span>
                  <span>₹{previewCalc.monthlyMargin.toLocaleString('en-IN')}/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Advance Margin ({previewCalc.advanceMarginMonths} mo):</span>
                  <span>₹{previewCalc.advanceMargin.toLocaleString('en-IN')}</span>
                </div>
                {previewCalc.processingFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Fee:</span>
                    <span>₹{previewCalc.processingFee.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Net Cash to Seller:</span>
                  <span className="text-primary">₹{previewCalc.netCashToSeller.toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Repurchase Price Schedule</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-center">Months</TableHead>
                      <TableHead className="text-right">Strike Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewCalc.strikePrices.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.periodLabel}</TableCell>
                        <TableCell className="text-center">{row.monthsMargin}</TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{row.strikePrice.toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="bg-muted/50 border border-border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Formula:</strong> Strike Price = Spot Price + (Monthly Margin × ceil(Days / 30))
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!schemeToDelete} onOpenChange={(open) => !open && setSchemeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scheme</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{schemeToDelete?.scheme_name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
