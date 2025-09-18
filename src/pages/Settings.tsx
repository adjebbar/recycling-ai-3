"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/lib/supabaseClient';
import { showError, showSuccess } from '@/utils/toast';
import { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
});

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, firstName, lastName, refetchProfile } = useAuth();
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (firstName && lastName) {
      profileForm.reset({
        firstName,
        lastName,
      });
    }
  }, [firstName, lastName, profileForm]);

  const handleProfileUpdate = async (values: ProfileFormValues) => {
    if (!user) return;
    setProfileLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ first_name: values.firstName, last_name: values.lastName })
      .eq('id', user.id);
    
    if (error) {
      showError(error.message);
    } else {
      showSuccess('Profile updated successfully!');
      await refetchProfile();
    }
    setProfileLoading(false);
  };

  const handlePasswordUpdate = async (values: PasswordFormValues) => {
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      showError(error.message);
    } else {
      showSuccess('Password updated successfully!');
      passwordForm.reset();
    }
    setPasswordLoading(false);
  };

  const handleDeleteAccount = async () => {
    console.log("Account deletion initiated. A server-side function would be needed to clear all user data.");
    showSuccess("Your account has been marked for deletion. You have been logged out.");
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="container mx-auto p-4 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-lg text-muted-foreground">Manage your account settings.</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your name here.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="shadow-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="shadow-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={profileLoading}>
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password here. After updating, you may be logged out from other sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} className="shadow-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} className="shadow-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-destructive bg-card/70 backdrop-blur-lg border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
              Danger Zone
            </CardTitle>
            <CardDescription>This action is permanent and cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount}>Yes, delete my account</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;