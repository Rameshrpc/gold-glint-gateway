import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFinancialReports, LedgerEntry } from '@/hooks/useFinancialReports';
import { useAuth } from '@/hooks/useAuth';
import { printElement } from '@/lib/print';
import { FileText, RefreshCw, BookOpen, ExternalLink } from 'lucide-react';

// Map reference types to their source pages
const referenceSourceMap: Record<string, string> = {
  loan: '/loans',
  interest_payment: '/interest',
  redemption: '/redemption',
  auction: '/auction',
  repledge_packet: '/gold-vault',
  agent_commission_payment: '/agent-commissions',
};

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
}

export default function LedgerStatement() {
  const navigate = useNavigate();
  const { profile, client } = useAuth();
  const { getLedgerStatement, getAccounts } = useFinancialReports();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

  const handleViewSource = (referenceType: string | undefined, referenceId: string | undefined) => {
    if (!referenceType || !referenceId) return;
    const path = referenceSourceMap[referenceType];
    if (path) {
      navigate(path);
    }
  };

  const fetchAccounts = async () => {
    const data = await getAccounts();
    setAccounts(data);
  };

  const fetchData = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const data = await getLedgerStatement(selectedAccount, fromDate, toDate);
      setEntries(data.entries);
      setOpeningBalance(data.openingBalance);
      setClosingBalance(data.closingBalance);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.client_id) {
      fetchAccounts();
    }
  }, [profile?.client_id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const selectedAccountDetails = accounts.find(a => a.id === selectedAccount);

  const totalDebit = entries.reduce((sum, e) => sum + e.debit_amount, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit_amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ledger Statement</h1>
            <p className="text-muted-foreground">Account-wise transaction history</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading || !selectedAccount}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowPDF(true)} disabled={entries.length === 0}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Report Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="sm:col-span-2">
                <Label htmlFor="account">Select Account</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an account" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        <span className="font-mono text-sm mr-2">{account.account_code}</span>
                        {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <Button onClick={fetchData} disabled={loading || !selectedAccount} className="lg:col-span-4 sm:w-fit">
                Generate Statement
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedAccountDetails && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <span className="font-mono text-primary">{selectedAccountDetails.account_code}</span>
                  {selectedAccountDetails.account_name}
                </CardTitle>
                <span className="text-sm text-muted-foreground capitalize px-2 py-1 bg-muted rounded">
                  {selectedAccountDetails.account_type}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {/* Opening Balance */}
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Opening Balance</span>
                    <span className={`font-mono font-bold ${openingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(openingBalance))} {openingBalance >= 0 ? 'Dr' : 'Cr'}
                    </span>
                  </div>

                  {/* Transactions */}
                  {entries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions found for the selected period
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Voucher</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Narration</TableHead>
                            <TableHead className="text-right">Debit (₹)</TableHead>
                            <TableHead className="text-right">Credit (₹)</TableHead>
                            <TableHead className="text-right">Balance (₹)</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entries.map(entry => (
                            <TableRow key={entry.id} className="group">
                              <TableCell className="whitespace-nowrap">
                                {format(new Date(entry.voucher_date), 'dd/MM/yyyy')}
                              </TableCell>
                              <TableCell className="font-mono text-sm">{entry.voucher_number}</TableCell>
                              <TableCell>
                                <span className="capitalize text-xs px-2 py-0.5 bg-muted rounded">
                                  {entry.voucher_type.replace(/_/g, ' ')}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">{entry.narration}</TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                              </TableCell>
                              <TableCell className={`text-right font-mono font-medium ${entry.running_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(Math.abs(entry.running_balance))} {entry.running_balance >= 0 ? 'Dr' : 'Cr'}
                              </TableCell>
                              <TableCell>
                                {entry.reference_type && entry.reference_id && referenceSourceMap[entry.reference_type] && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleViewSource(entry.reference_type, entry.reference_id)}
                                    title="View Source"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-bold">
                            <TableCell colSpan={4} className="text-right">Totals</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(totalDebit)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(totalCredit)}</TableCell>
                            <TableCell colSpan={2} />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Closing Balance */}
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="font-bold">Closing Balance</span>
                    <span className={`font-mono font-bold text-lg ${closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(closingBalance))} {closingBalance >= 0 ? 'Dr' : 'Cr'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Print Dialog */}
      {showPDF && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Ledger Statement - Print Preview</h2>
              <div className="flex gap-2">
                <Button onClick={() => printElement('ledger-print')}>Print</Button>
                <Button variant="outline" onClick={() => setShowPDF(false)}>Close</Button>
              </div>
            </div>
            <div id="ledger-print" className="p-6 bg-white">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">{client?.company_name}</h1>
                <h2 className="text-lg">Ledger Statement</h2>
                <p className="font-medium">{selectedAccountDetails?.account_name} ({selectedAccountDetails?.account_code})</p>
                <p className="text-muted-foreground">{format(new Date(fromDate), 'dd MMM yyyy')} to {format(new Date(toDate), 'dd MMM yyyy')}</p>
              </div>
              <div className="mb-4 p-3 bg-gray-100 rounded">
                <span className="font-bold">Opening Balance: </span>
                <span className={`font-mono ${openingBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(Math.abs(openingBalance))} {openingBalance >= 0 ? 'Dr' : 'Cr'}
                </span>
              </div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Debit</th>
                    <th className="text-right py-2">Credit</th>
                    <th className="text-right py-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{format(new Date(entry.voucher_date), 'dd/MM/yyyy')}</td>
                      <td className="py-2">{entry.narration}</td>
                      <td className="text-right font-mono">{entry.debit_amount ? formatCurrency(entry.debit_amount) : '-'}</td>
                      <td className="text-right font-mono">{entry.credit_amount ? formatCurrency(entry.credit_amount) : '-'}</td>
                      <td className="text-right font-mono">{formatCurrency(Math.abs(entry.running_balance))} {entry.running_balance >= 0 ? 'Dr' : 'Cr'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 p-3 bg-gray-100 rounded">
                <span className="font-bold">Closing Balance: </span>
                <span className={`font-mono ${closingBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(Math.abs(closingBalance))} {closingBalance >= 0 ? 'Dr' : 'Cr'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
