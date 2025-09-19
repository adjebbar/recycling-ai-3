"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Recycle, ScanLine, Trophy, BarChart, Users, LucideProps, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import GettingStarted from "@/components/GettingStarted";
import SeeItInAction from "@/components/SeeItInAction";
// Removed PlasticBottleVector import as it's no longer used

const LandingHeader = () => (
  <header className="absolute top-0 left-0 right-0 z-20 py-4">
    <div className="container mx-auto flex justify-between items-center px-4">
      <Link to="/" className="flex items-center space-x-2">
        <Recycle className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold text-white">EcoScan AI</span>
      </Link>
      {/* Removed explicit Login/Sign Up buttons from header to streamline CTA */}
    </div>
  </header>
);

interface FeatureCardProps {
  icon: React.ElementType<LucideProps>;
  title: string;
  description: string;
  delay: string;
}

const FeatureCard = ({ icon: Icon, title, description, delay }: FeatureCardProps) => (
    <Card className="text-center bg-background/50 backdrop-blur-lg border shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-fade-in-up rounded-xl" style={{ animationDelay: delay }}>
        <CardContent className="p-8">
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
                <Icon className="h-8 w-8 text-orange" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
            <p className="text-foreground">{description}</p>
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
    <div className="min-h-screen w-full text-foreground overflow-x-hidden relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url('/images/3759825_76251.jpg')` }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black opacity-50 z-0" />
      
      <div className="relative z-10"> {/* This div now contains all foreground content */}
        <LandingHeader />
        <main>
          {/* Hero Section */}
          <section
            className="relative min-h-screen flex items-center justify-center text-center pt-20 px-4"
          >
            <div className="container mx-auto relative z-10">
              <div className="max-w-3xl mx-auto">
                <div className="p-8 rounded-xl shadow-2xl bg-background/50 backdrop-blur-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 drop-shadow-lg text-white">
                    Recycle Today for a <span className="text-primary-dark animate-blink-text text-stroke-primary">Greener</span> Tomorrow
                  </h1>
                  <p className="text-lg md:text-xl text-white mb-8 max-w-2xl mx-auto drop-shadow-sm">
                    Scan plastic bottles to earn points instantly. Register later to track your progress and unlock exclusive rewards!
                  </p>
                </div>
                <div className="animate-fade-in-up flex justify-center mt-4 relative" style={{ animationDelay: '0.6s' }}>
                  {/* Arrow pointing to the scan button */}
                  <div className="absolute -top-16 -right-8 md:-right-20 transform -rotate-12 animate-bounce hidden md:block pointer-events-none">
                    <p className="text-2xl font-bold text-orange -mb-6 ml-4 transform rotate-12">
                      Start Here!
                    </p>
                    <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform -scale-x-100 drop-shadow-lg">
                      <path d="M84.1667 55.8333C70 50 66.667 35.8333 62.5 25C58.3333 14.1667 41.6667 12.5 30.8333 18.3333C20 24.1667 15.8333 40 20.8333 50.8333C25.8333 61.6667 42.5 65.8333 51.6667 60.8333" stroke="hsl(var(--orange))" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M51.6667 60.8333L45 70L57.5 68.3333L51.6667 60.8333Z" fill="hsl(var(--orange))"/>
                    </svg>
                  </div>
                  <Link to="/scanner" className="transition-transform duration-300 hover:scale-105">
                    <img 
                      src="/images/7178577_61340.jpg" 
                      alt="Scan Now" 
                      className="h-48 w-auto shadow-xl animate-subtle-pulse relative z-10 rounded-lg"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 md:py-24">
              <div className="container mx-auto px-4">
                  <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                      <h2 className="text-3xl md:text-4xl font-bold text-white">Revolutionize Your Recycling</h2>
                      <p className="text-white mt-2 max-w-2xl mx-auto">EcoScan AI is more than just an app—it's a tool to empower your environmental efforts.</p>
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
                          description="Earn points for every bottle you scan and redeem them for exciting rewards from our partners."
                          delay="0.6s"
                      />
                      <FeatureCard 
                          icon={BarChart}
                          title="Track Your Impact"
                          description="Visualize your contribution with personal stats and see how you stack up on the community leaderboard."
                          delay="0.8s"
                      />
                  </div>
              </div>
          </section>

          {/* How It Works Section (Getting Started) */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              {/* Removed duplicate h2 here */}
              <GettingStarted />
            </div>
          </section>

          {/* Animation Section */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">See It in Action</h2>
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
                <p className="text-white mt-2 max-w-2xl mx-auto">You're not just recycling; you're part of a global community making a difference.</p>
              </div>
              <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
                <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <Card className="bg-background/80 backdrop-blur-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xl font-semibold text-foreground">Total Bottles Recycled</CardTitle>
                      <Recycle className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary drop-shadow-md">{animatedBottles.toLocaleString()}</div>
                      <p className="text-foreground">and counting, thanks to our community.</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                  <Card className="bg-background/80 backdrop-blur-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xl font-semibold text-foreground">Active Recyclers</CardTitle>
                      <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary drop-shadow-md">{animatedRecyclers.toLocaleString()}</div>
                      <p className="text-foreground">making a positive impact right now.</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                  <Card className="bg-background/80 backdrop-blur-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xl font-semibold text-foreground">CO₂ Saved</CardTitle>
                      <Leaf className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary drop-shadow-md">{animatedCo2Saved} kg</div>
                      <p className="text-foreground">preventing harmful greenhouse gases.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Make a Difference?</h2>
              <p className="text-white mt-2 mb-6 max-w-xl mx-auto">Start scanning now to earn points, and consider creating an account to track your full recycling journey and unlock more rewards!</p>
              <div className="flex justify-center">
                <Link to="/signup">
                  <Button size="lg" className="text-lg px-10 py-7 rounded-full shadow-lg shadow-primary/50 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Recycle className="mr-3 h-6 w-6" />
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;