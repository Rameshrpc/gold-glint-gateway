import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RepledgeStatus {
  isRepledged: boolean;
  hasRepledgedItems: boolean;
  repledgedCount: number;
  totalCount: number;
  repledgedItems: {
    goldItemId: string;
    packetNumber: string;
    weightGrams: number;
    appraisedValue: number;
  }[];
  packetNumbers: string[];
}

// Check if a loan has any repledged items (item-level check)
export async function checkRepledgeStatus(loanId: string): Promise<RepledgeStatus> {
  try {
    // Use the new database function for comprehensive check
    const { data, error } = await supabase.rpc('check_loan_items_repledge_status', {
      p_loan_id: loanId
    });

    if (error) {
      console.error('Error checking repledge status:', error);
      // Fall back to legacy check
      return await legacyRepledgeCheck(loanId);
    }

    const result = data as {
      has_repledged_items: boolean;
      repledged_items: Array<{
        gold_item_id: string;
        packet_id: string;
        packet_number: string;
        weight_grams: number;
        appraised_value: number;
      }>;
      total_items: number;
      repledged_count: number;
    };

    const packetNumbers = [...new Set(result.repledged_items.map(i => i.packet_number))];

    return {
      isRepledged: result.has_repledged_items,
      hasRepledgedItems: result.has_repledged_items,
      repledgedCount: result.repledged_count,
      totalCount: result.total_items,
      repledgedItems: result.repledged_items.map(i => ({
        goldItemId: i.gold_item_id,
        packetNumber: i.packet_number,
        weightGrams: i.weight_grams,
        appraisedValue: i.appraised_value,
      })),
      packetNumbers,
    };
  } catch (error) {
    console.error('Error checking repledge status:', error);
    return {
      isRepledged: false,
      hasRepledgedItems: false,
      repledgedCount: 0,
      totalCount: 0,
      repledgedItems: [],
      packetNumbers: [],
    };
  }
}

// Legacy check for backward compatibility (checks repledge_items table)
async function legacyRepledgeCheck(loanId: string): Promise<RepledgeStatus> {
  try {
    const { data: repledgeItem } = await supabase
      .from('repledge_items')
      .select('id, packet:repledge_packets(packet_number, status)')
      .eq('loan_id', loanId)
      .maybeSingle();

    if (repledgeItem && (repledgeItem.packet as any)?.status === 'active') {
      return {
        isRepledged: true,
        hasRepledgedItems: true,
        repledgedCount: 1,
        totalCount: 1,
        repledgedItems: [],
        packetNumbers: [(repledgeItem.packet as any)?.packet_number],
      };
    }

    return {
      isRepledged: false,
      hasRepledgedItems: false,
      repledgedCount: 0,
      totalCount: 0,
      repledgedItems: [],
      packetNumbers: [],
    };
  } catch (error) {
    console.error('Error in legacy repledge check:', error);
    return {
      isRepledged: false,
      hasRepledgedItems: false,
      repledgedCount: 0,
      totalCount: 0,
      repledgedItems: [],
      packetNumbers: [],
    };
  }
}

// Check specific gold items for repledge status
export async function checkItemsRepledgeStatus(goldItemIds: string[]): Promise<{
  repledgedItems: { itemId: string; packetNumber: string }[];
}> {
  try {
    const { data, error } = await supabase
      .from('repledge_gold_items')
      .select('gold_item_id, packet:repledge_packets(packet_number, status)')
      .in('gold_item_id', goldItemIds)
      .eq('status', 'repledged');

    if (error) throw error;

    const repledgedItems = (data || [])
      .filter(d => (d.packet as any)?.status === 'active')
      .map(d => ({
        itemId: d.gold_item_id,
        packetNumber: (d.packet as any)?.packet_number,
      }));

    return { repledgedItems };
  } catch (error) {
    console.error('Error checking items repledge status:', error);
    return { repledgedItems: [] };
  }
}

export function showRepledgeWarning(status: RepledgeStatus) {
  if (status.repledgedCount === status.totalCount) {
    // All items repledged
    toast.error(
      `This loan is fully repledged in packet${status.packetNumbers.length > 1 ? 's' : ''} ${status.packetNumbers.join(', ')}. Please redeem the packet(s) in Gold Vault first.`,
      { duration: 5000 }
    );
  } else {
    // Partial repledge
    toast.error(
      `${status.repledgedCount} of ${status.totalCount} items are repledged in packet${status.packetNumbers.length > 1 ? 's' : ''} ${status.packetNumbers.join(', ')}. Please redeem the packet(s) first.`,
      { duration: 5000 }
    );
  }
}

// Legacy function for backward compatibility
export function showRepledgeWarningLegacy(packetNumber: string) {
  toast.error(
    `This loan is currently repledged in packet ${packetNumber}. Please redeem the packet in Gold Vault first.`,
    { duration: 5000 }
  );
}
