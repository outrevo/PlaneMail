'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Mail, 
  TrendingUp, 
  UserCheck,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Loader2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getSequenceAnalytics, type SequenceStats } from './actions';

const timeRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export default function SequenceAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<{
    overallStats: SequenceStats;
    sequences: any[];
  } | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = await getSequenceAnalytics(undefined, timeRange);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const stats = analyticsData?.overallStats || {
    totalEntered: 0,
    totalCompleted: 0,
    currentActive: 0,
    conversionRate: 0,
    averageTimeToComplete: 0,
    emailsSent: 0,
    openRate: 0,
    clickRate: 0,
    unsubscribeRate: 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex justify-between items-center backdrop-blur-xl bg-white/30 dark:bg-slate-900/30 rounded-2xl border border-white/20 dark:border-slate-700/30 p-6 shadow-2xl">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Sequence Analytics
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Track the performance of your marketing sequences with real-time insights
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48 backdrop-blur-md bg-white/50 dark:bg-slate-800/50 border-white/30 dark:border-slate-600/30 shadow-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="backdrop-blur-xl bg-white/90 dark:bg-slate-800/90 border-white/30 dark:border-slate-600/30">
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="backdrop-blur-xl bg-white/40 dark:bg-slate-800/40 border border-white/30 dark:border-slate-600/30 rounded-2xl p-2 shadow-xl">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-white/80 data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-md rounded-xl px-6 py-3 font-medium transition-all duration-200"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="sequences" 
                className="data-[state=active]:bg-white/80 data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-md rounded-xl px-6 py-3 font-medium transition-all duration-200"
              >
                Sequences
              </TabsTrigger>
              <TabsTrigger 
                value="funnel" 
                className="data-[state=active]:bg-white/80 data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-md rounded-xl px-6 py-3 font-medium transition-all duration-200"
              >
                Funnel View
              </TabsTrigger>
            </TabsList>
          </div>

        <TabsContent value="overview" className="space-y-8">
          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="backdrop-blur-xl bg-white/30 dark:bg-slate-900/30 border border-white/20 dark:border-slate-700/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <Users className="h-4 w-4" />
                  </div>
                  Total Entered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                  {stats.totalEntered.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Subscribers who entered sequences
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/30 dark:bg-slate-900/30 border border-white/20 dark:border-slate-700/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent">
                  {stats.totalCompleted.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {stats.conversionRate.toFixed(1)}% completion rate
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/30 dark:bg-slate-900/30 border border-white/20 dark:border-slate-700/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                    <Activity className="h-4 w-4" />
                  </div>
                  Currently Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 dark:from-orange-400 dark:to-orange-600 bg-clip-text text-transparent">
                  {stats.currentActive.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  In progress subscribers
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/30 dark:bg-slate-900/30 border border-white/20 dark:border-slate-700/30 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                    <Clock className="h-4 w-4" />
                  </div>
                  Avg. Time to Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
                  {stats.averageTimeToComplete > 0 ? formatDuration(stats.averageTimeToComplete) : 'N/A'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Average completion time
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Performance */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.emailsSent.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Emails Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.openRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Open Rate</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Open Rate</span>
                      <span>{stats.openRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.openRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Click Rate</span>
                      <span>{stats.clickRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.clickRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Unsubscribe Rate</span>
                      <span className="text-red-600">{stats.unsubscribeRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.unsubscribeRate} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Conversion Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{stats.conversionRate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Overall Conversion Rate</div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-2">Conversion Breakdown</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Entered Sequence</span>
                        <span>{stats.totalEntered}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Completed Sequence</span>
                        <span className="text-green-600">{stats.totalCompleted}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Still Active</span>
                        <span className="text-blue-600">{stats.currentActive}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Dropped Off</span>
                        <span className="text-red-600">
                          {stats.totalEntered - stats.totalCompleted - stats.currentActive}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step-by-Step Performance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Analyze how each step in your sequence is performing
              </p>
            </CardHeader>
            <CardContent>
              {analyticsData?.sequences && analyticsData.sequences.length > 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Step Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed step-by-step analytics will be available once sequences have defined steps.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Sequences Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first sequence to start tracking step performance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Conversion Funnel
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Visualize how subscribers move through your sequence
              </p>
            </CardHeader>
            <CardContent>
              {analyticsData?.sequences && analyticsData.sequences.length > 0 ? (
                <div className="text-center py-12">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Funnel Visualization Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Visual conversion funnel will be available once sequences have detailed step data.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Sequences Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first sequence to start tracking conversion funnel.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
