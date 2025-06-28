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
          <h1 className="text-3xl font-bold text-black" style={{letterSpacing: '-0.03em'}}>Dashboard</h1>
          <p className="text-gray-600" style={{letterSpacing: '-0.01em'}}>
            Welcome back! Here's your email marketing overview.
          </p>
        </div>
        <Button asChild className="bg-black hover:bg-gray-900 text-white text-sm font-medium rounded-full transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
          <Link href="/posts">
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((stat) => (
          <div key={stat.title} className="border border-gray-200 rounded-2xl bg-white p-6 hover:shadow-sm transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="h-5 w-5 text-gray-600" />
              <div className="text-xs text-gray-500 font-medium" style={{letterSpacing: '-0.01em'}}>
                {stat.title}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-black" style={{letterSpacing: '-0.02em'}}>{stat.value}</div>
              <p className="text-xs text-gray-500">{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="border border-gray-200 rounded-2xl bg-white shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-black" style={{letterSpacing: '-0.01em'}}>Recent Activity</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">Latest events from your campaigns</p>
          </div>
          <div className="p-6">
            {recentActivities.length > 0 ? (
              <ul className="space-y-4">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="flex items-start text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-black" style={{letterSpacing: '-0.01em'}}>{activity.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.timeAgo}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No recent activity to display.</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border border-gray-200 rounded-2xl bg-white shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-black" style={{letterSpacing: '-0.01em'}}>Quick Actions</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">Jump to key sections</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-3">
              <Button asChild variant="outline" className="justify-start border-gray-200 hover:bg-gray-50 text-black font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
                <Link href="/posts">
                  Create Post
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start border-gray-200 hover:bg-gray-50 text-black font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
                <Link href="/subscribers">
                  Manage Subscribers
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start border-gray-200 hover:bg-gray-50 text-black font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
                <Link href="/posts">
                  View Posts
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start border-gray-200 hover:bg-gray-50 text-black font-medium rounded-lg transition-colors duration-200" style={{letterSpacing: '-0.01em'}}>
                <Link href="/integrations">
                  Setup Integrations
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}