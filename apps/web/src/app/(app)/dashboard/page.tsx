import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, LineChart, Users, Mail, PieChart, Activity, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats, getRecentActivityItems, type DashboardStats, type ActivityItem } from './actions';

export default async function DashboardPage() {
  const statsData: DashboardStats = await getDashboardStats();
  const recentActivities: ActivityItem[] = await getRecentActivityItems();

  const dashboardCards = [
    { title: 'Total Subscribers', value: statsData.totalSubscribers.toLocaleString(), icon: Users, trend: '+12% this month' },
    { title: 'Posts Sent', value: statsData.postsSent.toLocaleString(), icon: Mail, trend: '+5 last week' },
    { title: 'Avg. Open Rate', value: 'N/A', icon: BarChart, trend: 'Tracking coming soon' },
    { title: 'Avg. Click Rate', value: 'N/A', icon: LineChart, trend: 'Tracking coming soon' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground" style={{letterSpacing: '-0.03em'}}>Dashboard</h1>
          <p className="text-muted-foreground" style={{letterSpacing: '-0.01em'}}>
            Welcome back! Here's your email marketing overview.
          </p>
        </div>
        <Button asChild className="text-sm font-medium rounded-full transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
          <Link href="/posts">
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-sm transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <div className="text-xs text-muted-foreground font-medium" style={{letterSpacing: '-0.01em'}}>
                  {stat.title}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground" style={{letterSpacing: '-0.02em'}}>{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.trend}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg" style={{letterSpacing: '-0.01em'}}>Recent Activity</CardTitle>
            </div>
            <CardDescription>Latest events from your campaigns</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {recentActivities.length > 0 ? (
              <ul className="space-y-4">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="flex items-start text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-foreground" style={{letterSpacing: '-0.01em'}}>{activity.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.timeAgo}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity to display.</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg" style={{letterSpacing: '-0.01em'}}>Quick Actions</CardTitle>
            </div>
            <CardDescription>Jump to key sections</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-3">
              <Button asChild variant="outline" className="justify-start font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
                <Link href="/posts">
                  Create Post
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
                <Link href="/subscribers">
                  Manage Subscribers
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
                <Link href="/posts">
                  View Posts
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
                <Link href="/integrations">
                  Setup Integrations
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}