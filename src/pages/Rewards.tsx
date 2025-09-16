"use client";

import { useRewards } from "@/hooks/useRewards";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { showInfo } from "@/utils/toast";
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
import { useState } from "react";

const RewardsPage = () => {
  const { t } = useTranslation();
  const { data: rewards, isLoading } = useRewards();
  const { points, user } = useAuth();
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleRedeem = (rewardName: string, cost: number) => {
    if (rewardName.toLowerCase().includes('clevent')) {
      // In a real app, you'd call a backend to generate and store a unique code.
      // For now, we'll simulate it.
      const code = `ECO-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      setGeneratedCode(code);
      // Here you would also deduct points from the user's account.
      showInfo(`You redeemed ${cost} points!`);
    } else {
      showInfo("This redeem functionality is coming soon!");
    }
  };

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
          rewards?.map((reward) => (
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
                      disabled={!user || points < reward.cost}
                    >
                      {user ? (points < reward.cost ? t('rewards.notEnoughPoints', 'Not Enough Points') : t('rewards.redeem', 'Redeem')) : t('rewards.loginToRedeem', 'Login to Redeem')}
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
                      <AlertDialogAction onClick={() => handleRedeem(reward.name, reward.cost)}>
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

      {/* Dialog to show the generated code */}
      <AlertDialog open={!!generatedCode} onOpenChange={() => setGeneratedCode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Your Clevent Credit Code</AlertDialogTitle>
            <AlertDialogDescription>
              Use the code below to recharge your Clevent app. Copy the code and paste it into the recharge field in the Clevent mobile app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 p-4 bg-muted rounded-md text-center">
            <p className="text-2xl font-mono font-bold tracking-widest">{generatedCode}</p>
          </div>
          <AlertDialogFooter>
            <Button onClick={() => setGeneratedCode(null)}>Close</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RewardsPage;