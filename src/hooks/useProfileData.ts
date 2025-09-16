import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export interface ScanHistoryItem {
  id: number;
  scanned_at: string;
  points_earned: number;
  product_barcode: string;
}

const fetchScanHistory = async (userId: string | undefined): Promise<ScanHistoryItem[]> => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('scan_history')
    .select('*')
    .eq('user_id', userId)
    .order('scanned_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return data || [];
};

export const useProfileData = () => {
  const { user } = useAuth();

  return useQuery<ScanHistoryItem[]>({
    queryKey: ['scanHistory', user?.id],
    queryFn: () => fetchScanHistory(user?.id),
    enabled: !!user,
  });
};