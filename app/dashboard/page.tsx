'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
 */

// Mock data for demonstration - will be replaced with actual API calls
const mockStats: DashboardStats = {
  totalOrganizations: 247,
  activeOrganizations: 231,
  pendingRequests: 12,
  totalRevenue: 15420000,
  monthlyRevenue: 2890000,
  totalTenants: 231,
  activeTenants: 218,
  totalUsers: 15420,
  monthlyActiveUsers: 12340,
};

const mockRecentActivities = [
  {
    id: '1',
    type: 'organization_approved',
    title: 'Ubuzima Cooperative approved',
    description: 'New cooperative onboarded successfully',
    timestamp: '2 hours ago',
    icon: Building2,
    color: 'text-green-600'
  },
  {
    id: '2',
    type: 'payment_received',
    title: 'Payment received - RWF 450,000',
    description: 'Kigali Workers Cooperative - Monthly subscription',
    timestamp: '4 hours ago',
    icon: CreditCard,
    color: 'text-blue-600'
  },
  {
    id: '3',
    type: 'request_pending',
    title: 'New onboarding request',
    description: 'Nyagatare Farmers Union submitted application',
    timestamp: '6 hours ago',
    icon: FileText,
    color: 'text-orange-600'
  },
];

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // In real implementation, this would be:
        // const data = await apiClient.dashboard.getStats();
        // setStats(data);
        
        // For now, use mock data
        setTimeout(() => {
          setStats(mockStats);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
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
              <p className="text-copay-light-blue text-sm">Today</p>
              <p className="text-xl font-semibold">
                {new Date().toLocaleDateString('en-US', {
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
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            description="Current month earnings"
            icon={DollarSign}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Active Tenants"
            value={stats.activeTenants}
            description={`${stats.totalTenants} total tenants`}
            icon={Users}
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests}
            description="Awaiting approval"
            icon={FileText}
            trend={{ value: 2, isPositive: false }}
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
                {mockRecentActivities.map((activity) => {
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
                })}
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
                      {formatNumber(stats.monthlyActiveUsers)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-copay-blue" />
                      <span className="text-sm text-copay-gray">Active Organizations</span>
                    </div>
                    <span className="text-sm font-semibold text-copay-navy">
                      {formatNumber(stats.activeOrganizations)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-copay-blue" />
                      <span className="text-sm text-copay-gray">Total Transactions</span>
                    </div>
                    <span className="text-sm font-semibold text-copay-navy">
                      {formatNumber(8450)}
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