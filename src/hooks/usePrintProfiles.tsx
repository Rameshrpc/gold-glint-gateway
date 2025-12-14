import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PrintProfileDocument {
  id: string;
  profile_id: string;
  document_type: string;
  template_id: string | null;
  print_order: number;
  copies: number;
  is_required: boolean;
  template?: {
    id: string;
    template_name: string;
    receipt_type: string;
  } | null;
}

export interface PrintProfile {
  id: string;
  client_id: string;
  profile_name: string;
  profile_type: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  documents: PrintProfileDocument[];
}

export function usePrintProfiles() {
  const { client } = useAuth();
  const [profiles, setProfiles] = useState<PrintProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client?.id) {
      fetchProfiles();
    }
  }, [client?.id]);

  const fetchProfiles = async () => {
    if (!client?.id) return;
    
    setLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('print_profiles')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      // Fetch documents for each profile
      const profilesWithDocs: PrintProfile[] = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: docs } = await supabase
            .from('print_profile_documents')
            .select('*')
            .eq('profile_id', profile.id)
            .order('print_order', { ascending: true });

          return {
            ...profile,
            documents: docs || [],
          };
        })
      );

      setProfiles(profilesWithDocs);
    } catch (error) {
      console.error('Error fetching print profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  return { profiles, loading, refetch: fetchProfiles };
}

export function useDefaultPrintProfile(profileType: string) {
  const { client } = useAuth();
  const [profile, setProfile] = useState<PrintProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client?.id && profileType) {
      fetchDefaultProfile();
    }
  }, [client?.id, profileType]);

  const fetchDefaultProfile = async () => {
    if (!client?.id) return;

    setLoading(true);
    try {
      // First try to get default profile for this type
      let { data: profileData, error } = await supabase
        .from('print_profiles')
        .select('*')
        .eq('client_id', client.id)
        .eq('profile_type', profileType)
        .eq('is_active', true)
        .eq('is_default', true)
        .single();

      // If no default, get any active profile of this type
      if (!profileData) {
        const { data: fallbackData } = await supabase
          .from('print_profiles')
          .select('*')
          .eq('client_id', client.id)
          .eq('profile_type', profileType)
          .eq('is_active', true)
          .limit(1)
          .single();
        
        profileData = fallbackData;
      }

      if (profileData) {
        // Fetch documents for the profile
        const { data: docs } = await supabase
          .from('print_profile_documents')
          .select('*')
          .eq('profile_id', profileData.id)
          .order('print_order', { ascending: true });

        setProfile({
          ...profileData,
          documents: docs || [],
        });
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching default print profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, refetch: fetchDefaultProfile };
}
