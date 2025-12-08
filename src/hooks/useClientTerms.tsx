import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ClientTerm {
  id: string;
  client_id: string;
  term_type: string;
  language: string;
  terms_text: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useClientTerms = (termType: string = 'loan') => {
  const { profile } = useAuth();
  const clientId = profile?.client_id;

  return useQuery({
    queryKey: ['client-terms', clientId, termType],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('client_terms_conditions')
        .select('*')
        .eq('client_id', clientId)
        .eq('term_type', termType)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as ClientTerm[];
    },
    enabled: !!clientId,
  });
};

export const useSaveClientTerms = () => {
  const { profile } = useAuth();
  const clientId = profile?.client_id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      termType, 
      terms, 
      language = 'bilingual' 
    }: { 
      termType: string; 
      terms: string[]; 
      language?: string;
    }) => {
      if (!clientId) throw new Error('No client ID');

      // First, deactivate existing terms for this type
      await supabase
        .from('client_terms_conditions')
        .update({ is_active: false })
        .eq('client_id', clientId)
        .eq('term_type', termType);

      // Insert new terms
      const termsToInsert = terms.map((text, index) => ({
        client_id: clientId,
        term_type: termType,
        language,
        terms_text: text,
        display_order: index,
        is_active: true,
      }));

      const { data, error } = await supabase
        .from('client_terms_conditions')
        .insert(termsToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-terms'] });
      toast.success('Terms & Conditions saved successfully');
    },
    onError: (error) => {
      console.error('Error saving terms:', error);
      toast.error('Failed to save Terms & Conditions');
    },
  });
};

// Helper to get terms as array of strings for PDF
export const useTermsForPDF = (termType: string = 'loan') => {
  const { data: terms, isLoading } = useClientTerms(termType);
  
  const termsArray = terms?.map(t => t.terms_text) || [];
  
  return {
    terms: termsArray,
    isLoading,
    hasCustomTerms: termsArray.length > 0,
  };
};
