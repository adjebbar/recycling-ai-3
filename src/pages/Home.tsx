"use client";

import { useAuth } from '@/context/AuthContext';
import DashboardPage from './Dashboard';
import LandingPage from './Landing';
import { Skeleton } from '@/components/ui/skeleton';

const HomePage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-8 mt-8">
        <Skeleton className="h-48 w-full" />
        <div className="grid md:grid-cols-3 gap-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return user ? <DashboardPage /> : <LandingPage />;
};

export default HomePage;