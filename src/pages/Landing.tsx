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
import { cn } from "@/lib/utils"; 

interface FeatureCardProps {
  icon: React.ElementType<LucideProps>;
  title: string;
  description: string;
  delay: string;
}

const FeatureCard = ({ icon: Icon, title, description, delay }: FeatureCardProps) => (
    <Card className="text-center bg-white border shadow-lg animate-fade-in-up rounded-xl" style={{ animationDelay: delay }}>
        <CardContent className="p-8">
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
                <Icon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
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
    <div className="min-h-screen w-full text-foreground overflow-x-hidden relative bg-templateGreen py-8">
      
      <div className="relative z-10 container mx-auto max-w-6xl">
        {/* Hero Section - Now a white card with illustration and text */}
        <Card className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-16 animate-fade-in-up">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="md:w-1/2 text-center md:text-left">
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-foreground">
                Recyclez, Gagnez, <span className="text-primary">Impactez</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Scannez vos bouteilles en plastique, gagnez des points et contribuez à un avenir plus vert.
              </p>
              <div className="flex flex-col sm:flex-row justify-center md:justify-start items-center gap-4">
                <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full bg-orange hover:bg-orange/90 text-primary-foreground">
                  <Link to="/scanner">Commencer à Scanner</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full border-primary text-primary hover:bg-primary/10">
                  <Link to="/signup">Créer un Compte</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img 
                src="/backgrounds/recycling-template-illustration.jpg" 
                alt="Recycling Illustration" 
                className="max-w-full h-auto rounded-lg shadow-md"
              />
            </div>
          </div>
        </Card>

        {/* Features Section */}
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-3xl md:text-4xl font-bold text-white">Révolutionnez Votre Recyclage</h2>
                    <p className="text-white mt-2 max-w-2xl mx-auto">EcoScan AI est plus qu'une simple application—c'est un outil pour renforcer vos efforts environnementaux.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <FeatureCard 
                        icon={ScanLine}
                        title="Scan Facile"
                        description="Notre scanner alimenté par l'IA reconnaît instantanément les codes-barres des bouteilles en plastique, rendant le recyclage rapide et simple."
                        delay="0.4s"
                    />
                    <FeatureCard 
                        icon={Trophy}
                        title="Récompenses Tangibles"
                        description="Gagnez des points pour chaque bouteille scannée et échangez-les contre des récompenses excitantes de nos partenaires."
                        delay="0.6s"
                    />
                    <FeatureCard 
                        icon={BarChart}
                        title="Suivez Votre Impact"
                        description="Visualisez votre contribution avec des statistiques personnelles et voyez votre classement sur le tableau des leaders de la communauté."
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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Voyez-le en Action</h2>
            <div className="max-w-2xl mx-auto">
              <SeeItInAction />
            </div>
          </div>
        </section>

        {/* Community Impact Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Notre Impact Collectif</h2>
              <p className="text-white mt-2">Vous ne faites que recycler ; vous faites partie d'une communauté mondiale qui fait la différence.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <Card className="bg-white border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Bouteilles Recyclées</CardTitle>
                    <Recycle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary">{animatedBottles.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">et ça continue, grâce à notre communauté.</p>
                  </CardContent>
                </Card>
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <Card className="bg-white border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Recycleurs Actifs</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary">{animatedRecyclers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">qui ont un impact positif en ce moment.</p>
                  </CardContent>
                </Card>
              </div>
              <div className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                <Card className="bg-white border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">CO₂ Économisé</CardTitle>
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary">{animatedCo2Saved} kg</div>
                    <p className="text-xs text-muted-foreground">prévenant les gaz à effet de serre nocifs.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-24">
          <Card className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Prêt à Faire la Différence ?</h2>
            <p className="text-muted-foreground mt-2 mb-6 max-w-xl mx-auto">Choisissez votre voie : scan rapide pour des récompenses instantanées, ou inscrivez-vous pour suivre votre parcours de recyclage complet.</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full bg-orange hover:bg-orange/90 text-primary-foreground">
                <Link to="/scanner">Commencer à Scanner Maintenant</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full border-primary text-primary hover:bg-primary/10">
                <Link to="/signup">Créer un Compte</Link>
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;