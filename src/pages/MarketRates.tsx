import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Calendar, IndianRupee } from 'lucide-react';
import { useMarketRates, useSaveMarketRate, useDeleteMarketRate, useTodayMarketRate } from '@/hooks/useMarketRates';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MarketRates() {
  const { data: rates = [], isLoading } = useMarketRates();
  const { data: todayRate } = useTodayMarketRate();
  const saveRate = useSaveMarketRate();
  const deleteRate = useDeleteMarketRate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<{
    id?: string;
    rate_date: string;
    rate_24kt: string;
    rate_22kt: string;
    rate_18kt: string;
    rate_source: string;
    remarks: string;
  } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const openAddDialog = () => {
    setEditingRate({
      rate_date: today,
      rate_24kt: '',
      rate_22kt: '',
      rate_18kt: '',
      rate_source: 'manual',
      remarks: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (rate: typeof rates[0]) => {
    setEditingRate({
      id: rate.id,
      rate_date: rate.rate_date,
      rate_24kt: String(rate.rate_24kt),
      rate_22kt: String(rate.rate_22kt),
      rate_18kt: String(rate.rate_18kt),
      rate_source: rate.rate_source || 'manual',
      remarks: rate.remarks || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingRate) return;

    if (!editingRate.rate_22kt || parseFloat(editingRate.rate_22kt) <= 0) {
      toast.error('Please enter valid 22KT rate');
      return;
    }

    await saveRate.mutateAsync({
      id: editingRate.id,
      rate_date: editingRate.rate_date,
      rate_24kt: parseFloat(editingRate.rate_24kt) || 0,
      rate_22kt: parseFloat(editingRate.rate_22kt),
      rate_18kt: parseFloat(editingRate.rate_18kt) || 0,
      rate_source: editingRate.rate_source,
      remarks: editingRate.remarks || undefined,
    });

    setDialogOpen(false);
    setEditingRate(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this rate?')) {
      await deleteRate.mutateAsync(id);
    }
  };

  // Auto-calculate 24KT and 18KT from 22KT
  const handle22ktChange = (value: string) => {
    if (!editingRate) return;
    const rate22 = parseFloat(value) || 0;
    const rate24 = Math.round(rate22 * (24 / 22));
    const rate18 = Math.round(rate22 * (18 / 22));
    setEditingRate({
      ...editingRate,
      rate_22kt: value,
      rate_24kt: String(rate24),
      rate_18kt: String(rate18),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate price change from previous day
  const getPriceChange = () => {
    if (rates.length < 2 || !todayRate) return null;
    const previousRate = rates.find(r => r.id !== todayRate.id);
    if (!previousRate) return null;
    const change = todayRate.rate_22kt - previousRate.rate_22kt;
    const percentChange = (change / previousRate.rate_22kt) * 100;
    return { change, percentChange };
  };

  const priceChange = getPriceChange();

  // Prepare chart data (last 30 days)
  const chartData = rates
    .slice(0, 30)
    .reverse()
    .map(r => ({
      date: format(new Date(r.rate_date), 'dd MMM'),
      '24KT': r.rate_24kt,
      '22KT': r.rate_22kt,
      '18KT': r.rate_18kt,
    }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Market Rates</h1>
            <p className="text-muted-foreground">Manage daily gold market rates</p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Today's Rate
          </Button>
        </div>

        {/* Today's Rate Card */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Calendar className="h-5 w-5" />
              {todayRate ? format(new Date(todayRate.rate_date), 'dd MMMM yyyy') : 'Today'}
              {todayRate?.rate_date !== today && (
                <Badge variant="secondary" className="ml-2">Latest Available</Badge>
              )}
            </CardTitle>
            {todayRate?.rate_source && (
              <CardDescription className="text-amber-600">
                Source: {todayRate.rate_source.toUpperCase()}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {todayRate ? (
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white/60 rounded-lg">
                  <div className="text-sm text-amber-700 font-medium mb-1">24KT (Pure)</div>
                  <div className="text-2xl font-bold text-amber-900">
                    {formatCurrency(todayRate.rate_24kt)}<span className="text-sm font-normal">/g</span>
                  </div>
                </div>
                <div className="text-center p-4 bg-amber-100/60 rounded-lg ring-2 ring-amber-400">
                  <div className="text-sm text-amber-700 font-medium mb-1">22KT (Standard)</div>
                  <div className="text-2xl font-bold text-amber-900">
                    {formatCurrency(todayRate.rate_22kt)}<span className="text-sm font-normal">/g</span>
                  </div>
                  {priceChange && (
                    <div className={`flex items-center justify-center gap-1 mt-1 text-sm ${priceChange.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {priceChange.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {priceChange.change >= 0 ? '+' : ''}{formatCurrency(priceChange.change)} ({priceChange.percentChange.toFixed(2)}%)
                    </div>
                  )}
                </div>
                <div className="text-center p-4 bg-white/60 rounded-lg">
                  <div className="text-sm text-amber-700 font-medium mb-1">18KT</div>
                  <div className="text-2xl font-bold text-amber-900">
                    {formatCurrency(todayRate.rate_18kt)}<span className="text-sm font-normal">/g</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-amber-700">
                <IndianRupee className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No market rates configured</p>
                <Button onClick={openAddDialog} variant="outline" className="mt-4">
                  Add First Rate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rate Trend Chart */}
        {chartData.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Rate Trend (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="24KT" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="22KT" stroke="#b45309" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="18KT" stroke="#92400e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Rate History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Rate History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">24KT</TableHead>
                  <TableHead className="text-right">22KT</TableHead>
                  <TableHead className="text-right">18KT</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                  </TableRow>
                ) : rates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No market rates found
                    </TableCell>
                  </TableRow>
                ) : (
                  rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">
                        {format(new Date(rate.rate_date), 'dd MMM yyyy')}
                        {rate.rate_date === today && (
                          <Badge variant="secondary" className="ml-2">Today</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(rate.rate_24kt)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(rate.rate_22kt)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(rate.rate_18kt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{rate.rate_source || 'Manual'}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{rate.remarks || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(rate)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(rate.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRate?.id ? 'Edit Market Rate' : 'Add Market Rate'}</DialogTitle>
          </DialogHeader>
          {editingRate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editingRate.rate_date}
                    onChange={(e) => setEditingRate({ ...editingRate, rate_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={editingRate.rate_source}
                    onValueChange={(v) => setEditingRate({ ...editingRate, rate_source: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="mcx">MCX</SelectItem>
                      <SelectItem value="ibja">IBJA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>22KT Rate (₹/gram) *</Label>
                <Input
                  type="number"
                  placeholder="Enter 22KT rate"
                  value={editingRate.rate_22kt}
                  onChange={(e) => handle22ktChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">24KT and 18KT will be auto-calculated</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>24KT Rate (₹/gram)</Label>
                  <Input
                    type="number"
                    value={editingRate.rate_24kt}
                    onChange={(e) => setEditingRate({ ...editingRate, rate_24kt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>18KT Rate (₹/gram)</Label>
                  <Input
                    type="number"
                    value={editingRate.rate_18kt}
                    onChange={(e) => setEditingRate({ ...editingRate, rate_18kt: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea
                  placeholder="Optional notes..."
                  value={editingRate.remarks}
                  onChange={(e) => setEditingRate({ ...editingRate, remarks: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveRate.isPending}>
              {saveRate.isPending ? 'Saving...' : 'Save Rate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}