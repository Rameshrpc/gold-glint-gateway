import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Trash2, FileText, X, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { calculateStrikePrices, type StrikePeriodConfig } from '@/lib/strike-price-utils';
import { format } from 'date-fns';

interface StrikePeriod {
  days: number;
  label_en: string;
  label_ta: string;
}

interface SaleScheme {
  id: string;
  scheme_code: string;
  scheme_name: string;
  shown_rate: number;
  effective_rate: number;
  minimum_days: number;
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
}

export default function SaleSchemes() {
  const { client } = useAuth();
  const [schemes, setSchemes] = useState<SaleScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<SaleScheme | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    scheme_code: '',
    scheme_name: '',
    shown_rate: '',
    effective_rate: '',
    minimum_days: '30',
    advance_interest_months: '3',
    ltv_percentage: '75',
    min_amount: '5000',
    max_amount: '10000000',
    min_tenure_days: '30',
    max_tenure_days: '90',
    processing_fee_percentage: '0',
    document_charges: '0',
    rate_18kt: '',
    rate_22kt: '',
  });
  
  // Strike periods state
  const [strikePeriods, setStrikePeriods] = useState<StrikePeriod[]>([
    { days: 30, label_en: '0-30 Days', label_ta: '0-30 நாட்கள்' },
    { days: 45, label_en: '31-45 Days', label_ta: '31-45 நாட்கள்' },
    { days: 60, label_en: '46-60 Days', label_ta: '46-60 நாட்கள்' },
    { days: 75, label_en: '61-75 Days', label_ta: '61-75 நாட்கள்' },
    { days: 90, label_en: '76-90 Days', label_ta: '76-90 நாட்கள்' },
  ]);

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
      shown_rate: '',
      effective_rate: '',
      minimum_days: '30',
      advance_interest_months: '3',
      ltv_percentage: '75',
      min_amount: '5000',
      max_amount: '10000000',
      min_tenure_days: '30',
      max_tenure_days: '90',
      processing_fee_percentage: '0',
      document_charges: '0',
      rate_18kt: '',
      rate_22kt: '',
    });
    setStrikePeriods([
      { days: 30, label_en: '0-30 Days', label_ta: '0-30 நாட்கள்' },
      { days: 45, label_en: '31-45 Days', label_ta: '31-45 நாட்கள்' },
      { days: 60, label_en: '46-60 Days', label_ta: '46-60 நாட்கள்' },
      { days: 75, label_en: '61-75 Days', label_ta: '61-75 நாட்கள்' },
      { days: 90, label_en: '76-90 Days', label_ta: '76-90 நாட்கள்' },
    ]);
    setEditingScheme(null);
  };

  const handleEdit = (scheme: SaleScheme) => {
    setEditingScheme(scheme);
    setFormData({
      scheme_code: scheme.scheme_code,
      scheme_name: scheme.scheme_name,
      shown_rate: scheme.shown_rate.toString(),
      effective_rate: scheme.effective_rate.toString(),
      minimum_days: scheme.minimum_days.toString(),
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
    setStrikePeriods(
      Array.isArray(scheme.strike_periods) 
        ? (scheme.strike_periods as StrikePeriod[])
        : [
            { days: 30, label_en: '0-30 Days', label_ta: '0-30 நாட்கள்' },
            { days: 60, label_en: '31-60 Days', label_ta: '31-60 நாட்கள்' },
            { days: 90, label_en: '61-90 Days', label_ta: '61-90 நாட்கள்' },
          ]
    );
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!client) return;
    
    if (!formData.scheme_code || !formData.scheme_name || !formData.shown_rate || !formData.effective_rate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const schemeData = {
        client_id: client.id,
        scheme_code: formData.scheme_code,
        scheme_name: formData.scheme_name,
        scheme_type: 'sale_agreement' as const,
        interest_rate: parseFloat(formData.shown_rate),
        shown_rate: parseFloat(formData.shown_rate),
        effective_rate: parseFloat(formData.effective_rate),
        minimum_days: parseInt(formData.minimum_days),
        advance_interest_months: parseInt(formData.advance_interest_months),
        ltv_percentage: parseFloat(formData.ltv_percentage),
        min_amount: parseFloat(formData.min_amount),
        max_amount: parseFloat(formData.max_amount),
        min_tenure_days: parseInt(formData.min_tenure_days),
        max_tenure_days: parseInt(formData.max_tenure_days),
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
        const { error } = await supabase
          .from('schemes')
          .insert(schemeData);
        if (error) throw error;
        toast.success('Scheme created successfully');
      }

      setIsFormOpen(false);
      resetForm();
      fetchSchemes();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const addStrikePeriod = () => {
    const lastPeriod = strikePeriods[strikePeriods.length - 1];
    const newDays = lastPeriod ? lastPeriod.days + 15 : 30;
    const prevDays = lastPeriod ? lastPeriod.days + 1 : 0;
    setStrikePeriods([
      ...strikePeriods,
      { days: newDays, label_en: `${prevDays}-${newDays} Days`, label_ta: `${prevDays}-${newDays} நாட்கள்` }
    ]);
  };

  const removeStrikePeriod = (index: number) => {
    if (strikePeriods.length <= 1) {
      toast.error('At least one strike period is required');
      return;
    }
    setStrikePeriods(strikePeriods.filter((_, i) => i !== index));
  };

  const updateStrikePeriod = (index: number, field: keyof StrikePeriod, value: string | number) => {
    const updated = [...strikePeriods];
    if (field === 'days') {
      updated[index] = { ...updated[index], days: parseInt(value as string) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setStrikePeriods(updated);
  };

  // Preview calculation
  const getPreviewStrikePrices = () => {
    const principal = 100000;
    const shownRate = parseFloat(formData.shown_rate) || 18;
    const effectiveRate = parseFloat(formData.effective_rate) || 36;
    const processingFee = parseFloat(formData.processing_fee_percentage) || 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const tenure = parseInt(formData.max_tenure_days) || 90;
    
    const customPeriods: StrikePeriodConfig[] = strikePeriods.map(p => ({
      days: p.days,
      labelEnglish: p.label_en,
      labelTamil: p.label_ta,
    }));
    
    return calculateStrikePrices(principal, shownRate, effectiveRate, processingFee, today, tenure, customPeriods);
  };

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
                  <TableHead className="text-right">Trade Margin</TableHead>
                  <TableHead className="text-right">Effective</TableHead>
                  <TableHead className="text-right">22KT Rate</TableHead>
                  <TableHead className="text-center">Periods</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : schemes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No sale agreement schemes configured. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  schemes.map(scheme => (
                    <TableRow key={scheme.id}>
                      <TableCell className="font-medium">{scheme.scheme_code}</TableCell>
                      <TableCell>{scheme.scheme_name}</TableCell>
                      <TableCell className="text-right">{scheme.shown_rate}%</TableCell>
                      <TableCell className="text-right">{scheme.effective_rate}%</TableCell>
                      <TableCell className="text-right">₹{scheme.rate_22kt?.toLocaleString() || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{Array.isArray(scheme.strike_periods) ? scheme.strike_periods.length : 3}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={scheme.is_active ? 'default' : 'secondary'}>
                          {scheme.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(scheme)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

              {/* Rate Configuration */}
              <div>
                <h3 className="font-medium mb-3">Trade Margin Rates (% per annum)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Trade Margin (Shown) *</Label>
                    <Input 
                      type="number"
                      value={formData.shown_rate}
                      onChange={e => setFormData({ ...formData, shown_rate: e.target.value })}
                      placeholder="18"
                    />
                    <p className="text-xs text-muted-foreground">Visible on Bill of Sale</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Effective Rate (Internal) *</Label>
                    <Input 
                      type="number"
                      value={formData.effective_rate}
                      onChange={e => setFormData({ ...formData, effective_rate: e.target.value })}
                      placeholder="36"
                    />
                    <p className="text-xs text-muted-foreground">Actual rate for calculation</p>
                  </div>
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
                    <Label>Document Charges</Label>
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
                    <Label>22KT Rate</Label>
                    <Input 
                      type="number"
                      value={formData.rate_22kt}
                      onChange={e => setFormData({ ...formData, rate_22kt: e.target.value })}
                      placeholder="5500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>18KT Rate</Label>
                    <Input 
                      type="number"
                      value={formData.rate_18kt}
                      onChange={e => setFormData({ ...formData, rate_18kt: e.target.value })}
                      placeholder="4500"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Strike Periods Configuration */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium">Strike Price Periods</h3>
                    <p className="text-sm text-muted-foreground">Configure repurchase option exercise periods</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                      <Calculator className="h-4 w-4 mr-2" /> Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={addStrikePeriod}>
                      <Plus className="h-4 w-4 mr-2" /> Add Period
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 border rounded-lg p-4">
                  {strikePeriods.map((period, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Input
                          value={period.label_en}
                          onChange={e => updateStrikePeriod(index, 'label_en', e.target.value)}
                          placeholder="0-30 Days"
                          className="text-sm"
                        />
                        <Input
                          value={period.label_ta}
                          onChange={e => updateStrikePeriod(index, 'label_ta', e.target.value)}
                          placeholder="0-30 நாட்கள்"
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          value={period.days}
                          onChange={e => updateStrikePeriod(index, 'days', e.target.value)}
                          placeholder="30"
                          className="text-sm"
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeStrikePeriod(index)}
                        disabled={strikePeriods.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter: English Label | Tamil Label | Days (cumulative from loan date)
                  </p>
                </div>
              </div>

              <Separator />

              {/* Limits */}
              <div>
                <h3 className="font-medium mb-3">Amount & Tenure Limits</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <div className="space-y-2">
                    <Label>Min Tenure (Days)</Label>
                    <Input 
                      type="number"
                      value={formData.min_tenure_days}
                      onChange={e => setFormData({ ...formData, min_tenure_days: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Tenure (Days)</Label>
                    <Input 
                      type="number"
                      value={formData.max_tenure_days}
                      onChange={e => setFormData({ ...formData, max_tenure_days: e.target.value })}
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
              <DialogTitle>Strike Price Preview</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Example calculation for ₹1,00,000 purchase
              </p>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Spot Purchase Price:</span>
                  <span className="font-medium">₹1,00,000</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Trade Margin Rate:</span>
                  <span>{formData.shown_rate || 18}% p.a.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Effective Rate:</span>
                  <span>{formData.effective_rate || 36}% p.a.</span>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Strike Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPreviewStrikePrices().strikePrices.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.periodLabel}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{row.strikePrice.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <p className="text-xs text-muted-foreground">
                Formula: Strike Price = Spot Price + (Principal × Effective Rate × Days / 36500) + Processing Fee
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
