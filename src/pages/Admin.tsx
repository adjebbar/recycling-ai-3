"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, QrCode, Trash2 } from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [userIdToDelete, setUserIdToDelete] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleDeleteUser = async () => {
    if (!userIdToDelete) {
      showError("Please enter a User ID to delete.");
      return;
    }
    setDeleteLoading(true);
    const loadingToast = showLoading(`Deleting user ${userIdToDelete}...`);

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userIdToDelete },
      });

      dismissToast(loadingToast);

      if (error) {
        let errorMessage = "Failed to delete user.";
        try {
          const errorBody = await error.context.json();
          if (errorBody && errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch (e) {
          console.error("Could not parse error response from edge function:", e);
        }
        throw new Error(errorMessage);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      showSuccess(data.message);
      setUserIdToDelete('');
      await fetchCommunityStats(); // Refresh community stats as active recyclers might change
    } catch (err: any) {
      dismissToast(loadingToast);
      showError(err.message || "An unknown error occurred during user deletion.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader>
            <CardTitle>Validation des Tickets</CardTitle>
            <CardDescription>
              Scannez les QR codes des tickets pour les valider.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/admin/validate-ticket">
                <QrCode className="mr-2 h-4 w-4" />
                Accéder au Scanner
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-lg border">
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

        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader>
            <CardTitle>Gestion des Utilisateurs</CardTitle>
            <CardDescription>
              Supprimer un compte utilisateur. Cette action est irréversible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="userIdToDelete">ID de l'utilisateur à supprimer</Label>
                <Input
                  id="userIdToDelete"
                  type="text"
                  placeholder="Entrez l'ID de l'utilisateur (UUID)"
                  value={userIdToDelete}
                  onChange={(e) => setUserIdToDelete(e.target.value)}
                />
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={!userIdToDelete || deleteLoading}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleteLoading ? 'Suppression...' : 'Supprimer l\'utilisateur'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Cela supprimera définitivement le compte de l'utilisateur et toutes ses données associées.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser} disabled={deleteLoading}>
                      Oui, supprimer le compte
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-destructive bg-card/70 backdrop-blur-lg border">
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
    </div>
  );
};

export default AdminPage;