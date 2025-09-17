"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { showError, showSuccess, showInfo } from '@/utils/toast'; // Added showInfo
import { useConfetti } from '@/components/ConfettiProvider';
import { achievementsList } from '@/lib/achievements';
import { getLevelFromPoints, Level } from '@/lib/levels';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  points: number;
  totalScans: number;
  level: Level | null;
  firstName: string | null;
  lastName: string | null;
  totalBottlesRecycled: number;
  activeRecyclers: number;
  addPoints: (amount: number, barcode?: string) => Promise<void>;
  addBonusPoints: (amount: number) => Promise<void>;
  resetCommunityStats: () => Promise<void>;
  fetchCommunityStats: () => Promise<void>;
  resetAnonymousPoints: () => void;
  refetchProfile: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [points, setPoints] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [level, setLevel] = useState<Level | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [anonymousPoints, setAnonymousPoints] = useState(0);
  const [totalBottlesRecycled, setTotalBottlesRecycled] = useState(0);
  const [activeRecyclers, setActiveRecyclers] = useState(0);
  const { fire: fireConfetti } = useConfetti();

  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logoutDueToInactivity = useCallback(async () => {
    if (user) {
      await supabase.auth.signOut();
      showInfo("Vous avez été déconnecté en raison de l'inactivité.");
    }
  }, [user]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    if (user) { // Only set timer if a user is logged in
      inactivityTimeoutRef.current = setTimeout(logoutDueToInactivity, INACTIVITY_TIMEOUT_MS);
    }
  }, [user, logoutDueToInactivity]);

  const fetchCommunityStats = useCallback(async () => {
    const { data: communityData, error: communityError } = await supabase
      .from('community_stats')
      .select('active_recyclers, total_bottles_recycled') // Fetch both
      .eq('id', 1)
      .single();

    if (communityError) {
      console.error('Error fetching community stats:', communityError.message);
      setActiveRecyclers(0);
      setTotalBottlesRecycled(0);
    } else if (communityData) {
      setActiveRecyclers(communityData.active_recyclers);
      setTotalBottlesRecycled(communityData.total_bottles_recycled || 0);
    }
  }, []);

  const fetchUserProfile = useCallback(async (currentUser: User) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points, first_name, last_name, total_scans') // Also fetch total_scans from profile
      .eq('id', currentUser.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }
    
    // totalScans is now directly from the profile table
    return { ...profile, totalScans: profile?.total_scans ?? 0 };
  }, []);

  const refetchProfile = useCallback(async () => {
    if (user) {
      const profileAndStats = await fetchUserProfile(user);
      if (profileAndStats) {
        setPoints(profileAndStats.points || 0);
        setFirstName(profileAndStats.first_name || null);
        setLastName(profileAndStats.last_name || null);
        setTotalScans(profileAndStats.totalScans || 0);
        setLevel(getLevelFromPoints(profileAndStats.points || 0));
      } else {
        console.warn("Refetch profile failed, keeping current state.");
      }
    }
  }, [user, fetchUserProfile]);

  const fetchAndSetData = useCallback(async (userToFetch: User | null) => {
    if (userToFetch) {
      const profileAndStats = await fetchUserProfile(userToFetch);
      let currentPoints = profileAndStats?.points || 0;
      let currentTotalScans = profileAndStats?.totalScans || 0;
      
      const localPoints = Number(localStorage.getItem('anonymousPoints') || '0');
      if (localPoints > 0) {
        showSuccess(`Merging ${localPoints} saved points to your account!`);
        currentPoints += localPoints;
        // Note: We are not merging anonymous scans into total_scans here, only points.
        // If anonymous scans should also merge, additional logic would be needed.
        await supabase.from('profiles').update({ points: currentPoints }).eq('id', userToFetch.id);
        localStorage.removeItem('anonymousPoints');
        setAnonymousPoints(0);
      }

      setPoints(currentPoints);
      setFirstName(profileAndStats?.first_name || null);
      setLastName(profileAndStats?.last_name || null);
      setTotalScans(currentTotalScans);
      setLevel(getLevelFromPoints(currentPoints));
    } else {
      // User is logged out
      setPoints(0);
      setTotalScans(0);
      setLevel(null);
      setFirstName(null);
      setLastName(null);
      const localPoints = Number(localStorage.getItem('anonymousPoints') || '0');
      setAnonymousPoints(localPoints);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    setLoading(true);
    fetchCommunityStats();

    const channel = supabase
      .channel('community-stats-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'community_stats', filter: 'id=eq.1' },
        (payload) => {
          const newStats = payload.new as { active_recyclers: number, total_bottles_recycled: number };
          if (newStats) {
            setActiveRecyclers(newStats.active_recyclers);
            setTotalBottlesRecycled(newStats.total_bottles_recycled);
          }
        }
      )
      .subscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setSession(session);
      setUser(currentUser);
      await fetchAndSetData(currentUser);
      setLoading(false);
      resetInactivityTimer(); // Reset timer on auth state change
    });

    // Setup activity listeners
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));
    resetInactivityTimer(); // Initial setup of the timer

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
    };
  }, [fetchCommunityStats, fetchAndSetData, resetInactivityTimer]);

  const addPoints = async (amount: number, barcode?: string) => {
    if (user) {
      const oldStats = { points, totalScans };
      const oldLevel = getLevelFromPoints(points);
      
      // Optimistically update local state for immediate feedback
      const newPoints = points + amount;
      const newTotalScans = totalScans + 1;
      const newLevel = getLevelFromPoints(newPoints);

      setPoints(newPoints);
      setTotalScans(newTotalScans);
      setLevel(newLevel);

      if (newLevel.level > oldLevel.level) {
        fireConfetti();
        showSuccess(`🎉 Leveled Up to ${newLevel.name}! 🎉`);
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ points: newPoints, total_scans: newTotalScans }) // Update total_scans in profile
        .eq('id', user.id);
      
      if (profileUpdateError) {
        // Revert local state if profile update fails
        setPoints(points);
        setTotalScans(totalScans);
        setLevel(oldLevel);
        showError("Failed to update your points and scan count.");
        return;
      }
      
      const { error: scanHistoryError } = await supabase.from('scan_history').insert({ user_id: user.id, points_earned: amount, product_barcode: barcode });
      if (scanHistoryError) {
        // Revert local state if scan history fails
        setPoints(points);
        setTotalScans(totalScans);
        setLevel(oldLevel);
        console.error("Failed to record scan history:", scanHistoryError.message);
        showError("Failed to record scan history.");
        return;
      }

      // After successful database updates, re-fetch profile to ensure full consistency
      await refetchProfile();
      // await fetchCommunityStats(); // Re-fetch community stats to update total bottles recycled - now handled by edge function
      
      const newStats = { points: newPoints, totalScans: newTotalScans };
      achievementsList.forEach(achievement => {
        if (!achievement.condition(oldStats) && achievement.condition(newStats)) {
          fireConfetti();
          showSuccess("🎉 Achievement Unlocked! 🎉");
        }
      });
    } else {
      const newAnonymousPoints = anonymousPoints + amount;
      setAnonymousPoints(newAnonymousPoints);
      localStorage.setItem('anonymousPoints', String(newAnonymousPoints));
    }

    // Increment global total bottles recycled via Edge Function for all scans
    try {
      const { error: edgeFunctionError } = await supabase.functions.invoke('increment-community-bottles');
      if (edgeFunctionError) {
        console.error("Failed to increment community bottles via edge function:", edgeFunctionError.message);
        showError("Failed to update global recycling count.");
      } else {
        // Optimistically update local state for community total
        setTotalBottlesRecycled(prev => prev + 1);
      }
    } catch (err) {
      console.error("Error invoking increment-community-bottles edge function:", err);
      showError("Error updating global recycling count.");
    }
    resetInactivityTimer(); // Reset timer on activity
  };

  const addBonusPoints = async (amount: number) => {
    if (!user) return;
    const oldLevel = getLevelFromPoints(points);
    const newPoints = points + amount;
    const newLevel = getLevelFromPoints(newPoints);
    
    setPoints(newPoints);
    setLevel(newLevel);

    if (newLevel.level > oldLevel.level) {
      fireConfetti();
      showSuccess(`🎉 Leveled Up to ${newLevel.name}! 🎉`);
    }

    const { error } = await supabase.from('profiles').update({ points: newPoints }).eq('id', user.id);
    if (error) {
      setPoints(points);
      setLevel(oldLevel);
      showError("Failed to claim bonus points.");
      throw error;
    }
    resetInactivityTimer(); // Reset timer on activity
  };

  const resetCommunityStats = async () => {
    // Reset active recyclers and total_bottles_recycled in community_stats
    await supabase.from('community_stats').update({ active_recyclers: 0, total_bottles_recycled: 0 }).eq('id', 1);
    // Reset total_scans for all profiles
    await supabase.from('profiles').update({ total_scans: 0, points: 0 });
    // Clear scan history
    await supabase.from('scan_history').delete().neq('id', 0); // Delete all records

    await fetchCommunityStats();
    await refetchProfile(); // Also refetch current user's profile
    resetInactivityTimer(); // Reset timer on activity
  };

  const resetAnonymousPoints = () => {
    localStorage.removeItem('anonymousPoints');
    setAnonymousPoints(0);
    showSuccess("Your session score has been reset.");
    resetInactivityTimer(); // Reset timer on activity
  };

  const value = {
    session,
    user,
    points: user ? points : anonymousPoints,
    totalScans: user ? totalScans : 0,
    level,
    firstName,
    lastName,
    totalBottlesRecycled,
    activeRecyclers,
    addPoints,
    addBonusPoints,
    resetCommunityStats,
    fetchCommunityStats,
    resetAnonymousPoints,
    refetchProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};