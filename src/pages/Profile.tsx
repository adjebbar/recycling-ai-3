"use client";

import { useAuth } from "@/context/AuthContext";
import { useProfileData } from "@/hooks/useProfileData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { Badge } from "@/components/ui/badge";
import Achievements from "@/components/Achievements";
import { useTranslation } from "react-i18next";
import ActivityChart from "@/components/ActivityChart";
import { Star } from "lucide-react";

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, points, totalScans, level, firstName, lastName } = useAuth();
  const { data: scanHistory, isLoading } = useProfileData();
  const animatedPoints = useAnimatedCounter(points);
  const animatedTotalScans = useAnimatedCounter(totalScans);

  return (
    <div className="container mx-auto p-4 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{firstName && lastName ? `${firstName} ${lastName}` : t('profile.title')}</h1>
        <p className="text-lg text-muted-foreground">{user?.email}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto mb-8">
        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader>
            <CardTitle>{t('profile.totalPoints')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{animatedPoints.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader>
            <CardTitle>{t('profile.bottlesRecycled')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{animatedTotalScans.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 backdrop-blur-lg border">
          <CardHeader>
            <CardTitle>Current Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{level?.name}</p>
                <p className="text-sm text-muted-foreground">Level {level?.level}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Achievements />

      <ActivityChart scanHistory={scanHistory} />

      <Card className="max-w-4xl mx-auto mt-8 bg-card/70 backdrop-blur-lg border">
        <CardHeader>
          <CardTitle>{t('profile.recentActivity')}</CardTitle>
          <CardDescription>{t('profile.recentActivityDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto"> {/* Added overflow-x-auto for horizontal scrolling on small screens */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('profile.date')}</TableHead>
                  <TableHead>{t('profile.barcode')}</TableHead>
                  <TableHead className="text-right">{t('profile.points')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  scanHistory?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-[120px]">{format(new Date(item.scanned_at), 'PPp')}</TableCell> {/* Added min-w */}
                      <TableCell className="font-mono text-xs max-w-[150px] truncate">{item.product_barcode}</TableCell> {/* Added truncate and max-w */}
                      <TableCell className="text-right">
                        <Badge variant="secondary">+{item.points_earned}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;