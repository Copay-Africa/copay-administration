'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  CreditCard,
  DollarSign,
  TrendingUp,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { Payment, PaymentFilters, PaymentAnalytics, RevenueAnalytics } from '@/types';



/**
 * Payments Management Page
 * Monitor and track organization payment transactions
 */

function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    limit: 20,
    search: '',
    status: undefined,
  });

  useEffect(() => {
    const fetchPaymentsAndAnalytics = async () => {
      setLoading(true);
      setAnalyticsLoading(true);
      setRevenueLoading(true);
      setError('');
      try {
        console.log('Fetching payments with filters:', filters);
        
        // Fetch payments and analytics first
        const [paymentsResponse, analyticsResponse] = await Promise.all([
          apiClient.payments.getOrganizationPayments(filters),
          apiClient.payments.getAnalytics()
        ]);

        setPayments((paymentsResponse.data as Payment[]) || []);
        setAnalytics(analyticsResponse as PaymentAnalytics);
        
        // Try to fetch revenue analytics
        try {
          const revenueResponse = await apiClient.payments.getRevenueAnalytics();
          if (revenueResponse && typeof revenueResponse === 'object') {
            setRevenueAnalytics(revenueResponse as RevenueAnalytics);
          } else {
            throw new Error('Invalid revenue analytics response');
          }
        } catch (revenueError) {
          console.warn('Revenue analytics endpoint not available:', revenueError);
          // Revenue analytics not available
          setRevenueAnalytics(null);
        }
      } catch (err) {
        console.error('Failed to fetch payments:', err);
        const errorMessage = (err as Error)?.message || 'Failed to load payments. Please try again.';
        setError(errorMessage);
        setPayments([]);
        setAnalytics(null);
        setRevenueAnalytics(null);
      } finally {
        setLoading(false);
        setAnalyticsLoading(false);
        setRevenueLoading(false);
      }
    };

    fetchPaymentsAndAnalytics();
  }, [filters]);  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'TIMEOUT':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'PROCESSING':
        return <Badge variant="secondary">Processing</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">Cancelled</Badge>;
      case 'TIMEOUT':
        return <Badge variant="outline">Timeout</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'MOBILE_MONEY_MTN':
        return 'MTN MoMo';
      case 'MOBILE_MONEY_AIRTEL':
        return 'Airtel Money';
      case 'BANK_BK':
        return 'Bank of Kigali';
      case 'BANK_TRANSFER':
        return 'Bank Transfer';
      case 'CREDIT_CARD':
        return 'Credit Card';
      default:
        return method.replace(/_/g, ' ');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-1 sm:p-0"> {/* Add subtle padding on mobile */}
        {/* Page Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Payments</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Monitor subscription payments and transaction history
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>

        {/* Payment Analytics */}
        {error ? (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Failed to load payments</h3>
              <p className="text-muted-foreground mb-4 text-center">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </CardContent>
          </Card>
        ) : analytics && !analyticsLoading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Volume
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {formatNumber(analytics.totalVolume)}
                </div>
                <p className="text-xs text-muted-foreground">
                  transactions processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Amount
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {formatCurrency(analytics.totalAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  total revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Amount
                </CardTitle>
                <DollarSign className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {formatCurrency(Math.round(analytics.averageAmount))}
                </div>
                <p className="text-xs text-muted-foreground">
                  per transaction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Success Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  {analytics.successRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  completion rate
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                  <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Professional Payment Analytics Charts */}
        {analytics && !analyticsLoading && analytics.methodDistribution && analytics.methodDistribution.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
            {/* Payment Methods Distribution Pie Chart */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-foreground flex items-center gap-2 text-base sm:text-lg">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Payment Methods Distribution
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Breakdown of payment methods used
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <div className="w-full" style={{ height: 'clamp(200px, 40vw, 300px)' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={analytics.methodDistribution.map(item => ({
                          name: getPaymentMethodName(item.method),
                          value: item.count,
                          amount: item.amount || 0,
                          percentage: item.percentage
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                          label={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.methodDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={[
                            'hsl(var(--chart-1))', // Primary
                            'hsl(var(--chart-2))', // Secondary
                            'hsl(var(--chart-3))', // Accent
                            'hsl(var(--chart-4))', // Muted
                            'hsl(var(--chart-5))'  // Destructive
                          ][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value: number, name: string) => [
                          `${formatNumber(Number(value))} transactions`,
                          name
                        ]} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status Distribution Bar Chart */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-foreground flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Payment Status Breakdown
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Transaction status distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <div className="w-full" style={{ height: 'clamp(200px, 40vw, 300px)' }}>
                  <ResponsiveContainer>
                    <BarChart data={analytics.statusDistribution.map(item => ({
                      status: item.status,
                      count: item.count,
                      amount: item.amount || 0,
                      percentage: item.percentage
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="status" 
                        fontSize={10}
                        tickMargin={5}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value: number) => [
                          `${formatNumber(Number(value))} transactions`,
                          'Count'
                        ]} 
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {analytics.statusDistribution.map((entry, index) => (
                          <Cell key={`status-cell-${index}`} fill={
                            entry.status === 'COMPLETED' ? 'hsl(var(--chart-1))' :
                              entry.status === 'FAILED' ? 'hsl(var(--destructive))' :
                                entry.status === 'PENDING' ? 'hsl(var(--warning))' :
                                  'hsl(var(--muted-foreground))'
                          } />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : analytics && !analyticsLoading ? (
          <Card className="border-muted bg-muted/5">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Analytics Data Available</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Analytics data will appear here once payment transactions have been processed. Check back after some activity.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Popular Payment Method Highlight */}
        {analytics && !analyticsLoading && analytics.mostPopularMethod && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <h4 className="text-sm font-medium text-primary mb-1">Most Popular Payment Method</h4>
                  <p className="text-base sm:text-lg font-bold text-foreground">
                    {getPaymentMethodName(analytics.mostPopularMethod)}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Preferred by customers</p>
                </div>
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary self-center" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue Analytics Section */}
        {revenueAnalytics && !revenueLoading && revenueAnalytics.revenueTrends && revenueAnalytics.revenueTrends.length > 0 ? (
          <div className="space-y-6 border-t border-border pt-6"> {/* Add top border to separate sections */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Revenue Analytics</h2>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export Revenue Data</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </div>

            {/* Revenue Stats Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-xl sm:text-2xl font-bold text-foreground">
                    {formatCurrency(revenueAnalytics.totalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    all-time revenue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Growth Rate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-xl sm:text-2xl font-bold text-foreground">
                    {revenueAnalytics.growthPercentage.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    revenue growth
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Per User
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-xl sm:text-2xl font-bold text-foreground">
                    {formatCurrency(revenueAnalytics.averageRevenuePerUser)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    per user
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Per Cooperative
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-secondary-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="text-xl sm:text-2xl font-bold text-foreground">
                    {formatCurrency(revenueAnalytics.averageRevenuePerCooperative)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    per cooperative
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Charts */}
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
              {/* Revenue Trends Area Chart */}
              <Card className="xl:col-span-2 border border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2 text-base sm:text-lg">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Revenue Trends
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Revenue and transaction trends over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-6">
                  <div className="w-full" style={{ height: 'clamp(250px, 50vw, 400px)' }}>
                    <ResponsiveContainer>
                      <AreaChart data={revenueAnalytics.revenueTrends.map(trend => ({
                        date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        revenue: trend.revenue,
                        transactions: trend.transactionCount
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="revenue" orientation="left" />
                        <YAxis yAxisId="transactions" orientation="right" />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            name === 'revenue' ? formatCurrency(value) : `${formatNumber(value)} transactions`,
                            name === 'revenue' ? 'Revenue' : 'Transactions'
                          ]}
                          labelFormatter={(label: string) => `Date: ${label}`}
                        />
                        <Legend />
                        <Area 
                          yAxisId="revenue"
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="hsl(var(--chart-1))" 
                          fill="hsl(var(--chart-1))"
                          fillOpacity={0.3}
                          strokeWidth={2}
                          name="Revenue"
                        />
                        <Line 
                          yAxisId="transactions"
                          type="monotone" 
                          dataKey="transactions" 
                          stroke="hsl(var(--chart-2))" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name="Transactions"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue by Cooperative Pie Chart */}
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-2 sm:pb-6">
                  <CardTitle className="text-foreground flex items-center gap-2 text-base sm:text-lg">
                    <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Revenue by Cooperative
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Top revenue-generating cooperatives
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-6">
                  <div className="w-full" style={{ height: 'clamp(200px, 40vw, 300px)' }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={revenueAnalytics.revenueByCooperative.slice(0, 6).map(item => ({
                            name: item.cooperativeName,
                            value: item.revenue,
                            percentage: item.percentage
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {revenueAnalytics.revenueByCooperative.slice(0, 6).map((entry, index) => (
                            <Cell key={`coop-cell-${index}`} fill={[
                              'hsl(var(--chart-1))', // Primary
                              'hsl(var(--chart-2))', // Secondary
                              'hsl(var(--chart-3))', // Accent
                              'hsl(var(--chart-4))', // Muted
                              'hsl(var(--chart-5))', // Warning
                              'hsl(var(--muted-foreground))'  // Gray
                            ][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: 'hsl(var(--foreground))'
                          }}
                          formatter={(value: number, name: string) => [
                            formatCurrency(value), 
                            name
                          ]} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue by Payment Method Bar Chart */}
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-2 sm:pb-6">
                  <CardTitle className="text-foreground flex items-center gap-2 text-base sm:text-lg">
                    <BarChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Revenue by Payment Method
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Revenue breakdown by payment methods
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-2 sm:p-6">
                  <div className="w-full" style={{ height: 'clamp(200px, 40vw, 300px)' }}>
                    <ResponsiveContainer>
                      <BarChart data={revenueAnalytics.revenueByMethod.map(item => ({
                        method: getPaymentMethodName(item.method),
                        revenue: item.revenue,
                        percentage: item.percentage
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="method" 
                          fontSize={10}
                          tickMargin={5}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: 'hsl(var(--foreground))'
                          }}
                          formatter={(value: number) => [
                            formatCurrency(value),
                            'Revenue'
                          ]} 
                        />
                        <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                          {revenueAnalytics.revenueByMethod.map((entry, index) => (
                            <Cell key={`method-cell-${index}`} fill={[
                              'hsl(var(--chart-1))', // Primary
                              'hsl(var(--chart-2))', // Secondary
                              'hsl(var(--chart-3))', // Accent
                              'hsl(var(--chart-4))', // Muted
                              'hsl(var(--chart-5))'  // Warning
                            ][index % 5]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : revenueAnalytics && !revenueLoading ? (
          <div className="space-y-6 border-t border-border pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Revenue Analytics</h2>
              </div>
            </div>
            <Card className="border-muted bg-muted/5">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Revenue Data Available</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Revenue analytics will be displayed here once payment transactions generate revenue data.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : revenueLoading ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Revenue Analytics</h2>
              <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-20"></div>
                    <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-muted rounded animate-pulse w-24 mb-2"></div>
                    <div className="h-3 bg-muted rounded animate-pulse w-16"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        {/* Payments Table */}
        <Card className="border border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-foreground">Payment Transactions</CardTitle>
            <CardDescription>
              All payment transactions across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <Select value={filters.status || 'all'} onValueChange={(status) =>
                setFilters(prev => ({ ...prev, status: status === 'all' ? undefined : status as typeof filters.status }))
              }>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="TIMEOUT">Timeout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-4 bg-muted rounded w-1/6"></div>
                    <div className="h-4 bg-muted rounded w-1/6"></div>
                    <div className="h-4 bg-muted rounded w-1/6"></div>
                    <div className="h-4 bg-muted rounded w-1/6"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-border rounded-lg table-mobile-scroll">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Reference</TableHead>
                      <TableHead className="text-xs sm:text-sm">Sender</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Type</TableHead>
                      <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Method</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Date</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="p-2 sm:p-4">
                          <div className="font-mono text-xs sm:text-sm">
                            {payment.paymentReference}
                          </div>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4">
                          <div>
                            <div className="font-medium text-foreground text-xs sm:text-sm">
                              {payment.sender.firstName} {payment.sender.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {payment.sender.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 hidden sm:table-cell">
                          <div>
                            <div className="font-medium text-foreground text-xs sm:text-sm">
                              {payment.paymentType.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {payment.cooperative.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4">
                          <div className="font-semibold text-foreground text-xs sm:text-sm">
                            {formatCurrency(payment.amount)}
                          </div>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            {getStatusIcon(payment.status)}
                            <div className="hidden sm:block">
                              {getStatusBadge(payment.status)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 hidden md:table-cell">
                          <div className="flex items-center">
                            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mr-1 sm:mr-2" />
                            <span className="text-xs sm:text-sm">
                              {getPaymentMethodName(payment.paymentMethod)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="p-2 sm:p-4 hidden lg:table-cell">
                          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right p-2 sm:p-4">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/payments/${payment.id}`}>
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {!loading && payments.length === 0 && (
                  <div className="text-center py-6 sm:py-8 px-4">
                    <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
                      No payments found
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground px-2">
                      {filters.search || filters.status
                        ? 'No payments match your current filters. Try adjusting your search criteria.'
                        : 'Payment transactions will appear here once members start making payments to their cooperatives.'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(PaymentsPage);