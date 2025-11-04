'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Shield,
  Users,
  AlertTriangle,
  Clock,
  Zap,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { formatNumber } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { ActivityStats, Activity as ActivityType } from '@/types';

/**
 * Activity Analytics Dashboard
 * Comprehensive analytics and monitoring for system activities
 */

interface ActivityTrend {
  date: string;
  total: number;
  security: number;
  logins: number;
  payments: number;
}

interface TopUser {
  userId: string;
  userName: string;
  userPhone: string;
  activityCount: number;
  lastActivity: string;
  riskScore: number;
}

interface SecurityAlert {
  id: string;
  type: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  count: number;
  lastOccurrence: string;
}

function ActivityAnalyticsPage() {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('7d');

  // Chart trend data for visualization - could be enhanced to come from analytics API
  const [activityTrends] = useState<ActivityTrend[]>([
    { date: '2024-01-01', total: 245, security: 12, logins: 89, payments: 67 },
    { date: '2024-01-02', total: 289, security: 8, logins: 95, payments: 73 },
    { date: '2024-01-03', total: 312, security: 15, logins: 102, payments: 81 },
    { date: '2024-01-04', total: 278, security: 5, logins: 88, payments: 69 },
    { date: '2024-01-05', total: 334, security: 18, logins: 115, payments: 92 },
    { date: '2024-01-06', total: 298, security: 9, logins: 97, payments: 78 },
    { date: '2024-01-07', total: 356, security: 22, logins: 128, payments: 105 },
  ]);

  const [topUsers] = useState<TopUser[]>([
    { 
      userId: '1', 
      userName: 'John Doe', 
      userPhone: '+1234567890', 
      activityCount: 45, 
      lastActivity: '2024-01-07T10:30:00Z', 
      riskScore: 2 
    },
    { 
      userId: '2', 
      userName: 'Jane Smith', 
      userPhone: '+1234567891', 
      activityCount: 38, 
      lastActivity: '2024-01-07T09:15:00Z', 
      riskScore: 1 
    },
    { 
      userId: '3', 
      userName: 'Mike Johnson', 
      userPhone: '+1234567892', 
      activityCount: 52, 
      lastActivity: '2024-01-07T11:45:00Z', 
      riskScore: 5 
    },
  ]);

  const [securityAlerts] = useState<SecurityAlert[]>([
    {
      id: '1',
      type: 'HIGH',
      title: 'Multiple Failed Logins',
      description: 'Unusual number of failed login attempts detected',
      count: 15,
      lastOccurrence: '2024-01-07T12:00:00Z'
    },
    {
      id: '2',
      type: 'MEDIUM',
      title: 'Suspicious Login Locations',
      description: 'Logins from new geographical locations',
      count: 8,
      lastOccurrence: '2024-01-07T11:30:00Z'
    },
    {
      id: '3',
      type: 'LOW',
      title: 'Password Reset Requests',
      description: 'Increased password reset activity',
      count: 12,
      lastOccurrence: '2024-01-07T10:15:00Z'
    },
  ]);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch statistics and recent activities
      const [statsResponse, activitiesResponse] = await Promise.all([
        apiClient.activities.getStats(),
        apiClient.activities.getAll({ page: 1, limit: 10 })
      ]);

      setStats(statsResponse as ActivityStats);
      
      const activityData = Array.isArray(activitiesResponse) 
        ? activitiesResponse 
        : (activitiesResponse.data || activitiesResponse);
      setRecentActivities(activityData as ActivityType[]);
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      const errorMessage = (err as Error)?.message || 'Failed to load analytics data.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const getAlertBadge = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'HIGH':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">Medium Risk</Badge>;
      case 'LOW':
        return <Badge variant="secondary">Low Risk</Badge>;
    }
  };

  const getRiskScoreBadge = (score: number) => {
    if (score >= 8) return <Badge variant="destructive">High Risk</Badge>;
    if (score >= 4) return <Badge variant="warning">Medium Risk</Badge>;
    return <Badge variant="success">Low Risk</Badge>;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <TrendingUp className="h-4 w-4 text-gray-500" />;
  };

  const calculateGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-copay-navy flex items-center gap-2">
              <BarChart3 className="text-copay-blue" />
              Activity Analytics
            </h1>
            <p className="text-copay-gray">
              Comprehensive insights and monitoring of system activities
            </p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" asChild>
              <Link href="/activities">
                <Activity className="h-4 w-4 mr-2" />
                View Activities
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/activities/security">
                <Shield className="h-4 w-4 mr-2" />
                Security Events
              </Link>
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-copay-navy mb-2">Failed to load analytics</h3>
              <p className="text-copay-gray mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </CardContent>
          </Card>
        )}

        {/* Activity Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-copay-gray">
                Total Activities
              </CardTitle>
              <Activity className="h-4 w-4 text-copay-gray" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-copay-navy">
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  formatNumber(stats?.total || 0)
                )}
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                {getTrendIcon(activityTrends[6]?.total || 0, activityTrends[5]?.total || 0)}
                <span>{calculateGrowthPercentage(activityTrends[6]?.total || 0, activityTrends[5]?.total || 0)}% from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-copay-gray">
                Security Events
              </CardTitle>
              <Shield className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  formatNumber(stats?.securityEvents || 0)
                )}
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                {getTrendIcon(activityTrends[6]?.security || 0, activityTrends[5]?.security || 0)}
                <span>{calculateGrowthPercentage(activityTrends[6]?.security || 0, activityTrends[5]?.security || 0)}% from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-copay-gray">
                Active Users
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  formatNumber(activityTrends[6]?.logins || 0)
                )}
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                {getTrendIcon(activityTrends[6]?.logins || 0, activityTrends[5]?.logins || 0)}
                <span>{calculateGrowthPercentage(activityTrends[6]?.logins || 0, activityTrends[5]?.logins || 0)}% from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-copay-gray">
                Payments Today
              </CardTitle>
              <Zap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? (
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                ) : (
                  formatNumber(activityTrends[6]?.payments || 0)
                )}
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                {getTrendIcon(activityTrends[6]?.payments || 0, activityTrends[5]?.payments || 0)}
                <span>{calculateGrowthPercentage(activityTrends[6]?.payments || 0, activityTrends[5]?.payments || 0)}% from yesterday</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Activity Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Activity Trends
              </CardTitle>
              <CardDescription>
                Daily activity patterns over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityTrends.map((trend) => (
                  <div key={trend.date} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium text-copay-gray">
                        {new Date(trend.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-copay-navy">{trend.total}</div>
                        <div className="text-xs text-copay-gray">Total</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-600">{trend.security}</div>
                        <div className="text-xs text-copay-gray">Security</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-blue-600">{trend.logins}</div>
                        <div className="text-xs text-copay-gray">Logins</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">{trend.payments}</div>
                        <div className="text-xs text-copay-gray">Payments</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Security Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Security Alerts
              </CardTitle>
              <CardDescription>
                Recent security events and threat indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getAlertBadge(alert.type)}
                        <h4 className="font-medium text-copay-navy">{alert.title}</h4>
                      </div>
                      <p className="text-sm text-copay-gray">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-copay-gray">
                        <span>Count: {alert.count}</span>
                        <span>Last: {new Date(alert.lastOccurrence).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Users and Recent Activities */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Active Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Most Active Users
              </CardTitle>
              <CardDescription>
                Users with the highest activity levels in the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topUsers.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium text-copay-navy">{user.userName}</div>
                      <div className="text-sm text-copay-gray">{user.userPhone}</div>
                      <div className="text-xs text-copay-gray">
                        Last active: {new Date(user.lastActivity).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm font-bold text-copay-navy">{user.activityCount} activities</div>
                      {getRiskScoreBadge(user.riskScore)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activities
              </CardTitle>
              <CardDescription>
                Latest system activities and user interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-copay-gray text-sm">No recent activities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {activity.isSecurityEvent ? (
                          <Shield className="h-4 w-4 text-red-500 mt-0.5" />
                        ) : (
                          <Activity className="h-4 w-4 text-copay-gray mt-0.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-copay-navy truncate">
                          {activity.description}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-copay-gray">
                          <span>{activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System'}</span>
                          <span>•</span>
                          <span>{new Date(activity.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(ActivityAnalyticsPage);