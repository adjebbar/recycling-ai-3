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
  // Fetch users from auth.users directly to get email, then join with profiles for names
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    throw new Error(`Failed to fetch auth users: ${authError.message}`);
  }

  const userIds = authUsers.users.map(u => u.id);

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', userIds);

  if (profilesError) {
    throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
  }

  const profileMap = new Map(profiles.map(p => [p.id, p]));

  return authUsers.users.map(authUser => {
    const profile = profileMap.get(authUser.id);
    return {
      id: authUser.id,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
      email: authUser.email || null,
    };
  });
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