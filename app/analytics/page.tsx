'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    CreditCard,
    Building2,
    AlertTriangle,
    Activity,
    Download,
    RefreshCw,
    FileText,
    PieChart,
    LineChart,
    DollarSign,
    Clock,
    Shield
} from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    LineChart as RechartsLineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import type { AnalyticsSummary } from '@/types';

interface AnalyticsFilters {
    period: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year';
    cooperativeId?: string;
}

export default function AnalyticsPage() {
    const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<AnalyticsFilters>({
        period: 'last_30_days'
    });
    const [refreshing, setRefreshing] = useState(false);
    const [exportingData, setExportingData] = useState<string | null>(null);

    // Sample data for charts
    const userActivityData = [
        { month: 'Jan', users: 450 },
        { month: 'Feb', users: 520 },
        { month: 'Mar', users: 680 },
        { month: 'Apr', users: 720 },
        { month: 'May', users: 890 },
        { month: 'Jun', users: 1020 },
    ];

    const paymentTrendsData = [
        { month: 'Jan', volume: 12500 },
        { month: 'Feb', volume: 15800 },
        { month: 'Mar', volume: 18900 },
        { month: 'Apr', volume: 22100 },
        { month: 'May', volume: 25400 },
        { month: 'Jun', volume: 28700 },
    ];

    const organizationData = [
        { name: 'Cooperative', value: 45 },
        { name: 'NGO', value: 25 },
        { name: 'Association', value: 20 },
        { name: 'Foundation', value: 10 },
    ];

    const paymentDistributionData = [
        { method: 'Card', count: 1250 },
        { method: 'Bank Transfer', count: 890 },
        { method: 'Mobile Money', count: 650 },
        { method: 'Cash', count: 340 },
        { method: 'Other', count: 120 },
    ];

    // Fetch comprehensive analytics summary
    const fetchAnalyticsSummary = useCallback(async () => {
        try {
            const summary = await apiClient.analytics.getSummary(filters.period, filters.cooperativeId);
            setAnalyticsSummary(summary as AnalyticsSummary);
            setError('');
        } catch (error) {
            console.error('Failed to fetch analytics summary:', error);
            setError('Failed to load analytics data. Please try again.');
        }
    }, [filters]);

    // Initial data loading
    useEffect(() => {
        const loadAnalyticsData = async () => {
            setLoading(true);
            try {
                await fetchAnalyticsSummary();
            } catch (err) {
                console.error('Failed to load analytics data:', err);
                setError('Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        loadAnalyticsData();
    }, [fetchAnalyticsSummary]);

    // Handle refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchAnalyticsSummary();
        } catch (err) {
            console.error('Failed to refresh analytics data:', err);
            setError('Failed to refresh analytics data');
        } finally {
            setRefreshing(false);
        }
    };

    // Handle data export
    const handleExport = async (type: 'payments' | 'users' | 'revenue') => {
        setExportingData(type);
        try {
            const csvData = await apiClient.analytics.exportData(type, filters.period, filters.cooperativeId);
            
            // Create download link
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${type}-analytics-${filters.period}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(`Failed to export ${type} data:`, error);
            alert(`Failed to export ${type} data. Please try again.`);
        } finally {
            setExportingData(null);
        }
    };

    // Format percentage
    const formatPercentage = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Loading analytics...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto p-1 sm:p-0">
                {/* Header */}
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                            Analytics & Reports
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Comprehensive system insights and performance metrics</p>
                    </div>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3 gap-3">
                        <Select value={filters.period} onValueChange={(value: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year') =>
                            setFilters(prev => ({ ...prev, period: value }))
                        }>
                            <SelectTrigger className="w-full sm:w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                                <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                                <SelectItem value="last_year">Last Year</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {error && (
                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardContent className="p-4">
                            <div className="flex">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-destructive">Error Loading Analytics</h3>
                                    <p className="text-sm text-destructive/80 mt-1">{error}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Key Metrics Overview */}
                {analyticsSummary && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        <Card className="border border-border shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6">
                                <div className="text-xl sm:text-2xl font-bold text-foreground">{formatNumber(analyticsSummary.dashboard.totalUsers)}</div>
                                <p className="text-xs text-muted-foreground flex items-center mt-1">
                                    {analyticsSummary.dashboard.growthPercentage.users >= 0 ? (
                                        <TrendingUp className="w-3 h-3 mr-1 text-primary" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3 mr-1 text-destructive" />
                                    )}
                                    <span className={analyticsSummary.dashboard.growthPercentage.users >= 0 ? 'text-primary' : 'text-destructive'}>
                                        {formatPercentage(analyticsSummary.dashboard.growthPercentage.users)}
                                    </span>
                                    <span className="ml-1">growth</span>
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border border-border shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6">
                                <div className="text-xl sm:text-2xl font-bold text-foreground">
                                    {formatCurrency(analyticsSummary.revenue.totalRevenue)}
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center mt-1">
                                    {analyticsSummary.revenue.growthPercentage >= 0 ? (
                                        <TrendingUp className="w-3 h-3 mr-1 text-primary" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3 mr-1 text-destructive" />
                                    )}
                                    <span className={analyticsSummary.revenue.growthPercentage >= 0 ? 'text-primary' : 'text-destructive'}>
                                        {formatPercentage(analyticsSummary.revenue.growthPercentage)}
                                    </span>
                                    <span className="ml-1">growth</span>
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border border-border shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
                                <CreditCard className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6">
                                <div className="text-xl sm:text-2xl font-bold text-foreground">{formatNumber(analyticsSummary.dashboard.totalPayments)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {analyticsSummary.payments.successRate.toFixed(1)}% success rate
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border border-border shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">System Activities</CardTitle>
                                <Activity className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6">
                                <div className="text-xl sm:text-2xl font-bold text-foreground">{formatNumber(analyticsSummary.activity.totalActivities)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {analyticsSummary.activity.securityEvents} security events
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Charts Overview Section */}
                {analyticsSummary && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* User Registration Trend */}
                        <Card className="border border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-foreground">User Registration Trend</CardTitle>
                                <p className="text-sm text-muted-foreground">New users joining over time</p>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6">
                                <div className="h-[200px] sm:h-[250px] lg:h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsLineChart data={userActivityData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="users" 
                                                stroke="hsl(var(--primary))" 
                                                strokeWidth={2}
                                                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                                            />
                                        </RechartsLineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Volume Trends */}
                        <Card className="border border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-foreground">Payment Volume Trends</CardTitle>
                                <p className="text-sm text-muted-foreground">Payment volume over time</p>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6">
                                <div className="h-[200px] sm:h-[250px] lg:h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={paymentTrendsData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="volume" 
                                                stroke="hsl(var(--primary))" 
                                                fill="hsl(var(--primary)/0.2)" 
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Bottom Overview Charts Section */}
                {analyticsSummary && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Organization Distribution */}
                        <Card className="lg:col-span-1 border border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-foreground">Organization Types</CardTitle>
                                <p className="text-sm text-muted-foreground">Distribution by organization type</p>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6">
                                <div className="h-[200px] sm:h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={organizationData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="hsl(var(--primary))"
                                                label
                                            >
                                                {organizationData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}
                                            />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Distribution */}
                        <Card className="lg:col-span-2 border border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-foreground">Payment Distribution by Method</CardTitle>
                                <p className="text-sm text-muted-foreground">Payment method usage breakdown</p>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6">
                                <div className="h-[200px] sm:h-[250px] lg:h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={paymentDistributionData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="method" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}
                                            />
                                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Detailed Analytics Sections */}
                {analyticsSummary && (
                    <>
                        {/* Payment Analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <Card className="border border-border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-foreground">
                                        <CreditCard className="w-5 h-5 mr-2 text-primary" />
                                        Payment Analytics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-3 sm:p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                            <div className="text-lg sm:text-xl font-bold text-primary">
                                                {formatNumber(analyticsSummary.payments.totalVolume)}
                                            </div>
                                            <p className="text-sm text-primary font-medium">Total Volume</p>
                                        </div>
                                        <div className="text-center p-3 bg-secondary/50 border border-border rounded-lg">
                                            <div className="text-lg sm:text-xl font-bold text-foreground">
                                                {formatCurrency(analyticsSummary.payments.averageAmount)}
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium">Avg Amount</p>
                                        </div>
                                    </div>
                                    
                                    {/* Payment Status Distribution */}
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm text-foreground">Payment Status</h4>
                                        {analyticsSummary.payments.statusDistribution.map((status, index) => (
                                            <div key={index} className="flex justify-between items-center py-1">
                                                <span className="text-sm capitalize text-foreground">{status.status.toLowerCase()}</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-foreground">{status.count}</span>
                                                    <span className="text-xs text-muted-foreground">({status.percentage.toFixed(1)}%)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* User Analytics */}
                            <Card className="border border-border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-foreground">
                                        <Users className="w-5 h-5 mr-2 text-primary" />
                                        User Analytics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-3 sm:p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-secondary/50 border border-border rounded-lg">
                                            <div className="text-lg sm:text-xl font-bold text-foreground">
                                                {formatNumber(analyticsSummary.users.activeUsers)}
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium">Active Users</p>
                                        </div>
                                        <div className="text-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                            <div className="text-lg sm:text-xl font-bold text-primary">
                                                {formatNumber(analyticsSummary.users.newRegistrations)}
                                            </div>
                                            <p className="text-sm text-primary font-medium">New Registrations</p>
                                        </div>
                                    </div>
                                    
                                    {/* User Role Distribution */}
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm text-foreground">User Roles</h4>
                                        {analyticsSummary.users.roleDistribution.map((role, index) => (
                                            <div key={index} className="flex justify-between items-center py-1">
                                                <span className="text-sm text-foreground">{role.role.replace('_', ' ')}</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-foreground">{role.count}</span>
                                                    <span className="text-xs text-muted-foreground">({role.percentage.toFixed(1)}%)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Revenue Analytics */}
                        <Card className="border border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center text-foreground">
                                    <DollarSign className="w-5 h-5 mr-2 text-primary" />
                                    Revenue Analytics
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                                    <div className="text-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                        <div className="text-xl sm:text-2xl font-bold text-primary">
                                            {formatCurrency(analyticsSummary.revenue.totalRevenue)}
                                        </div>
                                        <p className="text-sm text-primary font-medium">Total Revenue</p>
                                    </div>
                                    <div className="text-center p-4 bg-secondary/50 border border-border rounded-lg">
                                        <div className="text-xl sm:text-2xl font-bold text-foreground">
                                            {formatCurrency(analyticsSummary.revenue.averageRevenuePerUser)}
                                        </div>
                                        <p className="text-sm text-muted-foreground font-medium">Avg Revenue/User</p>
                                    </div>
                                    <div className="text-center p-4 bg-accent/50 border border-border rounded-lg">
                                        <div className="text-xl sm:text-2xl font-bold text-foreground">
                                            {formatPercentage(analyticsSummary.revenue.growthPercentage)}
                                        </div>
                                        <p className="text-sm text-muted-foreground font-medium">Growth Rate</p>
                                    </div>
                                </div>
                                
                                {/* Revenue by Cooperative */}
                                <div className="space-y-3">
                                    <h4 className="font-medium text-foreground">Revenue by Cooperative</h4>
                                    {analyticsSummary.revenue.revenueByCooperative.slice(0, 5).map((coop, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-secondary/30 border border-border rounded-lg">
                                            <div>
                                                <p className="font-medium text-sm text-foreground">{coop.cooperativeName}</p>
                                                <p className="text-xs text-muted-foreground">{coop.percentage.toFixed(1)}% of total</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm text-foreground">{formatCurrency(coop.revenue)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Activity Analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <Card className="border border-border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-foreground">
                                        <Activity className="w-5 h-5 mr-2 text-primary" />
                                        System Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-3 sm:p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                            <div className="text-lg sm:text-xl font-bold text-primary">
                                                {formatNumber(analyticsSummary.activity.totalActivities)}
                                            </div>
                                            <p className="text-sm text-primary font-medium">Total Activities</p>
                                        </div>
                                        <div className="text-center p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                                            <div className="text-lg sm:text-xl font-bold text-destructive">
                                                {formatNumber(analyticsSummary.activity.securityEvents)}
                                            </div>
                                            <p className="text-sm text-destructive font-medium">Security Events</p>
                                        </div>
                                    </div>
                                    
                                    {/* Top Activity Types Professional Chart */}
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-sm text-foreground">Activity Distribution</h4>
                                        <div className="h-[200px] sm:h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsPieChart>
                                                    <Pie
                                                        data={analyticsSummary.activity.topActivityTypes.slice(0, 6).map(activity => ({
                                                            name: activity.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                                                            value: activity.count,
                                                            percentage: activity.percentage
                                                        }))}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        label={(entry: any) => `${entry.name} (${entry.percentage.toFixed(1)}%)`}
                                                        outerRadius={80}
                                                        fill="hsl(var(--primary))"
                                                        dataKey="value"
                                                    >
                                                        {analyticsSummary.activity.topActivityTypes.slice(0, 6).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--card))',
                                                            border: '1px solid hsl(var(--border))',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                        formatter={(value: any, name: any) => [`${formatNumber(Number(value))} activities`, name]}
                                                    />
                                                </RechartsPieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-foreground">
                                        <Clock className="w-5 h-5 mr-2 text-primary" />
                                        Peak Activity Hours
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 sm:p-6">
                                    <div className="h-[250px] sm:h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analyticsSummary.activity.peakHours
                                                .sort((a, b) => a.hour - b.hour)
                                                .map(hour => ({
                                                    hour: `${hour.hour}:00`,
                                                    count: hour.count,
                                                    timeLabel: `${hour.hour}:00 - ${hour.hour + 1}:00`
                                                }))
                                            }>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                                <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--card))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                    formatter={(value: any, name: any) => [`${formatNumber(Number(value))} activities`, 'Activity Count']}
                                                    labelFormatter={(label: any) => `Time: ${label} - ${parseInt(label.split(':')[0]) + 1}:00`}
                                                />
                                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Export Options */}
                        <Card className="border border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center text-foreground">
                                    <Download className="w-5 h-5 mr-2 text-primary" />
                                    Export Analytics Data
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <Button
                                        variant="outline"
                                        className="h-auto p-4 flex flex-col items-center space-y-2 border-border hover:bg-accent"
                                        onClick={() => handleExport('payments')}
                                        disabled={exportingData === 'payments'}
                                    >
                                        {exportingData === 'payments' ? (
                                            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                                        ) : (
                                            <CreditCard className="w-6 h-6 text-primary" />
                                        )}
                                        <span className="text-sm font-medium text-foreground">Payment Analytics</span>
                                        <span className="text-xs text-muted-foreground">Export payment data as CSV</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="h-auto p-4 flex flex-col items-center space-y-2 border-border hover:bg-accent"
                                        onClick={() => handleExport('users')}
                                        disabled={exportingData === 'users'}
                                    >
                                        {exportingData === 'users' ? (
                                            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                                        ) : (
                                            <Users className="w-6 h-6 text-primary" />
                                        )}
                                        <span className="text-sm font-medium text-foreground">User Analytics</span>
                                        <span className="text-xs text-muted-foreground">Export user data as CSV</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="h-auto p-4 flex flex-col items-center space-y-2 border-border hover:bg-accent sm:col-span-2 lg:col-span-1"
                                        onClick={() => handleExport('revenue')}
                                        disabled={exportingData === 'revenue'}
                                    >
                                        {exportingData === 'revenue' ? (
                                            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                                        ) : (
                                            <DollarSign className="w-6 h-6 text-primary" />
                                        )}
                                        <span className="text-sm font-medium text-foreground">Revenue Analytics</span>
                                        <span className="text-xs text-muted-foreground">Export revenue data as CSV</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}