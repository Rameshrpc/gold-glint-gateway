import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';

interface GoldItem {
  id: string;
  loan_id: string;
  item_type: string;
  description: string | null;
  gross_weight_grams: number;
  net_weight_grams: number;
  appraised_value: number;
  purity: string;
  is_repledged: boolean;
  repledge_packet_id: string | null;
  item_count?: number;
  remarks?: string | null;
}

interface LoanWithItems {
  id: string;
  loan_number: string;
  principal_amount: number;
  customer_name: string;
  gold_items: GoldItem[];
  total_weight: number;
  total_value: number;
}

interface SelectedItem {
  gold_item_id: string;
  loan_id: string;
  weight_grams: number;
  appraised_value: number;
}

interface GoldItemSelectorProps {
  clientId: string;
  selectedItems: SelectedItem[];
  onSelectionChange: (items: SelectedItem[]) => void;
  transactionType?: 'loan' | 'sale_agreement' | 'all';
}

export default function GoldItemSelector({
  clientId,
  selectedItems,
  onSelectionChange,
  transactionType = 'all',
}: GoldItemSelectorProps) {
  const [loansWithItems, setLoansWithItems] = useState<LoanWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [repledgedPacketNumbers, setRepledgedPacketNumbers] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLoansWithItems();
  }, [clientId]);

  const fetchLoansWithItems = async () => {
    if (!clientId) return;

    try {
      // Fetch active loans with gold items
      let query = supabase
        .from('loans')
        .select(`
          id, 
          loan_number, 
          principal_amount,
          transaction_type,
          customer:customers(full_name),
          gold_items(
            id, 
            item_type, 
            description, 
            gross_weight_grams,
            net_weight_grams, 
            appraised_value, 
            purity,
            is_repledged,
            repledge_packet_id,
            item_count,
            remarks
          )
        `)
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order('loan_date', { ascending: false });

      const { data: loans, error } = await query;

      if (error) throw error;

      // Get packet numbers for repledged items
      const repledgedPacketIds = loans?.flatMap(l => 
        (l.gold_items || [])
          .filter(gi => gi.is_repledged && gi.repledge_packet_id)
          .map(gi => gi.repledge_packet_id)
      ).filter(Boolean) as string[];

      if (repledgedPacketIds.length > 0) {
        const { data: packets } = await supabase
          .from('repledge_packets')
          .select('id, packet_number')
          .in('id', repledgedPacketIds);

        const packetMap: Record<string, string> = {};
        packets?.forEach(p => {
          packetMap[p.id] = p.packet_number;
        });
        setRepledgedPacketNumbers(packetMap);
      }

      // Transform to LoanWithItems format, filtering loans that have available items
      const transformedLoans: LoanWithItems[] = (loans || [])
        .filter(loan => {
          // Filter by transaction type if specified
          if (transactionType === 'all') return true;
          if (transactionType === 'loan') {
            return loan.transaction_type !== 'sale_agreement';
          }
          return loan.transaction_type === 'sale_agreement';
        })
        .map(loan => {
          const goldItems: GoldItem[] = (loan.gold_items || []).map(gi => ({
            id: gi.id,
            loan_id: loan.id,
            item_type: gi.item_type,
            description: gi.description,
            gross_weight_grams: gi.gross_weight_grams || 0,
            net_weight_grams: gi.net_weight_grams,
            appraised_value: gi.appraised_value,
            purity: gi.purity,
            is_repledged: gi.is_repledged || false,
            repledge_packet_id: gi.repledge_packet_id,
            item_count: gi.item_count || 1,
            remarks: gi.remarks,
          }));
          
          return {
            id: loan.id,
            loan_number: loan.loan_number,
            principal_amount: loan.principal_amount,
            customer_name: (loan.customer as any)?.full_name || 'Unknown',
            gold_items: goldItems,
            total_weight: goldItems.reduce((s, g) => s + g.net_weight_grams, 0),
            total_value: goldItems.reduce((s, g) => s + g.appraised_value, 0),
          };
        })
        .filter(loan => loan.gold_items.some(gi => !gi.is_repledged)); // Only show loans with available items

      setLoansWithItems(transformedLoans);
    } catch (error) {
      console.error('Error fetching loans with items:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (item: GoldItem, loanId: string) => {
    const isSelected = selectedItems.some(si => si.gold_item_id === item.id);
    
    if (isSelected) {
      onSelectionChange(selectedItems.filter(si => si.gold_item_id !== item.id));
    } else {
      onSelectionChange([
        ...selectedItems,
        {
          gold_item_id: item.id,
          loan_id: loanId,
          weight_grams: item.net_weight_grams,
          appraised_value: item.appraised_value,
        },
      ]);
    }
  };

  const toggleLoan = (loan: LoanWithItems) => {
    const availableItems = loan.gold_items.filter(gi => !gi.is_repledged);
    const allSelected = availableItems.every(gi => 
      selectedItems.some(si => si.gold_item_id === gi.id)
    );

    if (allSelected) {
      // Deselect all items from this loan
      onSelectionChange(
        selectedItems.filter(si => si.loan_id !== loan.id)
      );
    } else {
      // Select all available items from this loan
      const newItems = availableItems
        .filter(gi => !selectedItems.some(si => si.gold_item_id === gi.id))
        .map(gi => ({
          gold_item_id: gi.id,
          loan_id: loan.id,
          weight_grams: gi.net_weight_grams,
          appraised_value: gi.appraised_value,
        }));
      onSelectionChange([...selectedItems, ...newItems]);
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
      <div className="text-center py-4 text-muted-foreground">
        Loading loans and gold items...
      </div>
    );
  }

  if (loansWithItems.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No available loans to repledge
      </div>
    );
  }

  // Calculate selection summary
  const selectedCount = selectedItems.length;
  const selectedWeight = selectedItems.reduce((s, i) => s + i.weight_grams, 0);
  const selectedValue = selectedItems.reduce((s, i) => s + i.appraised_value, 0);
  const affectedLoans = new Set(selectedItems.map(i => i.loan_id)).size;

  return (
    <div className="space-y-3">
      <Card className="max-h-80 overflow-y-auto">
        <CardContent className="p-3">
          <Accordion type="multiple" className="w-full">
            {loansWithItems.map(loan => {
              const availableItems = loan.gold_items.filter(gi => !gi.is_repledged);
              const selectedFromLoan = selectedItems.filter(si => si.loan_id === loan.id);
              const allSelected = availableItems.length > 0 && 
                availableItems.every(gi => selectedItems.some(si => si.gold_item_id === gi.id));
              const someSelected = selectedFromLoan.length > 0 && !allSelected;

              return (
                <AccordionItem key={loan.id} value={loan.id} className="border-b">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allSelected}
                      className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                      onCheckedChange={() => toggleLoan(loan)}
                    />
                    <AccordionTrigger className="flex-1 py-2 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{loan.loan_number}</span>
                          <span className="text-muted-foreground">|</span>
                          <span className="text-sm">{loan.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {availableItems.length} items
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {loan.total_weight.toFixed(2)}g
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                  </div>
                  <AccordionContent>
                    <div className="pl-6 space-y-2 py-2">
                      {loan.gold_items.map(item => {
                        const isSelected = selectedItems.some(si => si.gold_item_id === item.id);
                        const packetNumber = item.repledge_packet_id 
                          ? repledgedPacketNumbers[item.repledge_packet_id] 
                          : null;

                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 p-2 rounded ${
                              item.is_repledged 
                                ? 'bg-muted/30 opacity-60' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={item.is_repledged}
                              onCheckedChange={() => toggleItem(item, loan.id)}
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <div>
                                <span className="text-sm font-medium">{item.item_type}</span>
                                {item.description && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {item.description}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="text-muted-foreground">{item.purity}</span>
                                <span>{item.net_weight_grams.toFixed(2)}g</span>
                                <span>{formatCurrency(item.appraised_value)}</span>
                                {item.is_repledged && packetNumber && (
                                  <Badge variant="secondary" className="text-xs">
                                    In {packetNumber}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {selectedCount > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Selected:</span>
            <div className="flex items-center gap-4">
              <span>{selectedCount} items</span>
              <span>{affectedLoans} loans</span>
              <span>{selectedWeight.toFixed(2)}g</span>
              <span className="font-medium">{formatCurrency(selectedValue)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
