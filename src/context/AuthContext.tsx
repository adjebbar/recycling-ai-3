"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { showError, showSuccess } from '@/utils/toast';
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

  const fetchCommunityStats = useCallback(async () => {
    const { data, error } = await supabase
      .from('community_stats')
      .select('total_bottles_recycled, active_recyclers')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error fetching community stats:', error.message);
    } else if (data) {
      setTotalBottlesRecycled(data.total_bottles_recycled);
      setActiveRecyclers(data.active_recyclers);
    }
  }, []);

  const fetchUserProfile = useCallback(async (currentUser: User) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points, first_name, last_name')
      .eq('id', currentUser.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    const { count, error: countError } = await supabase
      .from('scan_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id);
    
    if (countError) {
      console.error('Error fetching scan count:', countError);
      return { ...profile, totalScans: 0 };
    }

    return { ...profile, totalScans: count ?? 0 };
  }, []);

  const fetchAndSetData = useCallback(async (userToFetch: User | null) => {
    if (userToFetch) {
      const profileAndStats = await fetchUserProfile(userToFetch);
      let currentPoints = profileAndStats?.points || 0;
      
      const localPoints = Number(localStorage.getItem('anonymousPoints') || '0');
      if (localPoints > 0) {
        showSuccess(`Merging ${localPoints} saved points to your account!`);
        currentPoints += localPoints;
        await supabase.from('profiles').update({ points: currentPoints }).eq('id', userToFetch.id);
        localStorage.removeItem('anonymousPoints');
        setAnonymousPoints(0);
      }

      setPoints(currentPoints);
      setFirstName(profileAndStats?.first_name || null);
      setLastName(profileAndStats?.last_name || null);
      setTotalScans(profileAndStats?.totalScans || 0);
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
    let incrementTimeoutId: ReturnType<typeof setTimeout>;

    const scheduleIncrement = () => {
      // Schedule next increment after a random delay (e.g., 3 to 11 seconds)
      const randomInterval = Math.random() * 8000 + 3000;
      incrementTimeoutId = setTimeout(() => {
        setActiveRecyclers(prevRecyclers => prevRecyclers + 1);
        scheduleIncrement(); // Schedule the next one
      }, randomInterval);
    };

    fetchCommunityStats().then(() => {
      // Start the continuous increment after fetching initial stats
      scheduleIncrement();
    });

    const channel = supabase
      .channel('community-stats-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'community_stats', filter: 'id=eq.1' },
        (payload) => {
          const newStats = payload.new as { total_bottles_recycled: number; active_recyclers: number };
          if (newStats) {
            setTotalBottlesRecycled(newStats.total_bottles_recycled);
            // When stats are updated (e.g., reset from admin), clear the scheduled increment
            // and restart it with the new base value.
            clearTimeout(incrementTimeoutId);
            setActiveRecyclers(newStats.active_recyclers);
            scheduleIncrement();
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
    });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
      clearTimeout(incrementTimeoutId); // Clean up on unmount
    };
  }, [fetchCommunityStats, fetchAndSetData]);

  const addPoints = async (amount: number, barcode?: string) => {
    const { error: statsError } = await supabase.rpc('increment_total_bottles');
    if (statsError) {
      console.error("Failed to update community stats:", statsError.message);
    }

    if (user) {
      const oldStats = { points, totalScans };
      const oldLevel = getLevelFromPoints(points);
      const newPoints = points + amount;
      const newLevel = getLevelFromPoints(newPoints);
      const newTotalScans = totalScans + 1;

      setPoints(newPoints);
      setTotalScans(newTotalScans);
      setLevel(newLevel);

      if (newLevel.level > oldLevel.level) {
        fireConfetti();
        showSuccess(`🎉 Leveled Up to ${newLevel.name}! 🎉`);
      }

      const { error } = await supabase.from('profiles').update({ points: newPoints }).eq('id', user.id);
      if (error) {
        setPoints(points);
        setTotalScans(totalScans);
        setLevel(oldLevel);
        showError("Failed to update your points.");
        return;
      }
      await supabase.from('scan_history').insert({ user_id: user.id, points_earned: amount, product_barcode: barcode });

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
  };

  const resetCommunityStats = async () => {
    await supabase.from('community_stats').update({ total_bottles_recycled: 0, active_recyclers: 0 }).eq('id', 1);
    await fetchCommunityStats();
  };

  const resetAnonymousPoints = () => {
    localStorage.removeItem('anonymousPoints');
    setAnonymousPoints(0);
    showSuccess("Your session score has been reset.");
  };

  const refetchProfile = useCallback(async () => {
    if (user) {
      const profileAndStats = await fetchUserProfile(user);
      setPoints(profileAndStats?.points || 0);
      setFirstName(profileAndStats?.first_name || null);
      setLastName(profileAndStats?.last_name || null);
      setTotalScans(profileAndStats?.totalScans || 0);
      setLevel(getLevelFromPoints(profileAndStats?.points || 0));
    }
  }, [user, fetchUserProfile]);

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