
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
    { title: 'Newsletters Sent', value: statsData.newslettersSent.toLocaleString(), icon: Mail, trend: '+5 last week' },
    { title: 'Avg. Open Rate', value: 'N/A', icon: BarChart, trend: 'Tracking coming soon' },
    { title: 'Avg. Click Rate', value: 'N/A', icon: LineChart, trend: 'Tracking coming soon' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-neutral-600">
            Welcome back! Here's your email marketing overview.
          </p>
        </div>
        <Button asChild className="bg-black hover:bg-black/90 text-white font-mono">
          <Link href="/newsletters/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Newsletter
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((stat) => (
          <div key={stat.title} className="border border-neutral-200 rounded-lg bg-white p-6 hover:border-neutral-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="h-5 w-5 text-neutral-500" />
              <div className="text-xs text-neutral-500 uppercase tracking-wide">
                {stat.title}
              </div>
            </div>
            <div className="space-y-1">{
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground pt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest events from your campaigns and subscribers.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <ul className="space-y-3">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="flex items-start text-sm">
                    <div className="ml-0 flex-1">
                      <p className="font-medium">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">{activity.timeAgo}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity to display.</p>
            )}
            {/* <Button variant="link" className="mt-4 px-0">View all activity</Button> */}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Quick Links
            </CardTitle>
            <CardDescription>Jump to key sections of PlaneMail.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" asChild className="justify-start">
              <Link href="/templates/editor/new">Create New Template</Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
               <Link href="/subscribers">Manage Subscribers</Link>
            </Button>
             <Button variant="outline" asChild className="justify-start">
               <Link href="/newsletters">View Sent Newsletters</Link>
            </Button>
            <Button variant="outline" asChild className="justify-start" disabled>
               <Link href="#">View Reports (Soon)</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
