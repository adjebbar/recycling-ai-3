import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface LeaderboardUser {
  id: string;
  email: string;
  points: number;
}

const fetchLeaderboard = async (): Promise<LeaderboardUser[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, points')
    .order('points', { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useLeaderboard = () => {
  return useQuery<LeaderboardUser[]>({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
  });
};