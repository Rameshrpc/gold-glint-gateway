import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Vault, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface GoldItemWithTracking {
  id: string;
  item_type: string;
  net_weight_grams: number;
  appraised_value: number;
  is_repledged: boolean;
  repledge_packet_id: string | null;
  packet_number?: string;
}

interface TrackedLoan {
  id: string;
  loan_number: string;
  loan_date: string;
  principal_amount: number;
  customer_name: string;
  gold_items: GoldItemWithTracking[];
  total_items: number;
  in_vault_count: number;
  repledged_count: number;
}

interface LoanTrackingViewProps {
  searchQuery: string;
}

export default function LoanTrackingView({ searchQuery }: LoanTrackingViewProps) {
  const { client } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trackedLoans, setTrackedLoans] = useState<TrackedLoan[]>([]);
  const [expandedLoans, setExpandedLoans] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTrackedLoans();
  }, [client]);

  const fetchTrackedLoans = async () => {
    if (!client) return;
    setLoading(true);

    try {
      // Fetch all active loans with their gold items
      const { data: loans, error } = await supabase
        .from('loans')
        .select(`
          id, loan_number, loan_date, principal_amount,
          customer:customers(full_name),
          gold_items(id, item_type, net_weight_grams, appraised_value, is_repledged, repledge_packet_id)
        `)
        .eq('client_id', client.id)
        .eq('status', 'active')
        .order('loan_date', { ascending: false });

      if (error) throw error;

      // Get packet numbers for repledged items
      const packetIds = new Set<string>();
      loans?.forEach(loan => {
        loan.gold_items?.forEach((item: any) => {
          if (item.repledge_packet_id) {
            packetIds.add(item.repledge_packet_id);
          }
        });
      });

      let packetMap: Record<string, string> = {};
      if (packetIds.size > 0) {
        const { data: packets } = await supabase
          .from('repledge_packets')
          .select('id, packet_number')
          .in('id', Array.from(packetIds));
        
        packets?.forEach(p => {
          packetMap[p.id] = p.packet_number;
        });
      }

      // Transform data
      const transformed: TrackedLoan[] = (loans || []).map(loan => {
        const goldItems = (loan.gold_items || []).map((item: any) => ({
          ...item,
          packet_number: item.repledge_packet_id ? packetMap[item.repledge_packet_id] : undefined
        }));
        
        const inVaultCount = goldItems.filter((i: GoldItemWithTracking) => !i.is_repledged).length;
        const repledgedCount = goldItems.filter((i: GoldItemWithTracking) => i.is_repledged).length;

        return {
          id: loan.id,
          loan_number: loan.loan_number,
          loan_date: loan.loan_date,
          principal_amount: loan.principal_amount,
          customer_name: (loan.customer as any)?.full_name || 'Unknown',
          gold_items: goldItems,
          total_items: goldItems.length,
          in_vault_count: inVaultCount,
          repledged_count: repledgedCount
        };
      });

      setTrackedLoans(transformed);
    } catch (error) {
      console.error('Error fetching tracked loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (loanId: string) => {
    const newExpanded = new Set(expandedLoans);
    if (newExpanded.has(loanId)) {
      newExpanded.delete(loanId);
    } else {
      newExpanded.add(loanId);
    }
    setExpandedLoans(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const filteredLoans = trackedLoans.filter(loan =>
    loan.loan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (loan: TrackedLoan) => {
    if (loan.repledged_count === 0) {
      return <Badge variant="secondary" className="bg-green-100 text-green-700">Fully In Vault</Badge>;
    } else if (loan.in_vault_count === 0) {
      return <Badge variant="default">Fully Repledged</Badge>;
    } else {
      return <Badge variant="outline" className="border-amber-500 text-amber-600">Partially Repledged</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredLoans.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No active loans to track
        </div>
      ) : (
        filteredLoans.map((loan) => (
          <Collapsible 
            key={loan.id} 
            open={expandedLoans.has(loan.id)}
            onOpenChange={() => toggleExpand(loan.id)}
          >
            <div className="border rounded-lg overflow-hidden">
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                      {expandedLoans.has(loan.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">{loan.loan_number}</span>
                        {getStatusBadge(loan)}
                      </div>
                      <p className="text-sm text-muted-foreground">{loan.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(loan.principal_amount)}</p>
                      <p className="text-muted-foreground">{loan.total_items} items</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1 text-green-600">
                        <Vault className="h-4 w-4" />
                        <span>{loan.in_vault_count}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <Package className="h-4 w-4" />
                        <span>{loan.repledged_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t bg-muted/30 p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Type</TableHead>
                        <TableHead>Weight (g)</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loan.gold_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.item_type}</TableCell>
                          <TableCell>{item.net_weight_grams.toFixed(2)}g</TableCell>
                          <TableCell>{formatCurrency(item.appraised_value)}</TableCell>
                          <TableCell>
                            {item.is_repledged ? (
                              <Badge variant="default" className="font-mono">
                                <Package className="h-3 w-3 mr-1" />
                                {item.packet_number || 'Packet'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                <Vault className="h-3 w-3 mr-1" />
                                In Vault
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))
      )}
    </div>
  );
}
