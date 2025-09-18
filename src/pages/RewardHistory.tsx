"use client";

import { useRewardHistory } from '@/hooks/useRewardHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Gift, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const RewardHistoryPage = () => {
  const { t } = useTranslation();
  const { data: rewardHistory, isLoading, isError } = useRewardHistory();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">{t('rewardHistory.statusActive')}</Badge>;
      case 'redeemed':
        return <Badge className="bg-green-100 text-green-800">{t('rewardHistory.statusRedeemed')}</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">{t('rewardHistory.statusExpired')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background to-muted/50 rounded-lg shadow-inner animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('rewardHistory.title')}</h1>
        <p className="text-lg text-muted-foreground">
          {t('rewardHistory.subtitle')}
        </p>
      </div>
      <Card className="max-w-4xl mx-auto bg-card/70 backdrop-blur-lg border">
        <CardHeader>
          <CardTitle>{t('rewardHistory.cardTitle')}</CardTitle>
          <CardDescription>{t('rewardHistory.cardDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">{t('rewardHistory.reward')}</TableHead>
                <TableHead>{t('rewardHistory.cost')}</TableHead>
                <TableHead>{t('rewardHistory.value')}</TableHead>
                <TableHead>{t('rewardHistory.status')}</TableHead>
                <TableHead className="text-right">{t('rewardHistory.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-32" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-destructive">
                    {t('rewardHistory.errorLoading')}
                  </TableCell>
                </TableRow>
              ) : (
                rewardHistory?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium flex items-center">
                      {item.rewards?.icon && <span className="mr-2 text-xl">{item.rewards.icon}</span>}
                      {item.rewards?.name || t('rewardHistory.genericVoucher')}
                    </TableCell>
                    <TableCell>{item.points_cost} {t('rewards.points')}</TableCell>
                    <TableCell>${item.amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      {format(new Date(item.created_at), 'PPp')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardHistoryPage;