"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { useAuth } from "@/context/AuthContext";
import { Users, Recycle } from "lucide-react";

const CommunityImpact = () => {
  const { totalBottlesRecycled, activeRecyclers } = useAuth();
  
  const animatedBottles = useAnimatedCounter(totalBottlesRecycled, 1000);
  const animatedRecyclers = useAnimatedCounter(activeRecyclers, 1000);

  return (
    <div className="mt-16 text-center">
      <h2 className="text-3xl font-bold mb-6">Community Impact</h2>
      <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bottles Recycled
            </CardTitle>
            <Recycle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{animatedBottles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Making a difference, one bottle at a time.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Recyclers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{animatedRecyclers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Join our growing community!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunityImpact;