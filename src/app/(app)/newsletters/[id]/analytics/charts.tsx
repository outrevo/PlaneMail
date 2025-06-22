
'use client';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart2, PieChartIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Pie, Cell, Tooltip } from 'recharts';
import type { NewsletterAnalyticsData } from './actions';

interface NewsletterChartsProps {
  engagementData: { name: string; value: number; fill: string }[];
  hasRecipientData: boolean;
  // Placeholder for future time-series data
  // opensTimeSeries: { date: string; count: number }[];
  // clicksTimeSeries: { date: string; count: number }[];
}

export default function NewsletterCharts({ engagementData, hasRecipientData }: NewsletterChartsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
            <BarChart2 className="h-5 w-5" /> Performance Over Time
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Open and click trends for this newsletter. (Charts coming soon)</p>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/50 rounded-md">
            <BarChart2 className="w-12 h-12 mb-2" />
            Detailed time-series charts will be available once tracking is active.
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
            <PieChartIcon className="h-5 w-5" /> Engagement Overview
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Snapshot of subscriber interaction.</p>
          <div className="h-[300px]">
            {hasRecipientData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={engagementData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80} 
                    labelLine={false} 
                    label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent hideLabel />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/50 rounded-md">
                <PieChartIcon className="w-12 h-12 mb-2" />
                No recipient data to display chart.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
