"use client";

import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AnonymousUserActionsProps {
  points: number;
  isRedeeming: boolean;
  onRedeem: () => void;
  onReset: () => void;
}

export const AnonymousUserActions = ({ points, isRedeeming, onRedeem, onReset }: AnonymousUserActionsProps) => {
  const { t } = useTranslation();
  const animatedPoints = useAnimatedCounter(points);

  return (
    <Card className="w-full max-w-lg mt-4">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t('scanner.sessionScore')}</p>
          <p className="text-2xl font-bold text-primary">{animatedPoints}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={points === 0 ? "secondary" : "default"}
            size="sm"
            onClick={onRedeem}
            disabled={points === 0 || isRedeeming}
          >
            <Trophy className="mr-2 h-4 w-4" />
            {isRedeeming ? "Generating..." : "Redeem"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset} disabled={points === 0}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('scanner.resetScore')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};