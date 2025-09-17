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
  deductPoints: (amount: number) => Promise<void>; // New function
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
      console.log("AuthContext: Logging out due to inactivity for user:", user.email);
      await supabase.auth.signOut();
      showInfo("Vous avez été déconnecté en raison de l'inactivité.");
      // Clear the timer immediately after signing out to prevent it from firing again
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
    }
  }, [user]);

  const resetInactivityTimer = useCallback(() => {
    console.log("AuthContext: resetInactivityTimer called. Current user:", user?.email || "null");
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null; // Clear it explicitly
    }
    if (user) { // Only set timer if a user is logged in
      inactivityTimeoutRef.current = setTimeout(logoutDueToInactivity, INACTIVITY_TIMEOUT_MS);
      console.log("AuthContext: Inactivity timer set for user:", user.email);
    } else {
      console.log("AuthContext: No user logged in, not setting inactivity timer.");
    }
  }, [user, logoutDueToInactivity]);

  const fetchCommunityStats = useCallback(async () => {
    console.log("AuthContext: Fetching community stats...");
    const { data: communityData, error: communityError } = await supabase
      .from('community_stats')
      .select('active_recyclers, total_bottles_recycled') // Fetch both
      .eq('id', 1)
      .single();

    if (communityError) {
      console.error('AuthContext: Error fetching community stats:', communityError.message);
      setActiveRecyclers(0);
      setTotalBottlesRecycled(0);
    } else if (communityData) {
      setActiveRecyclers(communityData.active_recyclers);
      setTotalBottlesRecycled(communityData.total_bottles_recycled || 0);
      console.log("AuthContext: Community stats fetched:", communityData);
    }
  }, []);

  const fetchUserProfile = useCallback(async (currentUser: User) => {
    console.log("AuthContext: Fetching profile for user:", currentUser.email);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points, first_name, last_name, total_scans') // Also fetch total_scans from profile
      .eq('id', currentUser.id)
      .single();

    if (profileError) {
      console.error('AuthContext: Error fetching user profile:', profileError);
      return null;
    }
    console.log("AuthContext: Profile fetched:", profile);
    // totalScans is now directly from the profile table
    return { ...profile, totalScans: profile?.total_scans ?? 0 };
  }, []);

  const refetchProfile = useCallback(async () => {
    console.log("AuthContext: refetchProfile called.");
    if (user) {
      const profileAndStats = await fetchUserProfile(user);
      if (profileAndStats) {
        setPoints(profileAndStats.points || 0);
        setFirstName(profileAndStats.first_name || null);
        setLastName(profileAndStats.last_name || null);
        setTotalScans(profileAndStats.totalScans || 0);
        setLevel(getLevelFromPoints(profileAndStats.points || 0));
        console.log("AuthContext: Profile refetched and state updated.");
      } else {
        console.warn("AuthContext: Refetch profile failed, keeping current state.");
      }
    }
  }, [user, fetchUserProfile]);

  const fetchAndSetData = useCallback(async (userToFetch: User | null) => {
    console.log("AuthContext: fetchAndSetData called with user:", userToFetch?.email || "null");
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
        console.log("AuthContext: Merged anonymous points.");
      }

      setPoints(currentPoints);
      setFirstName(profileAndStats?.first_name || null);
      setLastName(profileAndStats?.last_name || null);
      setTotalScans(currentTotalScans);
      setLevel(getLevelFromPoints(currentPoints));
      console.log("AuthContext: User data set for logged-in user.");
    } else {
      // User is logged out
      setPoints(0);
      setTotalScans(0);
      setLevel(null);
      setFirstName(null);
      setLastName(null);
      const localPoints = Number(localStorage.getItem('anonymousPoints') || '0');
      setAnonymousPoints(localPoints);
      console.log("AuthContext: User data set for logged-out state.");
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    console.log("AuthContext useEffect: Initializing...");
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
            console.log("AuthContext: Community stats updated via real-time:", newStats);
          }
        }
      )
      .subscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("AuthContext: Auth State Change Event:", _event, "Session:", session);
      const currentUser = session?.user ?? null;
      setSession(session);
      setUser(currentUser);
      await fetchAndSetData(currentUser);
      setLoading(false);
      resetInactivityTimer(); // Reset timer on auth state change
    });

    // Setup activity listeners
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    const activityListener = () => {
      console.log("AuthContext: Activity detected, resetting inactivity timer.");
      resetInactivityTimer();
    };
    events.forEach(event => window.addEventListener(event, activityListener));
    resetInactivityTimer(); // Initial setup of the timer

    return () => {
      console.log("AuthContext useEffect: Cleaning up...");
      subscription.unsubscribe();
      supabase.removeChannel(channel);
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      events.forEach(event => window.removeEventListener(event, activityListener));
    };
  }, [fetchCommunityStats, fetchAndSetData, resetInactivityTimer]);

  const addPoints = async (amount: number, barcode?: string) => {
    console.log("AuthContext: addPoints called. User:", user?.email || "anonymous", "Amount:", amount);
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
      console.log("AuthContext: Optimistically updated points and scans for user.");

      if (newLevel.level > oldLevel.level) {
        fireConfetti();
        showSuccess(`🎉 Leveled Up to ${newLevel.name}! 🎉`);
        console.log("AuthContext: Leveled up!");
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
        console.error("AuthContext: Failed to update profile:", profileUpdateError.message);
        return;
      }
      
      const { error: scanHistoryError } = await supabase.from('scan_history').insert({ user_id: user.id, points_earned: amount, product_barcode: barcode });
      if (scanHistoryError) {
        // Revert local state if scan history fails
        setPoints(points);
        setTotalScans(totalScans);
        setLevel(oldLevel);
        console.error("AuthContext: Failed to record scan history:", scanHistoryError.message);
        showError("Failed to record scan history.");
        return;
      }
      console.log("AuthContext: Profile and scan history updated in DB.");

      // After successful database updates, re-fetch profile to ensure full consistency
      await refetchProfile();
      // await fetchCommunityStats(); // Re-fetch community stats to update total bottles recycled - now handled by edge function
      
      const newStats = { points: newPoints, totalScans: newTotalScans };
      achievementsList.forEach(achievement => {
        if (!achievement.condition(oldStats) && achievement.condition(newStats)) {
          fireConfetti();
          showSuccess("🎉 Achievement Unlocked! 🎉");
          console.log("AuthContext: Achievement unlocked!");
        }
      });
    } else {
      const newAnonymousPoints = anonymousPoints + amount;
      setAnonymousPoints(newAnonymousPoints);
      localStorage.setItem('anonymousPoints', String(newAnonymousPoints));
      console.log("AuthContext: Anonymous points updated:", newAnonymousPoints);
    }

    // Increment global total bottles recycled via Edge Function for all scans
    try {
      const { error: edgeFunctionError } = await supabase.functions.invoke('increment-community-bottles');
      if (edgeFunctionError) {
        console.error("AuthContext: Failed to increment community bottles via edge function:", edgeFunctionError.message);
        showError("Failed to update global recycling count.");
      } else {
        // Optimistically update local state for community total
        setTotalBottlesRecycled(prev => prev + 1);
        console.log("AuthContext: Community bottles incremented.");
      }
    } catch (err) {
      console.error("AuthContext: Error invoking increment-community-bottles edge function:", err);
      showError("Error updating global recycling count.");
    }
    resetInactivityTimer(); // Reset timer on activity
  };

  const deductPoints = async (amount: number) => {
    console.log("AuthContext: deductPoints called. User:", user?.email, "Amount:", amount);
    if (!user) {
      showError("You must be logged in to deduct points.");
      return;
    }

    if (points < amount) {
      showError("Not enough points to complete this action.");
      return;
    }

    const oldLevel = getLevelFromPoints(points);
    const newPoints = points - amount;
    const newLevel = getLevelFromPoints(newPoints);

    setPoints(newPoints);
    setLevel(newLevel);
    console.log("AuthContext: Optimistically updated points after deduction.");

    const { error } = await supabase.from('profiles').update({ points: newPoints }).eq('id', user.id);
    if (error) {
      setPoints(points); // Revert if DB update fails
      setLevel(oldLevel);
      showError("Failed to deduct points.");
      console.error("AuthContext: Failed to update profile with deducted points:", error.message);
      throw error;
    }
    console.log("AuthContext: Points deducted in DB.");
    resetInactivityTimer(); // Reset timer on activity
  };

  const addBonusPoints = async (amount: number) => {
    console.log("AuthContext: addBonusPoints called. User:", user?.email, "Amount:", amount);
    if (!user) return;
    const oldLevel = getLevelFromPoints(points);
    const newPoints = points + amount;
    const newLevel = getLevelFromPoints(newPoints);
    
    setPoints(newPoints);
    setLevel(newLevel);
    console.log("AuthContext: Optimistically updated bonus points for user.");

    if (newLevel.level > oldLevel.level) {
      fireConfetti();
      showSuccess(`🎉 Leveled Up to ${newLevel.name}! 🎉`);
      console.log("AuthContext: Leveled up with bonus points!");
    }

    const { error } = await supabase.from('profiles').update({ points: newPoints }).eq('id', user.id);
    if (error) {
      setPoints(points);
      setLevel(oldLevel);
      showError("Failed to claim bonus points.");
      console.error("AuthContext: Failed to update profile with bonus points:", error.message);
      throw error;
    }
    console.log("AuthContext: Bonus points updated in DB.");
    resetInactivityTimer(); // Reset timer on activity
  };

  const resetCommunityStats = async () => {
    console.log("AuthContext: resetCommunityStats called.");
    // Reset active recyclers and total_bottles_recycled in community_stats
    await supabase.from('community_stats').update({ active_recyclers: 0, total_bottles_recycled: 0 }).eq('id', 1);
    // Reset total_scans for all profiles
    await supabase.from('profiles').update({ total_scans: 0, points: 0 });
    // Clear scan history
    await supabase.from('scan_history').delete().neq('id', 0); // Delete all records

    await fetchCommunityStats();
    await refetchProfile(); // Also refetch current user's profile
    showSuccess("Community stats have been reset.");
    console.log("AuthContext: Community stats reset complete.");
    resetInactivityTimer(); // Reset timer on activity
  };

  const resetAnonymousPoints = () => {
    console.log("AuthContext: resetAnonymousPoints called.");
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
    deductPoints, // New function
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