import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFinancialReports, DayBookEntry } from '@/hooks/useFinancialReports';
import { useAuth } from '@/hooks/useAuth';
import { FileText, RefreshCw, Calendar, Filter } from 'lucide-react';

export default function DayBook() {
  const { profile } = useAuth();
  const { getDayBook } = useFinancialReports();
  const [fromDate, setFromDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState<DayBookEntry[]>([]);
  const [voucherTypeFilter, setVoucherTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getDayBook(fromDate, toDate);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.client_id) {
      fetchData();
    }
  }, [profile?.client_id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get unique voucher types for filter
  const voucherTypes = [...new Set(entries.map(e => e.voucher_type))];

  // Filter entries
  const filteredEntries = voucherTypeFilter === 'all'
    ? entries
    : entries.filter(e => e.voucher_type === voucherTypeFilter);

  // Group by voucher
  const groupedByVoucher = filteredEntries.reduce((acc, entry) => {
    const key = `${entry.voucher_date}-${entry.voucher_number}`;
    if (!acc[key]) {
      acc[key] = {
        voucher_date: entry.voucher_date,
        voucher_number: entry.voucher_number,
        voucher_type: entry.voucher_type,
        narration: entry.narration,
        entries: []
      };
    }
    acc[key].entries.push(entry);
    return acc;
  }, {} as Record<string, { voucher_date: string; voucher_number: string; voucher_type: string; narration: string; entries: DayBookEntry[] }>);

  const voucherGroups = Object.values(groupedByVoucher).sort((a, b) => 
    a.voucher_date.localeCompare(b.voucher_date) || a.voucher_number.localeCompare(b.voucher_number)
  );

  const totalDebit = filteredEntries.reduce((sum, e) => sum + e.debit_amount, 0);
  const totalCredit = filteredEntries.reduce((sum, e) => sum + e.credit_amount, 0);

  const voucherTypeColors: Record<string, string> = {
    payment: 'bg-red-100 text-red-700',
    receipt: 'bg-green-100 text-green-700',
    journal: 'bg-blue-100 text-blue-700',
    contra: 'bg-purple-100 text-purple-700'
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Day Book</h1>
            <p className="text-muted-foreground">Daily journal register of all transactions</p>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Report Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="fromDate">From Date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="toDate">To Date</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="voucherType">Voucher Type</Label>
                <Select value={voucherTypeFilter} onValueChange={setVoucherTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {voucherTypes.map(type => (
                      <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={fetchData} disabled={loading}>
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Vouchers</p>
                <p className="text-2xl font-bold">{voucherGroups.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Debit</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDebit)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Credit</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalCredit)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Journal Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : voucherGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found for the selected period
              </div>
            ) : (
              <div className="space-y-4">
                {voucherGroups.map((group, index) => (
                  <div key={`${group.voucher_number}-${index}`} className="border rounded-lg overflow-hidden">
                    {/* Voucher Header */}
                    <div className="bg-muted/50 px-4 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(group.voucher_date), 'dd/MM/yyyy')}
                        </span>
                        <span className="font-mono font-medium">{group.voucher_number}</span>
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${voucherTypeColors[group.voucher_type] || 'bg-gray-100 text-gray-700'}`}>
                          {group.voucher_type}
                        </span>
                      </div>
                    </div>
                    
                    {/* Narration */}
                    {group.narration && (
                      <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/20 border-b">
                        {group.narration}
                      </div>
                    )}

                    {/* Entries Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Code</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead className="text-right">Debit (₹)</TableHead>
                          <TableHead className="text-right">Credit (₹)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.entries.map((entry, entryIndex) => (
                          <TableRow key={`${entry.account_code}-${entryIndex}`}>
                            <TableCell className="font-mono text-sm">{entry.account_code}</TableCell>
                            <TableCell>{entry.account_name}</TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={2} className="text-right font-medium">Voucher Total</TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatCurrency(group.entries.reduce((s, e) => s + e.debit_amount, 0))}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatCurrency(group.entries.reduce((s, e) => s + e.credit_amount, 0))}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ))}

                {/* Grand Totals */}
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Grand Total</span>
                    <div className="flex gap-8">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Debit</p>
                        <p className="font-mono font-bold text-lg">{formatCurrency(totalDebit)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Credit</p>
                        <p className="font-mono font-bold text-lg">{formatCurrency(totalCredit)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
