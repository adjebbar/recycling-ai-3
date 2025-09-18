import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export interface UserListItem {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const fetchAllUsers = async (): Promise<UserListItem[]> => {
  const { data, error } = await supabase.functions.invoke('list-all-users');

  if (error) {
    let errorMessage = 'Failed to fetch users.';
    try {
      const errorBody = await error.context.json();
      if (errorBody && errorBody.error) {
        errorMessage = errorBody.error;
      }
    } catch (e) {
      console.error("Could not parse error response from edge function:", e);
    }
    throw new Error(errorMessage);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as UserListItem[];
};

export const useAllUsers = () => {
  const { user } = useAuth();
  const isAdmin = user?.email === 'adjebbar83@gmail.com';

  return useQuery<UserListItem[]>({
    queryKey: ['allUsers'],
    queryFn: fetchAllUsers,
    enabled: isAdmin, // Only fetch if the current user is an admin
  });
};