"use client";

import { useRewards } from "@/hooks/useRewards";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { showInfo, showError, showSuccess } from "@/utils/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from '@/lib/supabaseClient';
import { useRewardHistory } from "@/hooks/useRewardHistory";
import { Trophy } from "lucide-react";

const RewardsPage = () => {
  const { t } = useTranslation();
  const { data: rewards, isLoading: isLoadingRewards } = useRewards();
  const { data: rewardHistory, isLoading: isLoadingHistory } = useRewardHistory();
  const { points, user, deductPoints, refetchProfile } = useAuth();
  const [generatedVoucherCode, setGeneratedVoucherCode] = useState<string | null>(null);
  const [generatedQrCodeValue, setGeneratedQrCodeValue] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemedRewardName, setRedeemedRewardName] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const hasUnlockedAllRewards = useMemo(() => {
    if (!rewards || !rewardHistory || rewards.length === 0) {
      return false;
    }
    const availableRewardIds = new Set(rewards.map(r => r.id));
    const redeemedRewardIds = new Set(rewardHistory.map(h => h.reward_id));
    
    // Check if every available reward ID is in the set of redeemed reward IDs
    return [...availableRewardIds].every(id => redeemedRewardIds.has(id));
  }, [rewards, rewardHistory]);

  const handleRedeem = async (rewardName: string, cost: number, rewardId: number) => {
    if (!user) {
      showError("You must be logged in to redeem rewards.");
      return;
    }
    if (points < cost) {
      showError("Not enough points to redeem this reward.");
      return;
    }

    setIsRedeeming(true);
    setGeneratedVoucherCode(null);
    setGeneratedQrCodeValue(null);
    setRedeemedRewardName(rewardName);

    try {
      await deductPoints(cost);
      showSuccess(`You redeemed ${cost} points for ${rewardName}!`);

      const { data, error } = await supabase.functions.invoke('generate-voucher', {
        body: { points: cost, userId: user.id, rewardId: rewardId },
      });

      if (error) {
        let errorMessage = 'Voucher generation failed. Please try again.';
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

      setGeneratedVoucherCode(data.voucherCode);
      setGeneratedQrCodeValue(data.voucherToken);
      await refetchProfile();
      await queryClient.invalidateQueries({ queryKey: ['rewardHistory', user.id] });
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred.";
      console.error("Failed to redeem reward or generate voucher:", err);
      showError(`Redemption Error: ${errorMessage}`);
      setRedeemedRewardName(null);
    } finally {
      setIsRedeeming(false);
    }
  };

  const closeVoucherDialog = () => {
    setGeneratedVoucherCode(null);
    setRedeemedRewardName(null);
  };

  const isLoading = isLoadingRewards || isLoadingHistory;

  return (
    <div className="container mx-auto p-4 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('rewards.title', 'Rewards')}</h1>
        <p className="text-lg text-muted-foreground">
          {t('rewards.subtitle', 'Exchange your points for cool stuff!')}
        </p>
        {user && (
          <p className="text-xl font-semibold text-primary mt-2">
            {t('rewards.yourPoints', 'Your Points: {{count}}', { count: points })}
          </p>
        )}
      </div>

      {hasUnlockedAllRewards ? (
        <Card className="max-w-2xl mx-auto bg-card/70 backdrop-blur-lg border text-center p-8">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('rewards.allUnlockedTitle', 'Félicitations !')}</h2>
          <p className="text-muted-foreground">
            {t('rewards.allUnlockedDescription', 'Vous avez débloqué toutes les récompenses disponibles. Vous êtes un véritable champion du recyclage ! Revenez plus tard pour découvrir de nouvelles récompenses.')}
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-card/70 backdrop-blur-lg border">
                <CardHeader className="items-center text-center">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-6 w-3/4 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/2 mx-auto" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))
          ) : (
            rewards?.filter(reward => reward.name !== 'Clevent App Credit').map((reward) => (
              <Card key={reward.id} className="flex flex-col bg-card/70 backdrop-blur-lg border text-center">
                <CardHeader className="items-center">
                  <div className="text-4xl mb-2">{reward.icon}</div>
                  <CardTitle>{reward.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-2xl font-bold text-primary">{reward.cost.toLocaleString()} {t('rewards.points', 'points')}</p>
                </CardContent>
                <CardFooter>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        disabled={!user || points < reward.cost || isRedeeming}
                      >
                        {isRedeeming ? "Redeeming..." : (user ? (points < reward.cost ? t('rewards.notEnoughPoints', 'Not Enough Points') : t('rewards.redeem', 'Redeem')) : t('rewards.loginToRedeem', 'Login to Redeem'))}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Redeem for {reward.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will deduct {reward.cost} points from your account. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline">Cancel</Button>
                        </AlertDialogTrigger>
                        <AlertDialogAction onClick={() => handleRedeem(reward.name, reward.cost, reward.id)} disabled={isRedeeming}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Dialog to show the generated code */}
      <AlertDialog open={!!generatedVoucherCode} onOpenChange={closeVoucherDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Your {redeemedRewardName} Code</AlertDialogTitle>
            <AlertDialogDescription>
              Use the code below to claim your reward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 p-4 bg-muted rounded-md text-center">
            <p className="text-2xl font-mono font-bold tracking-widest">{generatedVoucherCode}</p>
          </div>
          <AlertDialogFooter>
            <Button onClick={closeVoucherDialog}>Close</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RewardsPage;