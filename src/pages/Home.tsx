"use client";

import { useAuth } from '@/context/AuthContext';
import DashboardPage from './Dashboard';
import LandingPage from './Landing';

const HomePage = () => {
  const { user } = useAuth(); // 'loading' is no longer needed here as it's handled globally

  // The global AppContent now handles the initial loading state,
  // so this component will only render once the auth state is resolved.
  return user ? <DashboardPage /> : <LandingPage />;
};

export default HomePage;