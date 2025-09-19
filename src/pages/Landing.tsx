"use client";

import { Button } from "@/components/ui/button";
import { Recycle } from "lucide-react";
import { Link } from "react-router-dom";
import React from "react";
import { LandingHeader } from "@/components/LandingHeader"; // Import the new LandingHeader

const LandingPage = () => {
  // Removed useAuth and animated counters as they are not part of this static landing page design.

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Green background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-landing-green-lighter to-landing-green-darker z-0" />

      {/* White curved section */}
      {/* This div creates the white wave effect by overlapping the green background with a large border-radius */}
      <div className="absolute bottom-0 left-0 w-full h-[50%] bg-white rounded-tl-[150px] rounded-tr-[150px] z-10 md:rounded-tl-[250px] md:rounded-tr-[250px]" />
      
      <div className="relative z-20">
        <LandingHeader /> {/* Use the new LandingHeader component */}
        <main>
          {/* Hero Section - This section now directly implements the design from the image */}
          <section className="min-h-screen flex items-center justify-center text-center pt-20 px-4">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between min-h-screen py-20 px-4">
              {/* Left content (text) */}
              <div className="text-left md:w-1/2 mb-8 md:mb-0">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">ECOLOGY ACTION</h1>
                <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">YOUR TEXT GOES HERE</h2>
                <p className="text-lg text-gray-200 mb-8">Lorem ipsum dolor sit amet, consectetur adipiscing elit sed diam nonummy us.</p>
                <Button variant="outline" className="rounded-full border-2 border-white text-white hover:bg-white hover:text-landing-green">
                  VIEW MORE
                </Button>
              </div>

              {/* Right content (illustration placeholder) */}
              <div className="md:w-1/2 flex justify-center items-end h-full">
                {/* Placeholder for illustration. Replace this entire div with your actual illustration image. */}
                <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] flex items-end justify-center">
                  {/* Pink Bin */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-60 bg-bin-red rounded-t-lg flex items-center justify-center shadow-lg">
                    <Recycle className="h-20 w-20 text-white" />
                  </div>
                  {/* Person (simplified) */}
                  <div className="absolute bottom-0 right-[10%] w-28 h-56 bg-yellow-400 rounded-t-full shadow-md" style={{ transform: 'translateX(50%)' }}>
                    {/* Simplified arm and hand for the person */}
                    <div className="absolute top-1/3 left-full w-16 h-8 bg-yellow-400 rounded-r-full" />
                    <div className="absolute top-1/3 left-[calc(100%+4rem)] w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-gray-600 rounded-full" />
                    </div>
                  </div>
                  {/* Green plants (simplified) */}
                  <div className="absolute bottom-0 left-0 w-full h-10 bg-green-600 rounded-t-full opacity-70" />
                  <div className="absolute bottom-0 right-0 w-full h-12 bg-green-700 rounded-t-full opacity-70" />
                </div>
              </div>
            </div>
          </section>
          {/* All other sections (Features, How It Works, Animation, Community Impact, Final CTA) have been removed to match the single-hero design. */}
        </main>
      </div>
    </div>
  );
};

export default LandingPage;