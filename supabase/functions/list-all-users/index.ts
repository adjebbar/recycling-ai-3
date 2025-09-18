// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Déclare Deno global pour TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define the expected type for profile data
interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

serve(async (req) => {
  console.log(`list-all-users function invoked. Method: ${req.method}`);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase environment variables are not set.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch users from auth.users directly to get email
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error(`Error fetching auth users: ${authError.message}`);
      throw new Error(`Failed to fetch auth users: ${authError.message}`);
    }

    const userIds = authUsers.users.map(u => u.id);

    // Fetch profiles for these users
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    if (profilesError) {
      console.error(`Error fetching profiles: ${profilesError.message}`);
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    // Cast profiles data to the defined interface
    const profileMap = new Map((profiles as ProfileData[]).map(p => [p.id, p]));

    const usersWithProfiles = authUsers.users.map(authUser => {
      const profile = profileMap.get(authUser.id);
      return {
        id: authUser.id,
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        email: authUser.email || null,
      };
    });

    return new Response(JSON.stringify(usersWithProfiles), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in list-all-users function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});