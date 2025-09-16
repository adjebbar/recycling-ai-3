"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Wind, Leaf, Briefcase, LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Benefit {
  title: string;
  description: string;
  Icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
}

const benefits: Benefit[] = [
  {
    title: 'Saves Energy',
    description: 'Recycling aluminum cans saves 95% of the energy needed to make new ones from raw materials.',
    Icon: Zap,
  },
  {
    title: 'Reduces Pollution',
    description: 'Recycling helps reduce greenhouse gas emissions by reducing energy consumption.',
    Icon: Wind,
  },
  {
    title: 'Conserves Resources',
    description: 'Using recycled materials minimizes the need for extracting and processing virgin resources like timber and oil.',
    Icon: Leaf,
  },
  {
    title: 'Creates Jobs',
    description: 'The recycling and reuse industry creates jobs in collection, sorting, and processing.',
    Icon: Briefcase,
  },
];

const RecyclingBenefits = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % benefits.length);
        setIsFading(false);
      }, 500); // Corresponds to the fade-out duration
    }, 4000); // Change benefit every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const { title, description, Icon } = benefits[currentIndex];

  return (
    <div className="mt-16 text-center">
      <h2 className="text-3xl font-bold mb-6">Why Recycle?</h2>
      <Card className={cn(
        "max-w-2xl mx-auto transition-opacity duration-500 bg-card/70 backdrop-blur-lg border",
        isFading ? "opacity-0" : "opacity-100"
      )}>
        <CardHeader className="flex flex-row items-center space-x-4 pb-2">
          <Icon className="h-8 w-8 text-primary" />
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecyclingBenefits;