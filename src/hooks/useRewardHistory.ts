import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export interface RewardHistoryItem {
  id: string;
  amount: number;
  points_cost: number;
  status: string;
  created_at: string;
  redeemed_at: string | null;
  expires_at: string | null;
  reward_id: number; // Added to track which reward was redeemed
  rewards: { // Join with rewards table
    name: string;
    icon: string;
  } | null;
}

const fetchRewardHistory = async (userId: string | undefined): Promise<RewardHistoryItem[]> => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('vouchers')
    .select(`
      id,
      amount,
      points_cost,
      status,
      created_at,
      redeemed_at,
      expires_at,
      reward_id,
      rewards (name, icon)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  // Cast to unknown first, then to the desired type to bypass strict type checking
  return (data || []) as unknown as RewardHistoryItem[];
};

export const useRewardHistory = () => {
  const { user } = useAuth();

  return useQuery<RewardHistoryItem[]>({
    queryKey: ['rewardHistory', user?.id],
    queryFn: () => fetchRewardHistory(user?.id),
    enabled: !!user,
  });
};