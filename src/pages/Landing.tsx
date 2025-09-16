"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Recycle, ScanLine, Trophy, BarChart, Users, LucideProps } from "lucide-react";
import { Link } from "react-router-dom";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import GettingStarted from "@/components/GettingStarted";
import SeeItInAction from "@/components/SeeItInAction";

const LandingHeader = () => (
  <header className="absolute top-0 left-0 right-0 z-20 py-4">
    <div className="container mx-auto flex justify-between items-center px-4">
      <Link to="/" className="flex items-center space-x-2">
        <Recycle className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold text-foreground">EcoScan AI</span>
      </Link>
      <div className="space-x-2">
        <Button asChild variant="ghost">
          <Link to="/login">Login</Link>
        </Button>
        <Button asChild>
          <Link to="/signup">Sign Up</Link>
        </Button>
      </div>
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
    <Card className="text-center bg-card/90 border shadow-lg animate-fade-in-up rounded-xl" style={{ animationDelay: delay }}>
        <CardContent className="p-8">
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
                <Icon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const LandingPage = () => {
  const { totalBottlesRecycled, activeRecyclers } = useAuth();
  const animatedBottles = useAnimatedCounter(totalBottlesRecycled, 1000);
  const animatedRecyclers = useAnimatedCounter(activeRecyclers, 1000);

  return (
    <div className="min-h-screen w-full text-foreground overflow-x-hidden relative">
      <div
        className="absolute inset-0 w-full h-full bg-gradient-to-br from-background via-primary/10 to-background"
      />
      
      <div className="relative z-10">
        <LandingHeader />
        <main>
          {/* Hero Section */}
          <section
            className="min-h-screen flex items-center justify-center text-center pt-20 px-4"
          >
            <div className="container mx-auto">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 animate-fade-in-up drop-shadow-md" style={{ animationDelay: '0.2s' }}>
                  Scan Today for a <span className="text-primary">Greener</span> Tomorrow
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up drop-shadow-md" style={{ animationDelay: '0.4s' }}>
                  EcoScan AI rewards you for recycling. Join our community and make a tangible impact on the planet, one bottle at a time.
                </p>
                <div className="animate-fade-in-up flex justify-center items-center gap-4" style={{ animationDelay: '0.6s' }}>
                  <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full">
                    <Link to="/signup">Get Started for Free</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 md:py-24">
              <div className="container mx-auto px-4">
                  <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                      <h2 className="text-3xl md:text-4xl font-bold">Revolutionize Your Recycling</h2>
                      <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">EcoScan AI is more than just an app—it's a tool to empower your environmental efforts.</p>
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
              <GettingStarted />
            </div>
          </section>

          {/* Animation Section */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-8">See It in Action</h2>
              <div className="max-w-2xl mx-auto">
                <SeeItInAction />
              </div>
            </div>
          </section>

          {/* Community Impact Section */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-3xl md:text-4xl font-bold">Join a Growing Movement</h2>
                <p className="text-muted-foreground mt-2">You're not just recycling; you're part of a global community making a difference.</p>
              </div>
              <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
                <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <Card className="bg-card/90 border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Bottles Recycled</CardTitle>
                      <Recycle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary">{animatedBottles.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">and counting, thanks to our community.</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                  <Card className="bg-card/90 border">
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
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-3xl md:text-4xl font-bold">Ready to Make a Difference?</h2>
              <p className="text-muted-foreground mt-2 mb-6 max-w-xl mx-auto">Start your recycling journey today. Your first scan is just a click away.</p>
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full">
                <Link to="/signup">Sign Up Now & Get Rewards</Link>
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;