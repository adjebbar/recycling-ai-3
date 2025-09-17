"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { showError, showSuccess, showInfo } from '@/utils/toast';
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
  addPoints: (amount: number, barcode?: string) => Promise<AddPointsResult>;
  addBonusPoints: (amount: number) => Promise<void>;
  deductPoints: (amount: number) => Promise<void>;
  resetCommunityStats: () => Promise<void>;
  fetchCommunityStats: () => Promise<void>;
  resetAnonymousPoints: () => void;
  refetchProfile: () => Promise<void>;
  loading: boolean;
}

interface AddPointsResult {
  pointsEarned: number;
  newTotalPoints: number;
  newTotalScans: number;
  leveledUpTo?: Level;
  unlockedAchievements: string[];
  isAnonymous: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as true to indicate initial auth check

  const [points, setPoints] = useState(0);
  const [totalScans, setTotalScouns] = useState(0);
  const [level, setLevel] = useState<Level | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [anonymousPoints, setAnonymousPoints] = useState(0);
  const [totalBottlesRecycled, setTotalBottlesRecycled] = useState(0);
  const [activeRecyclers, setActiveRecyclers] = useState(0);
  const { fire: fireConfetti } = useConfetti();

  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userRef = useRef<User | null>(null); // To keep track of the *actual* user object processed

  const logoutDueToInactivity = useCallback(async () => {
    if (user) {
      console.log("AuthContext: Logging out due to inactivity for user:", user.email);
      await supabase.auth.signOut();
      showInfo("Vous avez été déconnecté en raison de l'inactivité.");
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
      inactivityTimeoutRef.current = null;
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
      .select('active_recyclers, total_bottles_recycled')
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
      .select('points, first_name, last_name, total_scans')
      .eq('id', currentUser.id)
      .single();

    if (profileError) {
      console.error('AuthContext: Error fetching user profile:', profileError);
      return null;
    }
    console.log("AuthContext: Profile fetched:", profile);
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
        setTotalScouns(profileAndStats.totalScans || 0);
        setLevel(getLevelFromPoints(profileAndStats.points || 0));
        console.log("AuthContext: Profile refetched and state updated.");
      } else {
        console.warn("AuthContext: Refetch profile failed, keeping current state.");
      }
    }
  }, [user, fetchUserProfile]);

  useEffect(() => {
    console.log("AuthContext useEffect: Initializing...");
    // `loading` is already true by default.
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
      setLoading(true); // Ensure loading is true at the start of any auth state change processing

      const newCurrentUser = session?.user ?? null;
      const hasUserIdChanged = userRef.current?.id !== newCurrentUser?.id;

      let currentPoints = 0;
      let currentTotalScans = 0;
      let currentFirstName: string | null = null;
      let currentLastName: string | null = null;
      let currentLevel: Level | null = null;

      if (newCurrentUser) {
        const profileAndStats = await fetchUserProfile(newCurrentUser);
        currentPoints = profileAndStats?.points || 0;
        currentTotalScans = profileAndStats?.totalScans || 0;
        currentFirstName = profileAndStats?.first_name || null;
        currentLastName = profileAndStats?.last_name || null;
        currentLevel = getLevelFromPoints(currentPoints);

        // Handle anonymous points merge if a user just signed in or user ID changed
        if (hasUserIdChanged || _event === 'SIGNED_IN') {
          const localPoints = Number(localStorage.getItem('anonymousPoints') || '0');
          if (localPoints > 0) {
            showSuccess(`Merging ${localPoints} saved points to your account!`);
            currentPoints += localPoints;
            await supabase.from('profiles').update({ points: currentPoints }).eq('id', newCurrentUser.id);
            localStorage.removeItem('anonymousPoints');
            setAnonymousPoints(0); // Clear anonymous points
            currentLevel = getLevelFromPoints(currentPoints); // Recalculate level
            console.log("AuthContext: Merged anonymous points.");
          }
        }
      } else {
        // User is logged out, retrieve anonymous points if any
        currentPoints = Number(localStorage.getItem('anonymousPoints') || '0');
        setAnonymousPoints(currentPoints); // Ensure anonymousPoints state is updated
      }

      // Update all states at once after all async operations
      setSession(session);
      setUser(newCurrentUser);
      userRef.current = newCurrentUser; // Update the ref

      setPoints(currentPoints);
      setTotalScouns(currentTotalScans);
      setFirstName(currentFirstName);
      setLastName(currentLastName);
      setLevel(currentLevel);
      
      setLoading(false); // End loading state after all processing
      resetInactivityTimer(); // Reset timer on any auth state change
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
  }, [fetchCommunityStats, fetchUserProfile, resetInactivityTimer]);

  const addPoints = async (amount: number, barcode?: string): Promise<AddPointsResult> => {
    console.log("AuthContext: addPoints called. User:", user?.email || "anonymous", "Amount:", amount);
    let result: AddPointsResult = {
      pointsEarned: amount,
      newTotalPoints: points, // Will be updated
      newTotalScans: totalScans, // Will be updated
      unlockedAchievements: [],
      isAnonymous: !user,
    };

    if (user) {
      const oldStats = { points, totalScans };
      const oldLevel = getLevelFromPoints(points);
      
      const newPoints = points + amount;
      const newTotalScans = totalScans + 1;
      const newLevel = getLevelFromPoints(newPoints);

      setPoints(newPoints);
      setTotalScouns(newTotalScans);
      setLevel(newLevel);
      console.log("AuthContext: Optimistically updated points and scans for user.");

      if (newLevel.level > oldLevel.level) {
        fireConfetti();
        result.leveledUpTo = newLevel;
        console.log("AuthContext: Leveled up!");
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ points: newPoints, total_scans: newTotalScans })
        .eq('id', user.id);
      
      if (profileUpdateError) {
        setPoints(points);
        setTotalScouns(totalScans);
        setLevel(oldLevel);
        showError("Failed to update your points and scan count.");
        console.error("AuthContext: Failed to update profile:", profileUpdateError.message);
        throw profileUpdateError;
      }
      
      const { error: scanHistoryError } = await supabase.from('scan_history').insert({ user_id: user.id, points_earned: amount, product_barcode: barcode });
      if (scanHistoryError) {
        setPoints(points);
        setTotalScouns(totalScans);
        setLevel(oldLevel);
        console.error("AuthContext: Failed to record scan history:", scanHistoryError.message);
        showError("Failed to record scan history.");
        throw scanHistoryError;
      }
      console.log("AuthContext: Profile and scan history updated in DB.");

      await refetchProfile();
      
      const newStats = { points: newPoints, totalScans: newTotalScans };
      achievementsList.forEach(achievement => {
        if (!achievement.condition(oldStats) && achievement.condition(newStats)) {
          fireConfetti();
          result.unlockedAchievements.push(achievement.id);
          console.log("AuthContext: Achievement unlocked!");
        }
      });
      result.newTotalPoints = newPoints;
      result.newTotalScans = newTotalScans;

    } else {
      const newAnonymousPoints = anonymousPoints + amount;
      setAnonymousPoints(newAnonymousPoints);
      localStorage.setItem('anonymousPoints', String(newAnonymousPoints));
      console.log("AuthContext: Anonymous points updated:", newAnonymousPoints);
      result.newTotalPoints = newAnonymousPoints;
      result.newTotalScans = 0;
    }

    try {
      const { error: edgeFunctionError } = await supabase.functions.invoke('increment-community-bottles');
      if (edgeFunctionError) {
        console.error("AuthContext: Failed to increment community bottles via edge function:", edgeFunctionError.message);
        showError("Failed to update global recycling count.");
      } else {
        setTotalBottlesRecycled(prev => prev + 1);
        console.log("AuthContext: Community bottles incremented.");
      }
    } catch (err) {
      console.error("AuthContext: Error invoking increment-community-bottles edge function:", err);
      showError("Error updating global recycling count.");
    }
    resetInactivityTimer();
    return result;
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
      setPoints(points);
      setLevel(oldLevel);
      showError("Failed to deduct points.");
      console.error("AuthContext: Failed to update profile with deducted points:", error.message);
      throw error;
    }
    console.log("AuthContext: Points deducted in DB.");
    resetInactivityTimer();
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
    resetInactivityTimer();
  };

  const resetCommunityStats = async () => {
    console.log("AuthContext: resetCommunityStats called.");
    await supabase.from('community_stats').update({ active_recyclers: 0, total_bottles_recycled: 0 }).eq('id', 1);
    await supabase.from('profiles').update({ total_scans: 0, points: 0 });
    await supabase.from('scan_history').delete().neq('id', 0);

    await fetchCommunityStats();
    await refetchProfile();
    showSuccess("Community stats have been reset.");
    console.log("AuthContext: Community stats reset complete.");
    resetInactivityTimer();
  };

  const resetAnonymousPoints = () => {
    console.log("AuthContext: resetAnonymousPoints called.");
    localStorage.removeItem('anonymousPoints');
    setAnonymousPoints(0);
    showSuccess("Your session score has been reset.");
    resetInactivityTimer();
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
    deductPoints,
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