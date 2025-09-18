"use client";

import React from 'react';
import { Recycle, Leaf, Zap, Droplet, Globe, TreeDeciduous, Lightbulb, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const recyclingIcons = [
  { icon: Recycle, label: "Recycle" },
  { icon: Leaf, label: "Nature" },
  { icon: Zap, label: "Energy" },
  { icon: Droplet, label: "Water" },
  { icon: Globe, label: "Planet" },
  { icon: TreeDeciduous, label: "Forests" },
  { icon: Lightbulb, label: "Innovation" },
  { icon: Package, label: "Packaging" },
];

const RecyclingSymbols = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Our Commitment to a Greener Future</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {recyclingIcons.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card 
              key={index} 
              className={cn(
                "flex flex-col items-center justify-center p-6 bg-card/70 backdrop-blur-lg border shadow-md transition-all duration-300 hover:scale-[1.05] hover:shadow-lg",
                "animate-fade-in-up"
              )}
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <Icon className="h-12 w-12 text-primary mb-3" />
              <p className="text-lg font-semibold text-foreground">{item.label}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RecyclingSymbols;