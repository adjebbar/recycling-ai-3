"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, QrCode, Trash2, User as UserIcon, Loader2, Settings, Globe, Users, ScanLine, Nfc } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllUsers } from '@/hooks/useAllUsers';
import { useQueryClient } from '@tanstack/react-query';
import AdminNfcReader from '@/components/AdminNfcReader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs components

const AdminPage = () => {
  const { 
    totalBottlesRecycled, 
    activeRecyclers, 
    resetCommunityStats,
    fetchCommunityStats
  } = useAuth();

  const queryClient = useQueryClient();
  const { data: allUsers, isLoading: isUsersLoading, isError: isUsersError } = useAllUsers();

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
      showError("Please select a user to delete.");
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
      await fetchCommunityStats();
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    } catch (err: any) {
      dismissToast(loadingToast);
      showError(err.message || "An unknown error occurred during user deletion.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 animate-fade-in-up">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="ticket-validation" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="ticket-validation" className="flex flex-col py-2">
            <QrCode className="h-5 w-5 mb-1" />
            <span className="text-xs">Tickets</span>
          </TabsTrigger>
          <TabsTrigger value="nfc-tools" className="flex flex-col py-2">
            <Nfc className="h-5 w-5 mb-1" />
            <span className="text-xs">NFC</span>
          </TabsTrigger>
          <TabsTrigger value="community-stats" className="flex flex-col py-2">
            <Globe className="h-5 w-5 mb-1" />
            <span className="text-xs">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="user-management" className="flex flex-col py-2">
            <Users className="h-5 w-5 mb-1" />
            <span className="text-xs">Users</span>
          </TabsTrigger>
          <TabsTrigger value="danger-zone" className="flex flex-col py-2">
            <AlertTriangle className="h-5 w-5 mb-1 text-destructive" />
            <span className="text-xs">Danger</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ticket-validation" className="mt-4">
          <Card className="bg-card/70 backdrop-blur-lg border shadow-lg rounded-xl">
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
        </TabsContent>

        <TabsContent value="nfc-tools" className="mt-4">
          <AdminNfcReader />
        </TabsContent>

        <TabsContent value="community-stats" className="mt-4">
          <Card className="bg-card/70 backdrop-blur-lg border shadow-lg rounded-xl">
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
        </TabsContent>

        <TabsContent value="user-management" className="mt-4">
          <Card className="bg-card/70 backdrop-blur-lg border shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>
                Sélectionnez un utilisateur à supprimer. Cette action est irréversible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="user-select">Sélectionner un utilisateur</Label>
                  {isUsersLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Chargement des utilisateurs...</span>
                    </div>
                  ) : isUsersError ? (
                    <p className="text-destructive text-sm">Erreur lors du chargement des utilisateurs.</p>
                  ) : (
                    <Select onValueChange={setUserIdToDelete} value={userIdToDelete}>
                      <SelectTrigger id="user-select" className="w-full">
                        <SelectValue placeholder="Sélectionnez un utilisateur" />
                      </SelectTrigger>
                      <SelectContent>
                        {allUsers?.map((userItem) => (
                          <SelectItem key={userItem.id} value={userItem.id}>
                            <div className="flex items-center">
                              <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                              {userItem.first_name && userItem.last_name ? 
                                `${userItem.first_name} ${userItem.last_name} (${userItem.email})` : 
                                userItem.email}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={!userIdToDelete || deleteLoading || isUsersLoading}>
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
        </TabsContent>

        <TabsContent value="danger-zone" className="mt-4">
          <Card className="border-destructive bg-card/70 backdrop-blur-lg border shadow-lg rounded-xl">
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;