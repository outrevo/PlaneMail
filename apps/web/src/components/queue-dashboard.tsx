'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Play, Pause, Trash, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface QueueStats {
  newsletter: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  transactional: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  bulk: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  total: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  metrics: {
    totalActive: number;
    totalFailed: number;
    totalWaiting: number;
    totalCompleted: number;
  } | null;
  timestamp: string;
}

export default function QueueDashboard() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsResponse, healthResponse] = await Promise.all([
        fetch('/api/queue/stats'),
        fetch('/api/queue/health'),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.queues);
      }

      if (healthResponse.ok || healthResponse.status === 503) {
        const healthData = await healthResponse.json();
        setHealth(healthData);
      }
    } catch (error) {
      console.error('Failed to fetch queue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (action: string) => {
    setActionLoading(action);
    try {
      const response = await fetch('/api/queue/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await fetchData(); // Refresh data
      } else {
        console.error('Action failed:', action);
      }
    } catch (error) {
      console.error('Error performing action:', error);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {health && getHealthIcon(health.status)}
            Queue Health Status
          </CardTitle>
          <CardDescription>
            Overall system health and status monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {health && (
            <div className="space-y-4">
              <Badge className={getHealthColor(health.status)}>
                {health.status.toUpperCase()}
              </Badge>
              
              {health.issues.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Issues:</h4>
                  <ul className="space-y-1">
                    {health.issues.map((issue, index) => (
                      <li key={index} className="text-sm text-red-600">
                        • {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {health.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {health.metrics.totalActive}
                    </div>
                    <div className="text-sm text-gray-600">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {health.metrics.totalWaiting}
                    </div>
                    <div className="text-sm text-gray-600">Waiting</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {health.metrics.totalCompleted}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {health.metrics.totalFailed}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Queue Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Controls</CardTitle>
          <CardDescription>
            Manage queue operations and worker processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => performAction('pause')}
              disabled={actionLoading === 'pause'}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause Queues
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => performAction('resume')}
              disabled={actionLoading === 'resume'}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume Queues
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => performAction('clean')}
              disabled={actionLoading === 'clean'}
            >
              <Trash className="h-4 w-4 mr-2" />
              Clean Old Jobs
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Queue Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(stats).map(([queueName, queueStats]) => {
            if (queueName === 'total') return null;
            
            return (
              <Card key={queueName}>
                <CardHeader>
                  <CardTitle className="capitalize">{queueName} Queue</CardTitle>
                  <CardDescription>
                    Email processing statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active:</span>
                      <Badge variant="secondary">{queueStats.active}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Waiting:</span>
                      <Badge variant="outline">{queueStats.waiting}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Completed:</span>
                      <Badge className="bg-green-100 text-green-800">
                        {queueStats.completed}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Failed:</span>
                      <Badge className="bg-red-100 text-red-800">
                        {queueStats.failed}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Delayed:</span>
                      <Badge variant="outline">{queueStats.delayed}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
