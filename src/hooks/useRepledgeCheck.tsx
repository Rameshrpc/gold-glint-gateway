import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export async function checkRepledgeStatus(loanId: string): Promise<{ isRepledged: boolean; packetNumber?: string }> {
  try {
    const { data: repledgeItem } = await supabase
      .from('repledge_items')
      .select('id, packet:repledge_packets(packet_number, status)')
      .eq('loan_id', loanId)
      .maybeSingle();

    if (repledgeItem && (repledgeItem.packet as any)?.status === 'active') {
      return {
        isRepledged: true,
        packetNumber: (repledgeItem.packet as any)?.packet_number,
      };
    }

    return { isRepledged: false };
  } catch (error) {
    console.error('Error checking repledge status:', error);
    return { isRepledged: false };
  }
}

export function showRepledgeWarning(packetNumber: string) {
  toast.error(
    `This loan is currently repledged in packet ${packetNumber}. Please redeem the packet in Gold Vault first.`,
    { duration: 5000 }
  );
}
