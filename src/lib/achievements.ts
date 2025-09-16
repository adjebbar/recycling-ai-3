import { Award, Star, Zap, Shield } from 'lucide-react';

export interface Achievement {
  id: string;
  Icon: React.ElementType;
  condition: (stats: { points: number; totalScans: number }) => boolean;
}

export const achievementsList: Achievement[] = [
  {
    id: 'first_scan',
    Icon: Star,
    condition: ({ totalScans }) => totalScans >= 1,
  },
  {
    id: 'novice_recycler',
    Icon: Award,
    condition: ({ totalScans }) => totalScans >= 10,
  },
  {
    id: 'point_collector',
    Icon: Zap,
    condition: ({ points }) => points >= 100,
  },
  {
    id: 'dedicated_recycler',
    Icon: Shield,
    condition: ({ totalScans }) => totalScans >= 50,
  },
  {
    id: 'points_hoarder',
    Icon: Zap,
    condition: ({ points }) => points >= 500,
  },
];