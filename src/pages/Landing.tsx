"use client";

import { Button } from "@/components/ui/button";
import { ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import React from "react";
import GettingStarted from "@/components/GettingStarted";
import SeeItInAction from "@/components/SeeItInAction";
import CommunityImpact from "@/components/CommunityImpact";
import RecyclingBenefits from "@/components/RecyclingBenefits";
import { useAuth } from "@/context/AuthContext";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { useTranslation } from "react-i18next";

const LandingPage = () => {
  const { t } = useTranslation();
  const { points } = useAuth(); // For anonymous points display
  const animatedPoints = useAnimatedCounter(points); // For anonymous points display

  return (
    <div className="container mx-auto p-4">
      <section className="text-center py-16 md:py-24 relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-background/50 shadow-lg mb-16">
        <div
          className="max-w-3xl mx-auto animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-foreground drop-shadow-md">
            <span className="text-primary">{t('home.hero.recycle')}</span>{t('home.hero.earnRepeat')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto drop-shadow-sm">
            {t('home.subtitle')}
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/scanner">
              <Button size="lg" className="text-lg px-10 py-7 rounded-full animate-subtle-pulse shadow-lg shadow-primary/50 bg-primary hover:bg-primary/90 text-primary-foreground">
                <ScanLine className="mr-3 h-6 w-6" />
                {t('home.startScanning')}
              </Button>
            </Link>
            {/* Anonymous points display */}
            {points > 0 && (
              <div className="flex items-center justify-center text-lg font-semibold text-foreground">
                {t('nav.points', { count: animatedPoints })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="animate-fade-in-up py-8 bg-background/70 rounded-xl mb-8" style={{ animationDelay: '0.6s' }}>
        <GettingStarted />
      </section>

      <section className="animate-fade-in-up py-8 bg-background/90 rounded-xl mb-8" style={{ animationDelay: '0.8s' }}>
        <SeeItInAction />
      </section>

      <section className="animate-fade-in-up py-8 bg-background/70 rounded-xl mb-8" style={{ animationDelay: '1.0s' }}>
        <CommunityImpact />
      </section>

      <section className="animate-fade-in-up py-8 bg-background/90 rounded-xl" style={{ animationDelay: '1.2s' }}>
        <RecyclingBenefits />
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Ready to Make a Difference?</h2>
          <p className="text-muted-foreground mt-2 mb-6 max-w-xl mx-auto">Choose your path: quick scan for instant rewards, or sign up to track your full recycling journey.</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full bg-orange hover:bg-orange/90 text-orange-foreground shadow-lg shadow-orange/50">
              <Link to="/scanner">Start Scanning Now</Link>
            </Button>
            <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/50">
              <Link to="/signup">Create Account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;