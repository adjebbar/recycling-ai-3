"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanHistoryItem } from '@/hooks/useProfileData';
import { format, parseISO, startOfDay } from 'date-fns';
import { useMemo } from 'react';

interface ActivityChartProps {
  scanHistory: ScanHistoryItem[] | undefined;
}

const ActivityChart = ({ scanHistory }: ActivityChartProps) => {
  const chartData = useMemo(() => {
    if (!scanHistory) return [];

    const scansByDay = scanHistory.reduce((acc, item) => {
      const day = format(startOfDay(parseISO(item.scanned_at)), 'yyyy-MM-dd');
      if (!acc[day]) {
        acc[day] = 0;
      }
      acc[day]++;
      return acc;
    }, {} as { [key: string]: number });

    // Get last 7 days for the chart
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const formattedDate = format(date, 'yyyy-MM-dd');
      data.push({
        name: format(date, 'MMM d'),
        scans: scansByDay[formattedDate] || 0,
      });
    }
    return data;
  }, [scanHistory]);

  return (
    <Card className="max-w-4xl mx-auto mt-8 bg-card/70 backdrop-blur-lg border">
      <CardHeader>
        <CardTitle>Recycling Activity (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
              }}
            />
            <Bar dataKey="scans" fill="hsl(var(--primary))" name="Bottles Recycled" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ActivityChart;