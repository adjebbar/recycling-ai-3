import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useProfileData } from './useProfileData';
import { challengesList, Challenge } from '@/lib/challenges';
import { showError, showSuccess } from '@/utils/toast';

export interface ChallengeStatus extends Challenge {
  isCompleted: boolean;
  isClaimed: boolean;
}

const fetchCompletedChallenges = async (userId: string | undefined): Promise<string[]> => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('completed_challenges')
    .select('challenge_id')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return data.map(c => c.challenge_id);
};

const claimChallenge = async ({ userId, challengeId }: { userId: string; challengeId: string }) => {
  const { error } = await supabase
    .from('completed_challenges')
    .insert({ user_id: userId, challenge_id: challengeId });
  if (error) throw new Error(error.message);
};

export const useChallenges = () => {
  const { user, points, addBonusPoints } = useAuth();
  const { data: scanHistory = [] } = useProfileData();
  const queryClient = useQueryClient();

  const { data: claimedChallenges = [], isLoading: isLoadingClaimed } = useQuery<string[]>({
    queryKey: ['completedChallenges', user?.id],
    queryFn: () => fetchCompletedChallenges(user?.id),
    enabled: !!user,
  });

  const claimMutation = useMutation({
    mutationFn: claimChallenge,
    onSuccess: async (_, variables) => {
      const challenge = challengesList.find(c => c.id === variables.challengeId);
      if (challenge) {
        await addBonusPoints(challenge.reward);
        showSuccess(`+${challenge.reward} points! Challenge complete!`);
      }
      queryClient.invalidateQueries({ queryKey: ['completedChallenges', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] }); // To update points
    },
    onError: (error) => {
      showError(`Failed to claim challenge: ${error.message}`);
    },
  });

  const challengeData: ChallengeStatus[] = challengesList.map(challenge => {
    const isCompleted = challenge.condition({ points, scanHistory });
    const isClaimed = claimedChallenges.includes(challenge.id);
    return { ...challenge, isCompleted, isClaimed };
  });

  return {
    challenges: challengeData,
    isLoading: isLoadingClaimed,
    claimChallenge: (challengeId: string) => {
      if (user) {
        claimMutation.mutate({ userId: user.id, challengeId });
      }
    },
    isClaiming: claimMutation.isPending,
  };
};