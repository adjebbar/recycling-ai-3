import { ScanHistoryItem } from "@/hooks/useProfileData";
import { isSameDay, parseISO } from "date-fns";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  condition: (stats: { points: number; scanHistory: ScanHistoryItem[] }) => boolean;
}

export const challengesList: Challenge[] = [
  {
    id: 'first_scan_today',
    title: 'Daily Kickstart',
    description: 'Scan your first bottle of the day.',
    reward: 5,
    condition: ({ scanHistory }) => {
      return scanHistory.some(scan => isSameDay(parseISO(scan.scanned_at), new Date()));
    },
  },
  {
    id: 'scan_spree_3',
    title: 'Scanning Spree',
    description: 'Scan 3 bottles in a single day.',
    reward: 15,
    condition: ({ scanHistory }) => {
      const todayScans = scanHistory.filter(scan => isSameDay(parseISO(scan.scanned_at), new Date()));
      return todayScans.length >= 3;
    },
  },
  {
    id: 'point_milestone_100',
    title: 'Century Club',
    description: 'Earn a total of 100 points.',
    reward: 25,
    condition: ({ points }) => points >= 100,
  },
  {
    id: 'point_milestone_500',
    title: 'Point Hoarder',
    description: 'Earn a total of 500 points.',
    reward: 100,
    condition: ({ points }) => points >= 500,
  },
  {
    id: 'total_scans_25',
    title: 'Recycling Enthusiast',
    description: 'Scan a total of 25 bottles.',
    reward: 50,
    condition: ({ scanHistory }) => scanHistory.length >= 25,
  },
];