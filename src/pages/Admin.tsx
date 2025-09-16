"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/lib/supabaseClient';

const AdminPage = () => {
  const { 
    totalBottlesRecycled, 
    activeRecyclers, 
    resetCommunityStats,
    fetchCommunityStats
  } = useAuth();

  const [bottles, setBottles] = useState(totalBottlesRecycled);
  const [recyclers, setRecyclers] = useState(activeRecyclers);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBottles(totalBottlesRecycled);
    setRecyclers(activeRecyclers);
  }, [totalBottlesRecycled, activeRecyclers]);

  const handleUpdateStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase
      .from('community_stats')
      .update({ 
        total_bottles_recycled: bottles, 
        active_recyclers: recyclers 
      })
      .eq('id', 1);

    if (error) {
      showError("Failed to update stats: " + error.message);
    } else {
      showSuccess("Community stats updated successfully!");
      await fetchCommunityStats();
    }
    setLoading(false);
  };

  const handleReset = async () => {
    await resetCommunityStats();
    showSuccess("Community stats have been reset.");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Card className="max-w-4xl mx-auto bg-card/70 backdrop-blur-lg border">
        <CardHeader>
          <CardTitle>Community Stats Management</CardTitle>
          <CardDescription>
            View and update the community-wide recycling statistics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateStats} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="bottles">Total Bottles Recycled</Label>
              <Input
                id="bottles"
                type="number"
                value={bottles}
                onChange={(e) => setBottles(Number(e.target.value))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recyclers">Active Recyclers</Label>
              <Input
                id="recyclers"
                type="number"
                value={recyclers}
                onChange={(e) => setRecyclers(Number(e.target.value))}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Stats'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-4xl mx-auto mt-8 bg-card/70 backdrop-blur-lg border border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            This action will reset all community statistics to zero. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleReset}>
            Reset All Stats to Zero
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;