/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { formatCurrency } from '@/lib/utils';
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
    DollarSign
} from 'lucide-react';
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

// Types for analytics data
interface DashboardStats {
    totalUsers: number;
    totalPayments: number;
    totalComplaints: number;
    totalActivities: number;
    paymentStats: {
        totalAmount: number;
        completedPayments: number;
        pendingPayments: number;
        failedPayments: number;
    };
    userGrowth: {
        current: number;
        previous: number;
        percentage: number;
    };
}

interface ChartData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string;
        borderColor?: string;
    }>;
}

interface AnalyticsFilters {
    period: 'week' | 'month' | 'quarter' | 'year';
    dateRange: {
        from: string;
        to: string;
    };
}

export default function AnalyticsPage() {
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [paymentsChart, setPaymentsChart] = useState<ChartData | null>(null);
    const [usersChart, setUsersChart] = useState<ChartData | null>(null);
    const [complaintsChart, setComplaintsChart] = useState<ChartData | null>(null);
    const [activitiesChart, setActivitiesChart] = useState<ChartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<AnalyticsFilters>({
        period: 'month',
        dateRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0]
        }
    });
    const [refreshing, setRefreshing] = useState(false);

    // Fetch dashboard statistics using only documented API endpoints
    const fetchDashboardStats = useCallback(async () => {
        try {
            // Only use documented API endpoints:
            // ✅ users/stats - documented
            // ✅ complaints/organization/stats - documented  
            // ✅ payments/organization/stats - documented
            // ❌ reminders stats - no documented endpoint, calculate from list
            // ❌ activities/stats - not documented, will use mock data
            const [
                userStatsResult,
                complaintsStatsResult,
                paymentsStatsResult,
                remindersListResult
            ] = await Promise.allSettled([
                apiClient.users.getStats(),
                apiClient.complaints.getOrganizationStats(),
                apiClient.payments.getOrganizationStats(),
                // Calculate reminder stats from list since no stats endpoint exists
                apiClient.reminders.getAll({ limit: 1000 })
            ]);

            // Process user stats (documented)
            const userStats = userStatsResult.status === 'fulfilled'
                ? (userStatsResult.value as any)
                : { totalUsers: 0, activeUsers: 0, inactiveUsers: 0 };

            // Process complaints stats (documented)
            const complaintsStats = complaintsStatsResult.status === 'fulfilled'
                ? (complaintsStatsResult.value as any)
                : { summary: { totalComplaints: 0 } };

            // Process payments stats (documented)
            const paymentsStats = paymentsStatsResult.status === 'fulfilled'
                ? (paymentsStatsResult.value as any)
                : { summary: { totalPayments: 0, totalAmount: 0 }, statusBreakdown: [] };

            // Calculate reminder stats since no endpoint exists
            let totalReminders = 0;
            if (remindersListResult.status === 'fulfilled' && remindersListResult.value?.data) {
                totalReminders = remindersListResult.value.data.length;
            }

            // Build dashboard stats from documented API responses
            const dashboardData: DashboardStats = {
                totalUsers: userStats.totalUsers || 0,
                totalPayments: paymentsStats.summary?.totalPayments || 0,
                totalComplaints: complaintsStats.summary?.totalComplaints || 0,
                totalActivities: totalReminders, // Use reminders count as activities since no activities stats endpoint
                paymentStats: {
                    totalAmount: paymentsStats.summary?.totalAmount || 0,
                    completedPayments: paymentsStats.statusBreakdown?.find((s: any) => s.status === 'COMPLETED')?.count || 0,
                    pendingPayments: paymentsStats.statusBreakdown?.find((s: any) => s.status === 'PENDING')?.count || 0,
                    failedPayments: paymentsStats.statusBreakdown?.find((s: any) => s.status === 'FAILED')?.count || 0
                },
                userGrowth: {
                    current: userStats.totalUsers || 0,
                    previous: Math.max(0, (userStats.totalUsers || 0) - (userStats.recentRegistrations || 10)),
                    percentage: userStats.recentRegistrations ?
                        ((userStats.recentRegistrations / Math.max(1, (userStats.totalUsers || 1) - (userStats.recentRegistrations || 0))) * 100) : 0
                }
            };

            setDashboardStats(dashboardData);
        } catch (err) {
            setDashboardStats({
                totalUsers: 0,
                totalPayments: 0,
                totalComplaints: 0,
                totalActivities: 0,
                paymentStats: {
                    totalAmount: 0,
                    completedPayments: 0,
                    pendingPayments: 0,
                    failedPayments: 0
                },
                userGrowth: {
                    current: 0,
                    previous: 0,
                    percentage: 0
                }
            });
        }
    }, []);

    // Create chart data using documented endpoints only
    const fetchChartData = useCallback(async () => {
        try {
            // Create mock chart data since dashboard chart endpoints are not documented
            const createMockChartData = (label: string, dataPoints: number[] = [10, 20, 15, 25, 30]): ChartData => ({
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
                datasets: [{
                    label,
                    data: dataPoints,
                    backgroundColor: '#3b82f6',
                    borderColor: '#1d4ed8'
                }]
            });

            // Since dashboard chart endpoints are not documented in API, use mock data
            // In a real implementation, you would query list endpoints and aggregate data by time periods
            const payments = createMockChartData('Payments', [100, 150, 120, 180, 200]);
            const users = createMockChartData('Users', [50, 65, 80, 95, 110]);
            const complaints = createMockChartData('Complaints', [5, 8, 3, 12, 7]);
            const activities = createMockChartData('Activities', [500, 650, 720, 800, 920]);

            setPaymentsChart(payments);
            setUsersChart(users);
            setComplaintsChart(complaints);
            setActivitiesChart(activities);
        } catch (err) {
            console.error('Failed to generate chart data:', err);
            // Set null charts to show "no data" state
            setPaymentsChart(null);
            setUsersChart(null);
            setComplaintsChart(null);
            setActivitiesChart(null);
        }
    }, []);

    // Initial data loading
    useEffect(() => {
        const loadAnalyticsData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchDashboardStats(),
                    fetchChartData()
                ]);
                setError('');
            } catch (err) {
                console.error('Failed to load analytics data:', err);
                setError('Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        };

        loadAnalyticsData();
    }, [fetchDashboardStats, fetchChartData]);

    // Handle refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                fetchDashboardStats(),
                fetchChartData()
            ]);
            setError('');
        } catch (err) {
            console.error('Failed to refresh analytics data:', err);
            setError('Failed to refresh analytics data');
        } finally {
            setRefreshing(false);
        }
    };

    // Import formatCurrency from utils for consistent RWF formatting

    // Format percentage
    const formatPercentage = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copay-navy mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-copay-navy flex items-center gap-2">
                            <BarChart3 className="w-8 h-8 text-copay-blue" />
                            Analytics & Reports
                        </h1>
                        <p className="text-copay-gray mt-1">Comprehensive system insights and performance metrics</p>
                    </div>
                    <div className="flex space-x-3">
                        <Select value={filters.period} onValueChange={(value: 'week' | 'month' | 'quarter' | 'year') =>
                            setFilters(prev => ({ ...prev, period: value }))
                        }>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">Last Week</SelectItem>
                                <SelectItem value="month">Last Month</SelectItem>
                                <SelectItem value="quarter">Last Quarter</SelectItem>
                                <SelectItem value="year">Last Year</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>

                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export Report
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

                {/* Key Metrics */}
                {dashboardStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardStats.totalUsers.toLocaleString()}</div>
                                {dashboardStats.userGrowth && (
                                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                                        {dashboardStats.userGrowth.percentage >= 0 ? (
                                            <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                                        )}
                                        <span className={dashboardStats.userGrowth.percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {formatPercentage(dashboardStats.userGrowth.percentage)}
                                        </span>
                                        <span className="ml-1">from last period</span>
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(dashboardStats.paymentStats?.totalAmount || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {dashboardStats.paymentStats?.completedPayments || 0} completed payments
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardStats.totalComplaints.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">
                                    Issue tracking & resolution
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">System Activities</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardStats.totalActivities.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total system events
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Payment Statistics */}
                {dashboardStats?.paymentStats && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <CreditCard className="w-5 h-5 mr-2" />
                                Payment Analytics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {dashboardStats.paymentStats.completedPayments}
                                    </div>
                                    <p className="text-sm text-green-700 font-medium">Completed</p>
                                    <p className="text-xs text-green-600">Successfully processed</p>
                                </div>

                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-600">
                                        {dashboardStats.paymentStats.pendingPayments}
                                    </div>
                                    <p className="text-sm text-yellow-700 font-medium">Pending</p>
                                    <p className="text-xs text-yellow-600">Awaiting processing</p>
                                </div>

                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                    <div className="text-2xl font-bold text-red-600">
                                        {dashboardStats.paymentStats.failedPayments}
                                    </div>
                                    <p className="text-sm text-red-700 font-medium">Failed</p>
                                    <p className="text-xs text-red-600">Requires attention</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Payments Trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <LineChart className="w-5 h-5 mr-2" />
                                Payment Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {paymentsChart ? (
                                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Payment trend visualization</p>
                                        <p className="text-xs text-gray-500">Chart implementation needed</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-sm">No payment data available</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* User Growth */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <TrendingUp className="w-5 h-5 mr-2" />
                                User Growth
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {usersChart ? (
                                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">User growth visualization</p>
                                        <p className="text-xs text-gray-500">Chart implementation needed</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <Users className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-sm">No user data available</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Complaints Analysis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <PieChart className="w-5 h-5 mr-2" />
                                Complaints Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {complaintsChart ? (
                                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Complaints breakdown chart</p>
                                        <p className="text-xs text-gray-500">Chart implementation needed</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-sm">No complaint data available</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* System Activities */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Activity className="w-5 h-5 mr-2" />
                                System Activities
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activitiesChart ? (
                                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Activity timeline chart</p>
                                        <p className="text-xs text-gray-500">Chart implementation needed</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-64 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <Activity className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-sm">No activity data available</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Button
                                variant="outline"
                                className="h-auto p-4 flex flex-col items-center space-y-2"
                                onClick={() => window.open('/analytics/reports/payments', '_blank')}
                            >
                                <FileText className="w-6 h-6 text-blue-600" />
                                <span className="text-sm font-medium">Payment Report</span>
                                <span className="text-xs text-gray-500">Generate payment analytics</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="h-auto p-4 flex flex-col items-center space-y-2"
                                onClick={() => window.open('/analytics/reports/users', '_blank')}
                            >
                                <Users className="w-6 h-6 text-green-600" />
                                <span className="text-sm font-medium">User Report</span>
                                <span className="text-xs text-gray-500">User activity summary</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="h-auto p-4 flex flex-col items-center space-y-2"
                                onClick={() => window.open('/analytics/reports/complaints', '_blank')}
                            >
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                                <span className="text-sm font-medium">Complaints Report</span>
                                <span className="text-xs text-gray-500">Issue tracking summary</span>
                            </Button>

                            <Button
                                variant="outline"
                                className="h-auto p-4 flex flex-col items-center space-y-2"
                                onClick={() => window.open('/analytics/reports/organizations', '_blank')}
                            >
                                <Building2 className="w-6 h-6 text-purple-600" />
                                <span className="text-sm font-medium">Organization Report</span>
                                <span className="text-xs text-gray-500">Cooperative analytics</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}