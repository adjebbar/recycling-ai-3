"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/context/AuthContext';
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { ScanLine } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import CommunityImpact from "@/components/CommunityImpact";
import RecyclingBenefits from "@/components/RecyclingBenefits";
import { useTranslation } from "react-i18next";
import { levels } from "@/lib/levels";
import RecyclingSymbols from "@/components/RecyclingSymbols"; // Import the new component

const Index = () => {
  const { t } = useTranslation();
  const { points, level } = useAuth();
  const animatedPoints = useAnimatedCounter(points);

  const nextLevel = useMemo(() => {
    if (!level) return null;
    return levels.find(l => l.level === level.level + 1);
  }, [level]);

  const progress = useMemo(() => {
    if (!level || !nextLevel) return 100;
    const levelPointRange = nextLevel.minPoints - level.minPoints;
    const pointsIntoLevel = points - level.minPoints;
    return (pointsIntoLevel / levelPointRange) * 100;
  }, [points, level, nextLevel]);

  return (
    <div className="min-h-screen w-full text-foreground overflow-x-hidden relative">
      {/* Top Half Background Image */}
      <div
        className="absolute top-0 left-0 w-full h-[50vh] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/backgrounds/recycling-machine.png')` }}
      />
      {/* Dark overlay without blur */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-black/60 to-transparent z-0" />
      
      {/* Page Content */}
      <div className="relative z-10">
        <section className="h-[50vh] flex items-center justify-center text-center pt-20 px-4 relative overflow-hidden rounded-xl bg-transparent shadow-none">
          <div
            className="max-w-3xl mx-auto animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-white drop-shadow-md">
              <span className="text-primary">{t('home.hero.recycle')}</span>{t('home.hero.earnRepeat')}
            </h1>
            <p className="text-lg md:text-xl text-white mb-8 max-w-2xl mx-auto drop-shadow-sm">
              {t('home.subtitle')}
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/scanner">
                <Button size="lg" className="text-lg px-10 py-7 rounded-full animate-subtle-pulse shadow-lg shadow-primary/50 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <ScanLine className="mr-3 h-6 w-6" />
                  {t('home.startScanning')}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Bottom Half Content */}
        <div className="bg-background py-16"> {/* This will be the new background for the bottom half */}
          <div className="container mx-auto p-4">
            <RecyclingSymbols /> {/* New component for recycling symbols */}

            <section
              className="max-w-3xl mx-auto mt-8 mb-16 animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <Card className="w-full bg-card/70 backdrop-blur-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                  <CardHeader>
                    <CardTitle>{t('home.yourPoints')}</CardTitle>
                    <CardDescription>Level {level?.level}: {level?.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-5xl font-bold text-primary">{animatedPoints}</p>
                  </CardContent>
                </Card>

                {nextLevel ? (
                  <Card className="w-full bg-card/70 backdrop-blur-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                    <CardHeader>
                      <CardTitle>Next Level: {nextLevel.name}</CardTitle>
                      <CardDescription>Reach {nextLevel.minPoints} points to level up!</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress value={progress} className="w-full mb-2" />
                      <p className="text-sm text-muted-foreground text-right">
                        {points.toLocaleString()} / {nextLevel.minPoints.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="w-full bg-card/70 backdrop-blur-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                    <CardHeader>
                      <CardTitle>Max Level Reached!</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">You are a true Planet Hero!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>

            <section className="animate-fade-in-up py-8 bg-background/70 rounded-xl mb-8" style={{ animationDelay: '0.6s' }}>
              <CommunityImpact />
            </section>

            <section className="animate-fade-in-up py-8 bg-background/90 rounded-xl" style={{ animationDelay: '0.8s' }}>
              <RecyclingBenefits />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;