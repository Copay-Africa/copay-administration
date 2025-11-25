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
    Line
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copay-navy mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading analytics...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-copay-navy flex items-center gap-2">
                            <BarChart3 className="w-8 h-8 text-copay-blue" />
                            Analytics & Reports
                        </h1>
                        <p className="text-copay-gray mt-1">Comprehensive system insights and performance metrics</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Select value={filters.period} onValueChange={(value: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year') =>
                            setFilters(prev => ({ ...prev, period: value }))
                        }>
                            <SelectTrigger className="w-[140px]">
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
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Key Metrics Overview */}
                {analyticsSummary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(analyticsSummary.dashboard.totalUsers)}</div>
                                <p className="text-xs text-muted-foreground flex items-center mt-1">
                                    {analyticsSummary.dashboard.growthPercentage.users >= 0 ? (
                                        <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                                    )}
                                    <span className={analyticsSummary.dashboard.growthPercentage.users >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {formatPercentage(analyticsSummary.dashboard.growthPercentage.users)}
                                    </span>
                                    <span className="ml-1">growth</span>
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(analyticsSummary.revenue.totalRevenue)}
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center mt-1">
                                    {analyticsSummary.revenue.growthPercentage >= 0 ? (
                                        <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                                    )}
                                    <span className={analyticsSummary.revenue.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {formatPercentage(analyticsSummary.revenue.growthPercentage)}
                                    </span>
                                    <span className="ml-1">growth</span>
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(analyticsSummary.dashboard.totalPayments)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {analyticsSummary.payments.successRate.toFixed(1)}% success rate
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">System Activities</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatNumber(analyticsSummary.activity.totalActivities)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {analyticsSummary.activity.securityEvents} security events
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Detailed Analytics Sections */}
                {analyticsSummary && (
                    <>
                        {/* Payment Analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <CreditCard className="w-5 h-5 mr-2" />
                                        Payment Analytics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                                            <div className="text-xl font-bold text-blue-600">
                                                {formatNumber(analyticsSummary.payments.totalVolume)}
                                            </div>
                                            <p className="text-sm text-blue-700 font-medium">Total Volume</p>
                                        </div>
                                        <div className="text-center p-3 bg-green-50 rounded-lg">
                                            <div className="text-xl font-bold text-green-600">
                                                {formatCurrency(analyticsSummary.payments.averageAmount)}
                                            </div>
                                            <p className="text-sm text-green-700 font-medium">Avg Amount</p>
                                        </div>
                                    </div>
                                    
                                    {/* Payment Status Distribution */}
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Payment Status</h4>
                                        {analyticsSummary.payments.statusDistribution.map((status, index) => (
                                            <div key={index} className="flex justify-between items-center">
                                                <span className="text-sm capitalize">{status.status.toLowerCase()}</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium">{status.count}</span>
                                                    <span className="text-xs text-gray-500">({status.percentage.toFixed(1)}%)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* User Analytics */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Users className="w-5 h-5 mr-2" />
                                        User Analytics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                                            <div className="text-xl font-bold text-purple-600">
                                                {formatNumber(analyticsSummary.users.activeUsers)}
                                            </div>
                                            <p className="text-sm text-purple-700 font-medium">Active Users</p>
                                        </div>
                                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                                            <div className="text-xl font-bold text-indigo-600">
                                                {formatNumber(analyticsSummary.users.newRegistrations)}
                                            </div>
                                            <p className="text-sm text-indigo-700 font-medium">New Registrations</p>
                                        </div>
                                    </div>
                                    
                                    {/* User Role Distribution */}
                                    <div className="space-y-2">
                                        <h4 className="font-medium text-sm">User Roles</h4>
                                        {analyticsSummary.users.roleDistribution.map((role, index) => (
                                            <div key={index} className="flex justify-between items-center">
                                                <span className="text-sm">{role.role.replace('_', ' ')}</span>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium">{role.count}</span>
                                                    <span className="text-xs text-gray-500">({role.percentage.toFixed(1)}%)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Revenue Analytics */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    Revenue Analytics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {formatCurrency(analyticsSummary.revenue.totalRevenue)}
                                        </div>
                                        <p className="text-sm text-green-700 font-medium">Total Revenue</p>
                                    </div>
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {formatCurrency(analyticsSummary.revenue.averageRevenuePerUser)}
                                        </div>
                                        <p className="text-sm text-blue-700 font-medium">Avg Revenue/User</p>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {formatCurrency(analyticsSummary.revenue.averageRevenuePerCooperative)}
                                        </div>
                                        <p className="text-sm text-purple-700 font-medium">Avg Revenue/Coop</p>
                                    </div>
                                </div>

                                {/* Revenue by Cooperative */}
                                <div className="space-y-3">
                                    <h4 className="font-medium">Revenue by Cooperative</h4>
                                    {analyticsSummary.revenue.revenueByCooperative.slice(0, 5).map((coop, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                            <div>
                                                <p className="font-medium text-sm">{coop.cooperativeName}</p>
                                                <p className="text-xs text-gray-500">{coop.percentage.toFixed(1)}% of total</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm">{formatCurrency(coop.revenue)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Activity Analytics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Activity className="w-5 h-5 mr-2" />
                                        System Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                                            <div className="text-xl font-bold text-orange-600">
                                                {formatNumber(analyticsSummary.activity.totalActivities)}
                                            </div>
                                            <p className="text-sm text-orange-700 font-medium">Total Activities</p>
                                        </div>
                                        <div className="text-center p-3 bg-red-50 rounded-lg">
                                            <div className="text-xl font-bold text-red-600">
                                                {formatNumber(analyticsSummary.activity.securityEvents)}
                                            </div>
                                            <p className="text-sm text-red-700 font-medium">Security Events</p>
                                        </div>
                                    </div>
                                    
                                    {/* Top Activity Types Professional Chart */}
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-sm">Activity Distribution</h4>
                                        <div style={{ width: '100%', height: 250 }}>
                                            <ResponsiveContainer>
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
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                    >
                                                        {analyticsSummary.activity.topActivityTypes.slice(0, 6).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={[
                                                                '#3B82F6', // Blue
                                                                '#10B981', // Green
                                                                '#8B5CF6', // Purple
                                                                '#F59E0B', // Orange
                                                                '#EF4444', // Red
                                                                '#6B7280'  // Gray
                                                            ][index % 6]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value: any, name: any) => [`${formatNumber(Number(value))} activities`, name]} />
                                                </RechartsPieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Clock className="w-5 h-5 mr-2" />
                                        Peak Activity Hours
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div style={{ width: '100%', height: 300 }}>
                                        <ResponsiveContainer>
                                            <BarChart data={analyticsSummary.activity.peakHours
                                                .sort((a, b) => a.hour - b.hour)
                                                .map(hour => ({
                                                    hour: `${hour.hour}:00`,
                                                    count: hour.count,
                                                    timeLabel: `${hour.hour}:00 - ${hour.hour + 1}:00`
                                                }))
                                            }>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="hour" />
                                                <YAxis />
                                                <Tooltip 
                                                    formatter={(value: any, name: any) => [`${formatNumber(Number(value))} activities`, 'Activity Count']}
                                                    labelFormatter={(label: any) => `Time: ${label} - ${parseInt(label.split(':')[0]) + 1}:00`}
                                                />
                                                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Export Options */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Download className="w-5 h-5 mr-2" />
                                    Export Analytics Data
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Button
                                        variant="outline"
                                        className="h-auto p-4 flex flex-col items-center space-y-2"
                                        onClick={() => handleExport('payments')}
                                        disabled={exportingData === 'payments'}
                                    >
                                        {exportingData === 'payments' ? (
                                            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                                        ) : (
                                            <CreditCard className="w-6 h-6 text-blue-600" />
                                        )}
                                        <span className="text-sm font-medium">Payment Analytics</span>
                                        <span className="text-xs text-gray-500">Export payment data as CSV</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="h-auto p-4 flex flex-col items-center space-y-2"
                                        onClick={() => handleExport('users')}
                                        disabled={exportingData === 'users'}
                                    >
                                        {exportingData === 'users' ? (
                                            <RefreshCw className="w-6 h-6 text-green-600 animate-spin" />
                                        ) : (
                                            <Users className="w-6 h-6 text-green-600" />
                                        )}
                                        <span className="text-sm font-medium">User Analytics</span>
                                        <span className="text-xs text-gray-500">Export user data as CSV</span>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="h-auto p-4 flex flex-col items-center space-y-2"
                                        onClick={() => handleExport('revenue')}
                                        disabled={exportingData === 'revenue'}
                                    >
                                        {exportingData === 'revenue' ? (
                                            <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
                                        ) : (
                                            <DollarSign className="w-6 h-6 text-purple-600" />
                                        )}
                                        <span className="text-sm font-medium">Revenue Analytics</span>
                                        <span className="text-xs text-gray-500">Export revenue data as CSV</span>
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