"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SeeItInAction = () => {
  return (
    <Card className="w-full max-w-3xl mx-auto bg-card/70 backdrop-blur-lg border shadow-xl rounded-2xl overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="relative h-auto w-full flex items-center justify-center">
          <img
            src="/images/recycling-action.gif"
            alt="Recycling process in action"
            className="w-full h-auto max-h-[400px] object-contain rounded-lg"
          />
        </div>
        <div className="text-center mt-4">
          <p className="font-semibold text-lg h-6 text-foreground">
            See how easy it is to recycle and earn rewards!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeeItInAction;