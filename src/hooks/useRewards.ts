import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export interface Reward {
  id: number;
  name: string;
  cost: number;
  icon: string;
}

const fetchRewards = async (): Promise<Reward[]> => {
  const { data, error } = await supabase
    .from('rewards')
    .select('id, name, cost, icon')
    .order('cost', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useRewards = () => {
  return useQuery<Reward[]>({
    queryKey: ['rewards'],
    queryFn: fetchRewards,
  });
};