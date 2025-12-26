import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RepledgeGoldItem {
  id: string;
  loan_id: string;
  gold_item_id: string;
  weight_grams: number;
  appraised_value: number;
  principal_allocated: number;
  status: string;
  gold_item?: {
    item_type: string;
    description: string | null;
    purity: string;
  };
}

interface LoanGroup {
  loan_id: string;
  loan_number: string;
  customer_name: string;
  items: RepledgeGoldItem[];
  total_weight: number;
  total_value: number;
  total_principal: number;
}

interface PacketItemsViewProps {
  packetId: string;
}

export default function PacketItemsView({ packetId }: PacketItemsViewProps) {
  const [loanGroups, setLoanGroups] = useState<LoanGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPacketItems();
  }, [packetId]);

  const fetchPacketItems = async () => {
    if (!packetId) return;

    try {
      const { data, error } = await supabase
        .from('repledge_gold_items')
        .select(`
          id,
          loan_id,
          gold_item_id,
          weight_grams,
          appraised_value,
          principal_allocated,
          status,
          gold_item:gold_items(item_type, description, purity),
          loan:loans(loan_number, customer:customers(full_name))
        `)
        .eq('packet_id', packetId)
        .order('loan_id');

      if (error) throw error;

      // Group by loan
      const groupedMap = new Map<string, LoanGroup>();
      
      (data || []).forEach(item => {
        const loanId = item.loan_id;
        const loanData = item.loan as any;
        
        if (!groupedMap.has(loanId)) {
          groupedMap.set(loanId, {
            loan_id: loanId,
            loan_number: loanData?.loan_number || 'Unknown',
            customer_name: loanData?.customer?.full_name || 'Unknown',
            items: [],
            total_weight: 0,
            total_value: 0,
            total_principal: 0,
          });
        }
        
        const group = groupedMap.get(loanId)!;
        group.items.push({
          ...item,
          gold_item: item.gold_item as any,
        });
        group.total_weight += item.weight_grams;
        group.total_value += item.appraised_value;
        group.total_principal += item.principal_allocated;
      });

      setLoanGroups(Array.from(groupedMap.values()));
    } catch (error) {
      console.error('Error fetching packet items:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (loanGroups.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No items in this packet
      </div>
    );
  }

  const totals = loanGroups.reduce(
    (acc, group) => ({
      items: acc.items + group.items.length,
      weight: acc.weight + group.total_weight,
      value: acc.value + group.total_value,
      principal: acc.principal + group.total_principal,
    }),
    { items: 0, weight: 0, value: 0, principal: 0 }
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{loanGroups.length}</p>
          <p className="text-muted-foreground">Loans</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{totals.items}</p>
          <p className="text-muted-foreground">Items</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{totals.weight.toFixed(2)}g</p>
          <p className="text-muted-foreground">Gold Weight</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{formatCurrency(totals.value)}</p>
          <p className="text-muted-foreground">Total Value</p>
        </div>
      </div>

      {/* Grouped Items */}
      <Accordion type="multiple" className="w-full" defaultValue={loanGroups.map(g => g.loan_id)}>
        {loanGroups.map(group => (
          <AccordionItem key={group.loan_id} value={group.loan_id}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{group.loan_number}</span>
                  <span className="text-muted-foreground">|</span>
                  <span>{group.customer_name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline">{group.items.length} items</Badge>
                  <span>{group.total_weight.toFixed(2)}g</span>
                  <span>{formatCurrency(group.total_value)}</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Type</TableHead>
                    <TableHead>Purity</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Principal Allocated</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{item.gold_item?.item_type}</span>
                          {item.gold_item?.description && (
                            <p className="text-xs text-muted-foreground">{item.gold_item.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.gold_item?.purity}</TableCell>
                      <TableCell className="text-right">{item.weight_grams.toFixed(2)}g</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.appraised_value)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.principal_allocated)}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'repledged' ? 'default' : 'outline'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
