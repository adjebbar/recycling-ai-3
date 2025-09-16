"use client";

import { useRewards } from "@/hooks/useRewards";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { showInfo } from "@/utils/toast";

const RewardsPage = () => {
  const { t } = useTranslation();
  const { data: rewards, isLoading } = useRewards();
  const { points, user } = useAuth();

  const handleRedeem = () => {
    showInfo("Redeem functionality is coming soon!");
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
                <Button 
                  className="w-full" 
                  onClick={handleRedeem}
                  disabled={!user || points < reward.cost}
                >
                  {user ? (points < reward.cost ? t('rewards.notEnoughPoints', 'Not Enough Points') : t('rewards.redeem', 'Redeem')) : t('rewards.loginToRedeem', 'Login to Redeem')}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RewardsPage;