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
    <Card className="text-center bg-card/70 backdrop-blur-lg border shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-fade-in-up rounded-xl" style={{ animationDelay: delay }}>
        <CardContent className="p-8">
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
                <Icon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3> {/* Changed to text-foreground */}
            <p className="text-muted-foreground">{description}</p> {/* Changed to text-muted-foreground */}
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
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url('/backgrounds/ai-recycling-hero.png')` }}
      />
      {/* Dark overlay for text readability, now a gradient */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-black/80 via-black/40 to-transparent z-0" />
      
      <div className="relative z-10">
        <LandingHeader />
        <main>
          {/* Hero Section */}
          <section
            className="min-h-screen flex items-center justify-center text-center pt-20 px-4"
          >
            <div className="container mx-auto">
              <div className="max-w-3xl mx-auto">
                <div className="bg-black/40 p-6 rounded-lg shadow-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}> {/* Changed bg-background/20 to bg-black/40 */}
                  <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 drop-shadow-lg text-white">
                    Scan Today for a <span className="text-primary">Greener</span> Tomorrow
                  </h1>
                  <p className="text-lg md:text-xl text-white mb-8 max-w-2xl mx-auto drop-shadow-md">
                    Start recycling instantly and earn points, or create an account to track your progress, unlock achievements, and redeem exclusive rewards.
                  </p>
                </div>
                <div className="animate-fade-in-up flex flex-col sm:flex-row justify-center items-center gap-4 mt-8" style={{ animationDelay: '0.6s' }}>
                  <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full bg-orange hover:bg-orange/90 text-orange-foreground shadow-lg shadow-orange/50">
                    <Link to="/scanner">Start Scanning Anonymously</Link>
                  </Button>
                  <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/50">
                    <Link to="/signup">Create Account & Track Progress</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-background/50">
              <div className="container mx-auto px-4">
                  <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                      <h2 className="text-3xl md:text-4xl font-bold text-foreground">Revolutionize Your Recycling</h2> {/* Changed to text-foreground */}
                      <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">EcoScan AI is more than just an app—it's a tool to empower your environmental efforts.</p> {/* Changed to text-muted-foreground */}
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
          <section className="py-16 md:py-24 bg-background/50">
            <div className="container mx-auto px-4 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <GettingStarted />
            </div>
          </section>

          {/* Animation Section */}
          <section className="py-16 md:py-24 bg-background/70">
            <div className="container mx-auto px-4 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">See It in Action</h2> {/* Changed to text-foreground */}
              <div className="max-w-2xl mx-auto">
                <SeeItInAction />
              </div>
            </div>
          </section>

          {/* Community Impact Section */}
          <section className="py-16 md:py-24 bg-background/90">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">Our Collective Impact</h2> {/* Changed to text-foreground */}
                <p className="text-muted-foreground mt-2">You're not just recycling; you're part of a global community making a difference.</p> {/* Changed to text-muted-foreground */}
              </div>
              <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
                <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <Card className="bg-card/70 backdrop-blur-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-foreground">Total Bottles Recycled</CardTitle>
                      <Recycle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary">{animatedBottles.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">and counting, thanks to our community.</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                  <Card className="bg-card/70 backdrop-blur-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-foreground">Active Recyclers</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-primary">{animatedRecyclers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">making a positive impact right now.</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                  <Card className="bg-card/70 backdrop-blur-lg border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-foreground">CO₂ Saved</CardTitle>
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
        </main>
      </div>
    </div>
  );
};

export default LandingPage;