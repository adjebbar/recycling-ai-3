"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { useAuth } from "@/context/AuthContext";
import { Award, Scan, Globe } from "lucide-react"; // Added Globe icon

const CommunityImpact = () => {
  const { totalScans, level, totalBottlesRecycled } = useAuth(); // Get totalBottlesRecycled
  
  const animatedScans = useAnimatedCounter(totalScans, 1000);
  const animatedTotalBottlesRecycled = useAnimatedCounter(totalBottlesRecycled, 1000); // Animated counter for community total

  return (
    <div className="mt-16 text-center">
      <h2 className="text-3xl font-bold mb-6">Your Impact & Community Progress</h2>
      <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto"> {/* Changed to 3 columns */}
        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bottles You've Recycled
            </CardTitle>
            <Scan className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{animatedScans.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Every bottle makes a difference.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Level
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{level?.name}</div>
            <p className="text-xs text-muted-foreground">
              Level {level?.level} - Keep it up!
            </p>
          </CardContent>
        </Card>
        {/* New Card for Community Total Bottles Recycled */}
        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Community Bottles Recycled
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{animatedTotalBottlesRecycled.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Our collective impact on the planet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityImpact;