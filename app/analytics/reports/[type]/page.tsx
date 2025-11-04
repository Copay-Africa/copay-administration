/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { formatCurrency } from '@/lib/utils';
import {
    ArrowLeft,
    Download,
    RefreshCw,
    Filter,
    CreditCard,
    Users,
    AlertTriangle,
    Building2,
    FileText,
    BarChart3,
    PieChart,
    LineChart,
    Clock,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';

interface ReportData {
    summary: {
        total: number;
        completed: number;
        pending: number;
        failed: number;
        totalAmount?: number;
        averageAmount?: number;
    };
    chartData: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
            backgroundColor?: string;
            borderColor?: string;
        }>;
    };
    tableData: Array<{
        id: string;
        name: string;
        status: string;
        amount?: number;
        date: string;
        category?: string;
    }>;
}

interface ReportFilters {
    dateRange: {
        from: string;
        to: string;
    };
    status?: string;
    category?: string;
    organization?: string;
}

export default function ReportDetailsPage({ params }: { params: { type: string } }) {
    const router = useRouter();
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<ReportFilters>({
        dateRange: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0]
        }
    });
    const [exporting, setExporting] = useState(false);

    // Get report configuration based on type
    const getReportConfig = (type: string) => {
        switch (type) {
            case 'payments':
                return {
                    title: 'Payment Analytics Report',
                    icon: <CreditCard className="w-5 h-5" />,
                    description: 'Comprehensive payment transaction analysis',
                    color: 'bg-blue-100 text-blue-800 border-blue-300'
                };
            case 'users':
                return {
                    title: 'User Activity Report',
                    icon: <Users className="w-5 h-5" />,
                    description: 'User engagement and growth analysis',
                    color: 'bg-green-100 text-green-800 border-green-300'
                };
            case 'complaints':
                return {
                    title: 'Complaints Analysis Report',
                    icon: <AlertTriangle className="w-5 h-5" />,
                    description: 'Issue tracking and resolution metrics',
                    color: 'bg-red-100 text-red-800 border-red-300'
                };
            case 'organizations':
                return {
                    title: 'Organization Performance Report',
                    icon: <Building2 className="w-5 h-5" />,
                    description: 'Cooperative performance and analytics',
                    color: 'bg-purple-100 text-purple-800 border-purple-300'
                };
            default:
                return {
                    title: 'Custom Report',
                    icon: <FileText className="w-5 h-5" />,
                    description: 'Custom analytics report',
                    color: 'bg-gray-100 text-gray-800 border-gray-300'
                };
        }
    };

    const reportConfig = getReportConfig(params.type);

    // Fetch report data (with error handling for missing endpoints)
    const fetchReportData = useCallback(async () => {
        try {
            let data: ReportData;

            switch (params.type) {
                case 'payments':
                    try {
                        // Use documented endpoint: payments/organization/stats
                        const paymentStats = await apiClient.payments.getOrganizationStats(filters) as any;
                        const summary = paymentStats.summary || {};
                        const statusBreakdown = paymentStats.statusBreakdown || [];

                        const completedCount = statusBreakdown.find((s: any) => s.status === 'COMPLETED')?.count || 0;
                        const pendingCount = statusBreakdown.find((s: any) => s.status === 'PENDING')?.count || 0;
                        const failedCount = statusBreakdown.find((s: any) => s.status === 'FAILED')?.count || 0;

                        data = {
                            summary: {
                                total: summary.totalPayments || 0,
                                completed: completedCount,
                                pending: pendingCount,
                                failed: failedCount,
                                totalAmount: summary.totalAmount || 0,
                                averageAmount: summary.averageAmount || 0
                            },
                            chartData: {
                                labels: ['Completed', 'Pending', 'Failed'],
                                datasets: [{
                                    label: 'Payment Status',
                                    data: [completedCount, pendingCount, failedCount],
                                    backgroundColor: '#10b981',
                                    borderColor: '#059669'
                                }]
                            },
                            tableData: []
                        };
                    } catch (err) {
                        console.error('Payment stats endpoint not available:', err);
                        data = {
                            summary: { total: 0, completed: 0, pending: 0, failed: 0, totalAmount: 0, averageAmount: 0 },
                            chartData: { labels: [], datasets: [] },
                            tableData: []
                        };
                    }
                    break;

                case 'users':
                    try {
                        // Use documented endpoint: users/stats
                        const userStats = await apiClient.users.getStats() as any;
                        const activeCount = userStats.activeUsers || 0;
                        const inactiveCount = userStats.inactiveUsers || 0;
                        const totalCount = userStats.totalUsers || 0;

                        data = {
                            summary: {
                                total: totalCount,
                                completed: activeCount, // Active users as "completed"
                                pending: 0, // No "pending" users in documented response
                                failed: inactiveCount // Inactive users as "failed"
                            },
                            chartData: {
                                labels: ['Active', 'Inactive'],
                                datasets: [{
                                    label: 'User Status',
                                    data: [activeCount, inactiveCount],
                                    backgroundColor: '#10b981',
                                    borderColor: '#059669'
                                }]
                            },
                            tableData: []
                        };
                    } catch (err) {
                        console.error('User stats endpoint not available:', err);
                        data = {
                            summary: { total: 0, completed: 0, pending: 0, failed: 0 },
                            chartData: { labels: [], datasets: [] },
                            tableData: []
                        };
                    }
                    break;

                case 'complaints':
                    try {
                        // Use documented endpoint: complaints/organization/stats
                        const complaintStats = await apiClient.complaints.getOrganizationStats() as any;
                        const summary = complaintStats.summary || {};
                        const statusBreakdown = complaintStats.statusBreakdown || [];

                        const openCount = statusBreakdown.find((s: any) => s.status === 'OPEN')?.count || 0;
                        const inProgressCount = statusBreakdown.find((s: any) => s.status === 'IN_PROGRESS')?.count || 0;
                        const resolvedCount = statusBreakdown.find((s: any) => s.status === 'RESOLVED')?.count || 0;
                        const closedCount = statusBreakdown.find((s: any) => s.status === 'CLOSED')?.count || 0;

                        data = {
                            summary: {
                                total: summary.totalComplaints || 0,
                                completed: resolvedCount, // Resolved complaints as "completed"
                                pending: openCount + inProgressCount, // Open + In Progress as "pending"
                                failed: closedCount // Closed complaints as "failed"
                            },
                            chartData: {
                                labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
                                datasets: [{
                                    label: 'Complaint Status',
                                    data: [openCount, inProgressCount, resolvedCount, closedCount],
                                    backgroundColor: '#10b981',
                                    borderColor: '#059669'
                                }]
                            },
                            tableData: []
                        };
                    } catch (err) {
                        console.error('Complaint stats endpoint not available:', err);
                        data = {
                            summary: { total: 0, completed: 0, pending: 0, failed: 0 },
                            chartData: { labels: [], datasets: [] },
                            tableData: []
                        };
                    }
                    break;

                default:
                    data = {
                        summary: { total: 0, completed: 0, pending: 0, failed: 0 },
                        chartData: { labels: [], datasets: [] },
                        tableData: []
                    };
            }

            setReportData(data);
            setError('');
        } catch (err) {
            console.error('Failed to fetch report data:', err);
            setError('Failed to load report data');
        }
    }, [params.type, filters]);

    useEffect(() => {
        const loadReportData = async () => {
            setLoading(true);
            await fetchReportData();
            setLoading(false);
        };

        loadReportData();
    }, [fetchReportData]);

    // Handle export
    const handleExport = async () => {
        setExporting(true);
        try {
            // Implement export functionality
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate export
            // In real implementation, this would call an API endpoint to generate and download the report
        } catch (err) {
            console.error('Failed to export report:', err);
        } finally {
            setExporting(false);
        }
    };

    // Import formatCurrency from utils for consistent RWF formatting

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copay-navy mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading report...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Analytics
                        </Button>
                        <div>
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${reportConfig.color}`}>
                                    {reportConfig.icon}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-copay-navy">{reportConfig.title}</h1>
                                    <p className="text-copay-gray mt-1">{reportConfig.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-3">
                        <Button variant="outline" size="sm" onClick={fetchReportData}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleExport}
                            disabled={exporting}
                            className="bg-copay-navy hover:bg-copay-navy/90"
                        >
                            {exporting ? (
                                <Clock className="w-4 h-4 mr-2" />
                            ) : (
                                <Download className="w-4 h-4 mr-2" />
                            )}
                            {exporting ? 'Exporting...' : 'Export Report'}
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Filter className="w-5 h-5 mr-2" />
                            Report Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                                <Input
                                    type="date"
                                    value={filters.dateRange.from}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        dateRange: { ...prev.dateRange, from: e.target.value }
                                    }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                                <Input
                                    type="date"
                                    value={filters.dateRange.to}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        dateRange: { ...prev.dateRange, to: e.target.value }
                                    }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <Select value={filters.status || 'all'} onValueChange={(value) =>
                                    setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))
                                }>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                                <Select value={filters.organization || 'all'} onValueChange={(value) =>
                                    setFilters(prev => ({ ...prev, organization: value === 'all' ? undefined : value }))
                                }>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Organizations" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Organizations</SelectItem>
                                        <SelectItem value="coop1">Cooperative 1</SelectItem>
                                        <SelectItem value="coop2">Cooperative 2</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error Loading Report</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                {reportData && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{reportData.summary.total.toLocaleString()}</div>
                                {reportData.summary.totalAmount && (
                                    <p className="text-xs text-muted-foreground">
                                        {formatCurrency(reportData.summary.totalAmount)}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{reportData.summary.completed.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">
                                    {reportData.summary.total > 0
                                        ? `${((reportData.summary.completed / reportData.summary.total) * 100).toFixed(1)}% success rate`
                                        : '0% success rate'
                                    }
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                                <Clock className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">{reportData.summary.pending.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">
                                    Awaiting processing
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                                <XCircle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{reportData.summary.failed.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">
                                    Requires attention
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Charts and Data Visualization */}
                {reportData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Status Distribution Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <PieChart className="w-5 h-5 mr-2" />
                                    Status Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Status distribution chart</p>
                                        <p className="text-xs text-gray-500">Chart library integration needed</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Trend Analysis */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <LineChart className="w-5 h-5 mr-2" />
                                    Trend Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Trend analysis visualization</p>
                                        <p className="text-xs text-gray-500">Chart library integration needed</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Data Table Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="w-5 h-5 mr-2" />
                            Data Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-700 mb-2">Detailed Data Table</h3>
                            <p className="text-gray-500 mb-4">
                                Comprehensive data table with individual records will be displayed here
                            </p>
                            <Badge variant="outline" className="text-xs">
                                Table implementation needed for {params.type} data
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}