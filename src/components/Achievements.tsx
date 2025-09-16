"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { achievementsList } from "@/lib/achievements";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";

const Achievements = () => {
  const { t } = useTranslation();
  const { points } = useAuth();
  const { data: scanHistory } = useProfileData();
  const totalScans = scanHistory?.length ?? 0;
  const userStats = { points, totalScans };

  const toCamelCase = (str: string) => {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  };

  return (
    <Card className="max-w-4xl mx-auto bg-card/70 backdrop-blur-lg border">
      <CardHeader>
        <CardTitle>{t('profile.achievements')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 text-center">
          {achievementsList.map((achievement) => {
            const isUnlocked = achievement.condition(userStats);
            const nameKey = `achievements.${toCamelCase(achievement.id)}Name`;
            const descKey = `achievements.${toCamelCase(achievement.id)}Description`;
            
            return (
              <TooltipProvider key={achievement.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={cn(
                          "flex items-center justify-center w-16 h-16 rounded-full bg-muted transition-all",
                          isUnlocked ? "bg-primary/20 text-primary" : "opacity-40"
                        )}
                      >
                        <achievement.Icon className="w-8 h-8" />
                      </div>
                      <p className="text-xs font-medium truncate w-full">{t(nameKey)}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">{t(nameKey)}</p>
                    <p className="text-sm text-muted-foreground">{t(descKey)}</p>
                    {!isUnlocked && <p className="text-xs text-destructive">(Locked)</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default Achievements;