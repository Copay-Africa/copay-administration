'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Activity,
    Filter,
    Download,
    Shield,
    AlertTriangle,
    Eye,
    Calendar,
    User,
    Clock,
    Database,
    Building2,
    CreditCard,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { formatNumber } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { Activity as ActivityType, ActivityFilters, ActivityStats, ActivityType as ActType, EntityType } from '@/types';

/**
 * Activities Management Page
 * Comprehensive audit logging and activity tracking for Super Admins
 */

function ActivitiesPage() {
    const [activities, setActivities] = useState<ActivityType[]>([]);
    const [stats, setStats] = useState<ActivityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<ActivityFilters>({
        page: 1,
        limit: 20,
        search: '',
        type: undefined,
        entityType: undefined,
        isSecurityEvent: undefined,
    });

    // Function to refresh activities and stats
    const fetchActivitiesAndStats = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch activities and stats in parallel using documented API endpoints
            const [activitiesResponse, statsResponse] = await Promise.all([
                apiClient.activities.getAll(filters),
                apiClient.activities.getStats()
            ]);

            // Handle paginated response format for activities
            if (activitiesResponse && typeof activitiesResponse === 'object' && 'data' in activitiesResponse) {
                setActivities(activitiesResponse.data as ActivityType[]);
            } else if (Array.isArray(activitiesResponse)) {
                setActivities(activitiesResponse as ActivityType[]);
            } else {
                console.error('Unexpected activities response format:', activitiesResponse);
                setActivities([]);
            }

            // Handle stats response - this should come from the get() method which returns response.data.data
            if (statsResponse && typeof statsResponse === 'object') {
                setStats(statsResponse as ActivityStats);
            } else {
                console.error('Unexpected stats response format:', statsResponse);
                setStats(null);
            }
        } catch (err) {
            console.error('Failed to fetch activities:', err);
            
            // Better error typing for network/API errors
            const error = err as Error & {
                name?: string;
                code?: string;
                response?: {
                    data?: unknown;
                    status?: number;
                    statusText?: string;
                };
            };
            
            // Provide more specific error messages based on the error type
            let errorMessage = 'Failed to load activities';
            const isNetworkError = error.code === 'ERR_NETWORK' || 
                                  error.message?.includes('fetch') || 
                                  error.message?.includes('Failed to fetch') ||
                                  error.name === 'TypeError';
            
            if (error.response?.status === 401) {
                errorMessage = 'Authentication failed. Please log in again.';
            } else if (error.response?.status === 403) {
                errorMessage = 'Access denied. You may not have permission to view activities.';
            } else if (error.response?.status === 404) {
                errorMessage = 'Activities API endpoint not found. The server may not be configured correctly.';
            } else if (isNetworkError) {
                errorMessage = `Cannot connect to the API server (${process.env.NEXT_PUBLIC_API_URL}). Please check if the server is running.`;
                
                // In development, provide empty data as fallback
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Using empty data due to API connection failure');
                    setActivities([]);
                    setStats({
                        total: 0,
                        byType: [],
                        byEntityType: [],
                        securityEvents: 0,
                        last24Hours: 0,
                        last7Days: 0
                    });
                    setError(''); // Clear error when using empty fallback data
                    return;
                }
            } else {
                errorMessage = error.message || 'Failed to load activities';
            }
            
            setError(errorMessage);
            // Set empty data on error
            setActivities([]);
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchActivitiesAndStats();
    }, [filters, fetchActivitiesAndStats]);

    const getActivityTypeBadge = (type: ActType) => {
        switch (type) {
            case 'LOGIN':
            case 'LOGOUT':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <User className="h-3 w-3 mr-1" />
                    {type}
                </Badge>;
            case 'LOGIN_FAILED':
            case 'SUSPICIOUS_LOGIN':
            case 'MULTIPLE_FAILED_LOGINS':
            case 'UNAUTHORIZED_ACCESS':
                return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                    <Shield className="h-3 w-3 mr-1" />
                    {type.replace('_', ' ')}
                </Badge>;
            case 'PAYMENT_CREATED':
            case 'PAYMENT_COMPLETED':
                return <Badge variant="success" className="bg-green-50 text-green-700 border-green-200">
                    <CreditCard className="h-3 w-3 mr-1" />
                    {type.replace('_', ' ')}
                </Badge>;
            case 'PAYMENT_FAILED':
                return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Payment Failed
                </Badge>;
            case 'USER_CREATED':
            case 'USER_UPDATED':
                return <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Users className="h-3 w-3 mr-1" />
                    {type.replace('_', ' ')}
                </Badge>;
            case 'ORGANIZATION_CREATED':
            case 'ORGANIZATION_APPROVED':
                return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    <Building2 className="h-3 w-3 mr-1" />
                    {type.replace('_', ' ')}
                </Badge>;
            default:
                return <Badge variant="secondary">
                    <Activity className="h-3 w-3 mr-1" />
                    {type.replace(/_/g, ' ')}
                </Badge>;
        }
    };

    const getEntityTypeBadge = (entityType: EntityType) => {
        switch (entityType) {
            case 'USER':
                return <Badge variant="outline">
                    <User className="h-3 w-3 mr-1" />
                    User
                </Badge>;
            case 'PAYMENT':
                return <Badge variant="outline">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Payment
                </Badge>;
            case 'COOPERATIVE':
                return <Badge variant="outline">
                    <Building2 className="h-3 w-3 mr-1" />
                    Cooperative
                </Badge>;
            case 'SYSTEM':
                return <Badge variant="outline">
                    <Database className="h-3 w-3 mr-1" />
                    System
                </Badge>;
            default:
                return <Badge variant="secondary">
                    <Activity className="h-3 w-3 mr-1" />
                    {entityType}
                </Badge>;
        }
    };

    const getSecurityEventBadge = (isSecurityEvent: boolean) => {
        if (isSecurityEvent) {
            return <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Security Event
            </Badge>;
        }
        return null;
    };

    const handleExportActivities = async () => {
        try {
            // Create CSV content
            const csvHeaders = ['Date', 'Type', 'Entity', 'User', 'Description', 'Cooperative', 'Security Event', 'IP Address'];
            const csvRows = activities.map(activity => [
                new Date(activity.createdAt).toLocaleString(),
                activity.type,
                activity.entityType,
                activity.user ? `${activity.user.firstName} ${activity.user.lastName} (${activity.user.phone})` : 'N/A',
                activity.description,
                activity.cooperative?.name || 'N/A',
                activity.isSecurityEvent ? 'Yes' : 'No',
                activity.ipAddress || 'N/A'
            ]);

            const csvContent = [csvHeaders, ...csvRows]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');

            // Download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `activities-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Failed to export activities:', err);
            alert('Failed to export activity data. Please try again.');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-copay-navy flex items-center gap-2">
                            <Activity className="text-copay-blue" />
                            Activity Management
                        </h1>
                        <p className="text-copay-gray">
                            Monitor system activities and security events across the platform
                        </p>
                    </div>
                    <div className="flex space-x-2 mt-4 sm:mt-0">
                        <Button variant="outline" onClick={handleExportActivities}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                        </Button>
                        <Button asChild>
                            <Link href="/activities/security">
                                <Shield className="h-4 w-4 mr-2" />
                                Security Events
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Activity Statistics */}
                {error ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Failed to load activities</h2>
                            <p className="text-gray-600 mb-6 text-center max-w-md">
                                We encountered an error while loading the activities data. Please try refreshing the page or contact support if the problem persists.
                            </p>
                            <div className="bg-gray-50 p-4 rounded-lg mb-6 w-full max-w-md">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Error Details (Development Only)</h3>
                                <code className="text-xs text-red-600 break-all">{error}</code>
                            </div>
                            <div className="flex space-x-3">
                                <Button onClick={() => fetchActivitiesAndStats()}>
                                    Try Again
                                </Button>
                                <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                                    Go to Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
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
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Last 24 Hours
                                </CardTitle>
                                <Clock className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    {loading ? (
                                        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(stats?.last24Hours || 0)
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Last 7 Days
                                </CardTitle>
                                <Calendar className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {loading ? (
                                        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(stats?.last7Days || 0)
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter Activities
                        </CardTitle>
                        <CardDescription>
                            Search and filter activities by various criteria
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <Input
                                    placeholder="Search description..."
                                    value={filters.search || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                />
                            </div>

                            <div>
                                <Select
                                    value={filters.type || 'all'}
                                    onValueChange={(value) => setFilters(prev => ({
                                        ...prev,
                                        type: value === 'all' ? undefined : (value as ActType),
                                        page: 1
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Activity Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="LOGIN">Login</SelectItem>
                                        <SelectItem value="LOGOUT">Logout</SelectItem>
                                        <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                                        <SelectItem value="PAYMENT_CREATED">Payment Created</SelectItem>
                                        <SelectItem value="PAYMENT_COMPLETED">Payment Completed</SelectItem>
                                        <SelectItem value="USER_CREATED">User Created</SelectItem>
                                        <SelectItem value="ORGANIZATION_CREATED">Organization Created</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Select
                                    value={filters.entityType || 'all'}
                                    onValueChange={(value) => setFilters(prev => ({
                                        ...prev,
                                        entityType: value === 'all' ? undefined : (value as EntityType),
                                        page: 1
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Entity Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Entities</SelectItem>
                                        <SelectItem value="USER">User</SelectItem>
                                        <SelectItem value="PAYMENT">Payment</SelectItem>
                                        <SelectItem value="COOPERATIVE">Cooperative</SelectItem>
                                        <SelectItem value="SYSTEM">System</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Select
                                    value={filters.isSecurityEvent === undefined ? 'all' : (filters.isSecurityEvent ? 'security' : 'normal')}
                                    onValueChange={(value) => setFilters(prev => ({
                                        ...prev,
                                        isSecurityEvent: value === 'all' ? undefined : value === 'security',
                                        page: 1
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Event Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Events</SelectItem>
                                        <SelectItem value="security">Security Events</SelectItem>
                                        <SelectItem value="normal">Normal Events</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Activities Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Activities ({formatNumber(activities.length)})
                        </CardTitle>
                        <CardDescription>
                            Detailed activity logs with user and system events
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                                ))}
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-8">
                                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-copay-navy mb-2">No activities found</h3>
                                <p className="text-copay-gray">
                                    {Object.values(filters).some(v => v)
                                        ? 'Try adjusting your filters to see more activities.'
                                        : 'Activities will appear here as users interact with the system.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Entity</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Cooperative</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activities.map((activity) => (
                                            <TableRow key={activity.id}>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {getActivityTypeBadge(activity.type)}
                                                        {getSecurityEventBadge(activity.isSecurityEvent)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getEntityTypeBadge(activity.entityType)}
                                                </TableCell>
                                                <TableCell>
                                                    {activity.user ? (
                                                        <div className="space-y-1">
                                                            <p className="font-medium text-copay-navy">
                                                                {activity.user.firstName} {activity.user.lastName}
                                                            </p>
                                                            <p className="text-sm text-copay-gray">{activity.user.phone}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">System</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm">{activity.description}</p>
                                                    {activity.ipAddress && (
                                                        <p className="text-xs text-copay-gray mt-1">IP: {activity.ipAddress}</p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {activity.cooperative ? (
                                                        <div className="space-y-1">
                                                            <p className="font-medium">{activity.cooperative.name}</p>
                                                            <p className="text-sm text-copay-gray">{activity.cooperative.code}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3 text-copay-gray" />
                                                        <span className="text-sm">
                                                            {new Date(activity.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default withAuth(ActivitiesPage);