"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, ScanLine, Trophy } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "1. Choisissez Votre Chemin de Recyclage",
    description: "Scannez les bouteilles anonymement pour des points instantanés, ou créez un compte pour suivre votre progression et débloquer des avantages exclusifs.",
  },
  {
    icon: ScanLine,
    title: "2. Scannez les Bouteilles en Plastique",
    description: "Utilisez l'appareil photo de votre téléphone pour scanner le code-barres des bouteilles en plastique que vous souhaitez recycler et gagnez des points.",
  },
  {
    icon: Trophy,
    title: "3. Profitez de Vos Récompenses",
    description: "Échangez vos points accumulés contre des bons d'achat (anonyme) ou des récompenses et réalisations exclusives (titulaires de compte).",
  },
];

const GettingStarted = () => {
  return (
    <>
      <h2 className="text-3xl font-bold mb-6 text-center text-foreground">Comment Ça Marche</h2>
      <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={index} className="bg-white backdrop-blur-md border text-left shadow-lg rounded-xl">
              <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                <Icon className="h-8 w-8 text-primary" />
                <CardTitle className="text-foreground">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default GettingStarted;