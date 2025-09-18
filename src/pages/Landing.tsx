"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Recycle, ScanLine, Trophy, BarChart, Users, LucideProps, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import GettingStarted from "@/components/GettingStarted";
import SeeItInAction from "@/components/SeeItInAction";
import { cn } from "@/lib/utils"; 

interface FeatureCardProps {
  icon: React.ElementType<LucideProps>;
  title: string;
  description: string;
  delay: string;
}

const FeatureCard = ({ icon: Icon, title, description, delay }: FeatureCardProps) => (
    <Card className="text-center bg-card/70 backdrop-blur-lg border shadow-lg animate-fade-in-up rounded-xl" style={{ animationDelay: delay }}>
        <CardContent className="p-8">
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
                <Icon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const LandingPage = () => {
  const { totalBottlesRecycled, activeRecyclers } = useAuth();

  const animatedBottles = useAnimatedCounter(totalBottlesRecycled, 1000);
  const animatedRecyclers = useAnimatedCounter(activeRecyclers, 1000);

  const CO2_SAVED_PER_BOTTLE_KG = 0.03;
  const animatedCo2Saved = (animatedBottles * CO2_SAVED_PER_BOTTLE_KG).toFixed(1);

  return (
    <div className="min-h-screen w-full text-foreground overflow-x-hidden relative bg-gradient-to-br from-gray-900 to-gray-700">
      {/* Background Image and Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url('/backgrounds/recycling-machine-background.png')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-70"></div>
      
      <div className="relative z-10 container mx-auto max-w-6xl">
        {/* Hero Section */}
        <section className="text-center py-16 md:py-24">
          <div
            className="max-w-3xl mx-auto animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-white">
              <span className="text-primary">Recycle.</span> Earn. Repeat.
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Scan your plastic bottles, earn points, and contribute to a greener future.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg" className="text-lg px-10 py-7 rounded-full bg-orange hover:bg-orange/90 text-primary-foreground shadow-lg shadow-primary/50 animate-subtle-pulse">
                <Link to="/scanner">Start Scanning</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-10 py-7 rounded-full border-white text-white hover:bg-white/10">
                <Link to="/signup">Create Account</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-3xl md:text-4xl font-bold text-white">Revolutionize Your Recycling</h2>
                    <p className="text-gray-200 mt-2 max-w-2xl mx-auto">EcoScan AI is more than just an app—it's a tool to empower your environmental efforts.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <FeatureCard 
                        icon={ScanLine}
                        title="Effortless Scanning"
                        description="Our AI-powered scanner instantly recognizes plastic bottle barcodes, making recycling quick and simple."
                        delay="0.4s"
                    />
                    <FeatureCard 
                        icon={Trophy}
                        title="Tangible Rewards"
                        description="Earn points for every bottle scanned and exchange them for exciting rewards from our partners."
                        delay="0.6s"
                    />
                    <FeatureCard 
                        icon={BarChart}
                        title="Track Your Impact"
                        description="Visualize your contribution with personal statistics and see your ranking on the community leaderboard."
                        delay="0.8s"
                    />
                </div>
            </div>
        </section>

        {/* How It Works Section (Getting Started) */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <GettingStarted />
          </div>
        </section>

        {/* Animation Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">See It In Action</h2>
            <div className="max-w-2xl mx-auto">
              <SeeItInAction />
            </div>
          </div>
        </section>

        {/* Community Impact Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Our Collective Impact</h2>
              <p className="text-gray-200 mt-2">You're not just recycling; you're part of a global community making a difference.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <Card className="bg-card/70 backdrop-blur-lg border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bottles Recycled</CardTitle>
                    <Recycle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary">{animatedBottles.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">and counting, thanks to our community.</p>
                  </CardContent>
                </Card>
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <Card className="bg-card/70 backdrop-blur-lg border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Recyclers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary">{animatedRecyclers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">making a positive impact right now.</p>
                  </CardContent>
                </Card>
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                <Card className="bg-card/70 backdrop-blur-lg border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CO₂ Saved</CardTitle>
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary">{animatedCo2Saved} kg</div>
                    <p className="text-xs text-muted-foreground">preventing harmful greenhouse gases.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-24">
          <Card className="bg-card/70 backdrop-blur-lg border rounded-2xl shadow-xl p-8 md:p-12 text-center animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Make a Difference?</h2>
            <p className="text-gray-200 mt-2 mb-6 max-w-xl mx-auto">Choose your path: quick scan for instant rewards, or sign up to track your full recycling journey.</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full bg-orange hover:bg-orange/90 text-primary-foreground shadow-lg shadow-primary/50">
                <Link to="/scanner">Start Scanning Now</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full border-white text-white hover:bg-white/10">
                <Link to="/signup">Create Account</Link>
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;