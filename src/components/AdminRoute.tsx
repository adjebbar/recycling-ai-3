"use client";

import { useAuth } from '@/context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-48 w-full max-w-2xl mx-auto" />
          <Skeleton className="h-48 w-full max-w-2xl mx-auto" />
        </div>
      </div>
    );
  }

  if (!user || user.email !== 'adjebbar83@gmail.com') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;