"use client";

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      showError(error.message);
    } else {
      const { error: rpcError } = await supabase.rpc('increment_active_recyclers');
      if (rpcError) {
        console.error("Could not increment active recyclers count:", rpcError.message);
      }
      showSuccess('Check your email for the confirmation link!');
      navigate('/login');
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 flex justify-center items-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md bg-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create a new account to start recycling.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="shadow-sm" // Added shadow-sm
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="shadow-sm" // Added shadow-sm
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing up...' : 'Sign Up'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-sm">
          <p>Already have an account? <Link to="/login" className="underline">Login</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUpPage;