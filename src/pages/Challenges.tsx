"use client";

import { useChallenges } from "@/hooks/useChallenges";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

const ChallengesPage = () => {
  const { t } = useTranslation();
  const { challenges, isLoading, claimChallenge, isClaiming } = useChallenges();

  return (
    <div className="container mx-auto p-4 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('challenges.title')}</h1>
        <p className="text-lg text-muted-foreground">
          {t('challenges.subtitle')}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card/70 backdrop-blur-lg border">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))
        ) : (
          challenges.map((challenge) => (
            <Card key={challenge.id} className="flex flex-col bg-card/70 backdrop-blur-lg border">
              <CardHeader className="flex-grow">
                <CardTitle>{challenge.title}</CardTitle>
                <CardDescription>{challenge.description}</CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-between items-center">
                <span className="font-bold text-primary">+{challenge.reward} {t('challenges.points')}</span>
                {challenge.isClaimed ? (
                  <Button disabled variant="ghost" className="text-green-500">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {t('challenges.claimed')}
                  </Button>
                ) : challenge.isCompleted ? (
                  <Button onClick={() => claimChallenge(challenge.id)} disabled={isClaiming}>
                    {t('challenges.claim')}
                  </Button>
                ) : (
                  <Button disabled variant="outline">
                    <Lock className="mr-2 h-4 w-4" />
                    {t('challenges.locked')}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ChallengesPage;