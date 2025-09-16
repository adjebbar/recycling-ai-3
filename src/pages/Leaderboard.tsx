"use client";

import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Medal } from 'lucide-react';
import { getLevelFromPoints } from '@/lib/levels';

const maskEmail = (email: string) => {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  return `${name.slice(0, 2)}***@${domain}`;
};

const getRankColor = (rank: number) => {
  if (rank === 1) return 'text-yellow-500';
  if (rank === 2) return 'text-gray-400';
  if (rank === 3) return 'text-yellow-700';
  return 'text-muted-foreground';
};

const LeaderboardPage = () => {
  const { data: users, isLoading, isError } = useLeaderboard();

  return (
    <div className="container mx-auto p-4 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Top Recyclers</h1>
        <p className="text-lg text-muted-foreground">
          See who is leading the charge in our community!
        </p>
      </div>
      <Card className="max-w-2xl mx-auto bg-card/70 backdrop-blur-lg border">
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Top 10 users by points</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-5 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-12" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-destructive">
                    Failed to load leaderboard.
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((user, index) => {
                  const level = getLevelFromPoints(user.points);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {index < 3 ? (
                            <Medal className={`h-5 w-5 ${getRankColor(index + 1)}`} />
                          ) : (
                            <span className="w-5 text-center">{index + 1}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{maskEmail(user.email)}</TableCell>
                      <TableCell>{level.name}</TableCell>
                      <TableCell className="text-right font-semibold">{user.points.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPage;