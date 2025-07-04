import { Button } from '@/components/ui/button';
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
          <div key={stat.title} className="border border-neutral-200 rounded-lg bg-card p-6 hover:border-neutral-300 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="h-5 w-5 text-neutral-500" />
              <div className="text-xs text-neutral-500 uppercase tracking-wide">
                {stat.title}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-neutral-400">{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="border border-neutral-200 rounded-lg bg-card">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <h2 className="text-lg font-bold">Recent Activity</h2>
            </div>
            <p className="text-sm text-neutral-600 mt-1">Latest events from your campaigns</p>
          </div>
          <div className="p-6">
            {recentActivities.length > 0 ? (
              <ul className="space-y-4">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="flex items-start text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{activity.text}</p>
                      <p className="text-xs text-neutral-500 mt-1">{activity.timeAgo}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">No recent activity to display.</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border border-neutral-200 rounded-lg bg-card">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              <h2 className="text-lg font-bold">Quick Actions</h2>
            </div>
            <p className="text-sm text-neutral-600 mt-1">Jump to key sections</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-3">
              <Button asChild variant="outline" className="justify-start border-black/20 hover:border-black/40 font-mono">
                <Link href="/templates/editor/new">
                  Create Template
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start border-black/20 hover:border-black/40 font-mono">
                <Link href="/subscribers">
                  Manage Subscribers
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start border-black/20 hover:border-black/40 font-mono">
                <Link href="/newsletters">
                  View Newsletters
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="justify-start border-neutral-200 text-neutral-400 cursor-not-allowed" disabled>
                Analytics (Coming Soon)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
