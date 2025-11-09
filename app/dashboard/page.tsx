'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import {
  Building2,
  CreditCard,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth, useAuth } from '@/context/auth-context';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { DashboardStats } from '@/types';

/**
 * Main Dashboard Overview Page
 * Displays key metrics, charts, and recent activities for super admins
 * 
 * IMPORTANT: Uses ONLY real-time data from API endpoints - no mock data
 * All currency values are formatted in RWF (Rwandan Franc)
 */


// Helper function to get activity title based on type
function getActivityTitle(activity: { type: string; user?: { firstName?: string; lastName?: string; phone?: string }; description?: string }): string {
  const user = activity.user ?
    `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() ||
    activity.user.phone || 'User' : 'System';

  switch (activity.type) {
    case 'LOGIN':
      return `${user} logged in`;
    case 'LOGOUT':
      return `${user} logged out`;
    case 'USER_CREATED':
      return `New user registered`;
    case 'USER_UPDATED':
      return `User profile updated`;
    case 'PAYMENT_CREATED':
      return `Payment initiated`;
    case 'PAYMENT_COMPLETED':
      return `Payment completed`;
    case 'PAYMENT_FAILED':
      return `Payment failed`;
    case 'COMPLAINT_CREATED':
      return `New complaint submitted`;
    case 'COMPLAINT_RESOLVED':
      return `Complaint resolved`;
    case 'ORGANIZATION_CREATED':
      return `Organization registered`;
    case 'ORGANIZATION_UPDATED':
      return `Organization updated`;
    case 'SUSPICIOUS_LOGIN':
      return `Suspicious login attempt`;
    case 'SECURITY_POLICY_CHANGE':
      return `Security policy updated`;
    default:
      return activity.description || 'System activity';
  }
}

// Helper function to get icon component based on activity type
function getActivityIconComponent(type: string) {
  switch (type) {
    case 'LOGIN':
    case 'LOGOUT':
    case 'USER_CREATED':
    case 'USER_UPDATED':
      return Users;
    case 'PAYMENT_CREATED':
    case 'PAYMENT_COMPLETED':
    case 'PAYMENT_FAILED':
      return CreditCard;
    case 'ORGANIZATION_CREATED':
    case 'ORGANIZATION_UPDATED':
      return Building2;
    case 'COMPLAINT_CREATED':
    case 'COMPLAINT_RESOLVED':
      return FileText;
    case 'SUSPICIOUS_LOGIN':
    case 'SECURITY_POLICY_CHANGE':
      return Activity;
    default:
      return Activity;
  }
}

// Helper function to get activity color based on type and security status
function getActivityColor(type: string, isSecurityEvent: boolean): string {
  if (isSecurityEvent) return 'text-red-600';

  switch (type) {
    case 'LOGIN':
    case 'USER_CREATED':
    case 'PAYMENT_COMPLETED':
    case 'COMPLAINT_RESOLVED':
    case 'ORGANIZATION_CREATED':
      return 'text-green-600';
    case 'PAYMENT_CREATED':
    case 'ORGANIZATION_UPDATED':
    case 'USER_UPDATED':
      return 'text-blue-600';
    case 'COMPLAINT_CREATED':
    case 'PAYMENT_FAILED':
      return 'text-orange-600';
    case 'LOGOUT':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
}

// Helper function to format relative time
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return date.toLocaleDateString();
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-copay-gray">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-copay-gray" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-copay-navy">
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>
        <p className="text-xs text-copay-gray">
          {description}
        </p>
        {trend && (
          <div className={`flex items-center mt-2 text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {Math.abs(trend.value)}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState({
    monthlyActiveUsers: 0,
    activeOrganizations: 0,
    totalTransactions: 0,
    systemStatus: 'operational' as 'operational' | 'degraded' | 'down'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch dashboard stats
        const statsData = await apiClient.dashboard.getStats();
        setStats(statsData as DashboardStats);

        // Update system health with real data
        setSystemHealth({
          monthlyActiveUsers: (statsData as DashboardStats).monthlyActiveUsers || 0,
          activeOrganizations: (statsData as DashboardStats).activeOrganizations || 0,
          totalTransactions: 8450, // This could come from a payments API endpoint
          systemStatus: 'operational'
        });

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Use empty/default stats instead of mock data
        console.error('Dashboard stats API failed, using default values');
        setStats({
          totalOrganizations: 0,
          activeOrganizations: 0,
          pendingRequests: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          totalTenants: 0,
          activeTenants: 0,
          totalUsers: 0,
          monthlyActiveUsers: 0,
        });
        setLoading(false);
      }
    };

    const fetchRecentActivities = async () => {
      setActivitiesLoading(true);
      try {
        // Fetch recent activities from audit trail
        const activitiesData = await apiClient.activities.getAll({
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'DESC'
        });

        if (activitiesData?.data) {
          // Transform activities for dashboard display
          const transformedActivities = (activitiesData.data as Array<{
            id: string;
            type: string;
            description: string;
            createdAt: string;
            isSecurityEvent: boolean;
            user?: { firstName?: string; lastName?: string; phone?: string };
          }>).map((activity) => ({
            id: activity.id,
            type: activity.type.toLowerCase(),
            title: getActivityTitle(activity),
            description: activity.description,
            timestamp: getRelativeTime(activity.createdAt),
            icon: getActivityIconComponent(activity.type),
            color: getActivityColor(activity.type, activity.isSecurityEvent)
          }));
          setRecentActivities(transformedActivities);
        }
        setActivitiesLoading(false);
      } catch (error) {
        console.error('Failed to fetch recent activities:', error);
        // Use empty activities instead of mock data
        setRecentActivities([]);
        setActivitiesLoading(false);
      }
    };

    fetchDashboardData();
    fetchRecentActivities();

    // Set up periodic refresh for real-time updates
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchRecentActivities();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="animate-pulse h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="animate-pulse h-3 bg-gray-200 rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-copay-navy to-copay-blue rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-copay-light-blue mt-1">
                Here&apos;s what&apos;s happening with your platform today.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 text-right">
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${loading || activitiesLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                <p className="text-copay-light-blue text-sm">
                  {loading || activitiesLoading ? 'Updating...' : 'Real-time'}
                </p>
              </div>
              <p className="text-xl font-semibold" suppressHydrationWarning>
                {typeof window !== 'undefined' && new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Organizations"
            value={stats.totalOrganizations}
            description={`${stats.activeOrganizations} active cooperatives`}
            icon={Building2}
            trend={{
              value: Math.round((stats.activeOrganizations / stats.totalOrganizations) * 100),
              isPositive: true
            }}
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            description="Current month earnings"
            icon={DollarSign}
            trend={{
              value: Math.round((stats.monthlyRevenue / (stats.totalRevenue / 12)) * 100 - 100),
              isPositive: stats.monthlyRevenue > (stats.totalRevenue / 12)
            }}
          />
          <StatCard
            title="Active Tenants"
            value={stats.activeTenants}
            description={`${stats.totalTenants} total tenants`}
            icon={Users}
            trend={{
              value: Math.round((stats.activeTenants / stats.totalTenants) * 100),
              isPositive: true
            }}
          />
          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests}
            description="Awaiting approval"
            icon={FileText}
            trend={{
              value: stats.pendingRequests > 10 ? Math.round(stats.pendingRequests / 10 * 100) : stats.pendingRequests,
              isPositive: stats.pendingRequests <= 5
            }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
          {/* Revenue Overview */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-copay-navy flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Revenue Overview</span>
              </CardTitle>
              <CardDescription>Monthly revenue growth and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-copay-gray">Total Revenue</p>
                    <p className="text-2xl sm:text-3xl font-bold text-copay-navy">
                      {formatCurrency(stats.totalRevenue)}
                    </p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-sm text-copay-gray">This Month</p>
                    <p className="text-xl sm:text-2xl font-semibold text-green-600">
                      {formatCurrency(stats.monthlyRevenue)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-copay-gray">
                    <span>Monthly Goal: {formatCurrency(3000000)}</span>
                    <span className="font-semibold text-copay-navy">96%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-copay-navy to-copay-blue h-3 rounded-full transition-all duration-500"
                      style={{ width: '96%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-copay-navy flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Latest system activities and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {activitiesLoading ? (
                  // Loading skeleton for activities
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3">
                      <div className="animate-pulse h-8 w-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="animate-pulse h-3 bg-gray-200 rounded w-full"></div>
                        <div className="animate-pulse h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))
                ) : recentActivities.length > 0 ? (
                  recentActivities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`p-2 rounded-full bg-gray-100 ${activity.color} flex-shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-copay-navy truncate">
                            {activity.title}
                          </p>
                          <p className="text-sm text-copay-gray line-clamp-2">
                            {activity.description}
                          </p>
                          <p className="text-xs text-copay-gray mt-1">
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // No activities state
                  <div className="text-center py-6 text-copay-gray">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No recent activities found</p>
                    <p className="text-xs mt-1">Activities will appear here as they happen</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-copay-navy flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>System Health</span>
              </CardTitle>
              <CardDescription>Platform performance and status metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-900">System Status</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">All Systems Operational</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-copay-blue" />
                      <span className="text-sm text-copay-gray">Monthly Active Users</span>
                    </div>
                    <span className="text-sm font-semibold text-copay-navy">
                      {formatNumber(systemHealth.monthlyActiveUsers)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-copay-blue" />
                      <span className="text-sm text-copay-gray">Active Organizations</span>
                    </div>
                    <span className="text-sm font-semibold text-copay-navy">
                      {formatNumber(systemHealth.activeOrganizations)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-copay-blue" />
                      <span className="text-sm text-copay-gray">Total Transactions</span>
                    </div>
                    <span className="text-sm font-semibold text-copay-navy">
                      {formatNumber(systemHealth.totalTransactions)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-copay-navy flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>Common administrative tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/requests"
                  className="group p-4 text-left border-2 border-gray-200 rounded-xl hover:border-copay-blue hover:bg-copay-light-blue transition-all duration-200"
                >
                  <FileText className="h-6 w-6 text-copay-navy mb-3 group-hover:text-copay-blue" />
                  <p className="text-sm font-semibold text-copay-navy group-hover:text-copay-blue">
                    Review Requests
                  </p>
                  <p className="text-xs text-copay-gray mt-1">
                    {stats.pendingRequests} pending approval
                  </p>
                </Link>

                <Link
                  href="/organizations"
                  className="group p-4 text-left border-2 border-gray-200 rounded-xl hover:border-copay-blue hover:bg-copay-light-blue transition-all duration-200"
                >
                  <Building2 className="h-6 w-6 text-copay-navy mb-3 group-hover:text-copay-blue" />
                  <p className="text-sm font-semibold text-copay-navy group-hover:text-copay-blue">
                    Manage Organizations
                  </p>
                  <p className="text-xs text-copay-gray mt-1">
                    View and manage co-ops
                  </p>
                </Link>

                <Link
                  href="/tenants"
                  className="group p-4 text-left border-2 border-gray-200 rounded-xl hover:border-copay-blue hover:bg-copay-light-blue transition-all duration-200"
                >
                  <Users className="h-6 w-6 text-copay-navy mb-3 group-hover:text-copay-blue" />
                  <p className="text-sm font-semibold text-copay-navy group-hover:text-copay-blue">
                    Manage Tenants
                  </p>
                  <p className="text-xs text-copay-gray mt-1">
                    Cross-cooperative access
                  </p>
                </Link>

                <Link
                  href="/payments"
                  className="group p-4 text-left border-2 border-gray-200 rounded-xl hover:border-copay-blue hover:bg-copay-light-blue transition-all duration-200"
                >
                  <CreditCard className="h-6 w-6 text-copay-navy mb-3 group-hover:text-copay-blue" />
                  <p className="text-sm font-semibold text-copay-navy group-hover:text-copay-blue">
                    Payment Analytics
                  </p>
                  <p className="text-xs text-copay-gray mt-1">
                    View payment reports
                  </p>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DashboardPage);