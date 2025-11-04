'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Shield,
    AlertTriangle,
    Eye,
    Clock,
    User,
    Globe,
    Download,
    RefreshCw,
    Filter
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
import type { Activity, ActivityFilters, ActivityType } from '@/types';

/**
 * Security Events Page
 * Specialized view for monitoring security-related activities
 */

function SecurityEventsPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [filters, setFilters] = useState<ActivityFilters>({
        page: 1,
        limit: 50,
        search: '',
        isSecurityEvent: true, // Only security events
        type: undefined,
    });

    // Function to refresh security events
    const fetchSecurityEvents = useCallback(async () => {
        const isRefresh = refreshing;
        if (!isRefresh) setLoading(true);
        setError('');

        try {
            const response = await apiClient.activities.getSecurityEvents(filters);

            const activityData = Array.isArray(response)
                ? response
                : (response.data || response);

            setActivities(activityData as Activity[]);
        } catch (err) {
            console.error('Failed to fetch security events:', err);
            const errorMessage = (err as Error)?.message || 'Failed to load security events. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filters, refreshing]);

    useEffect(() => {
        fetchSecurityEvents();
    }, [filters, fetchSecurityEvents]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchSecurityEvents();
    };

    const getSecurityLevelBadge = (type: ActivityType) => {
        switch (type) {
            case 'LOGIN_FAILED':
            case 'MULTIPLE_FAILED_LOGINS':
                return <Badge variant="warning" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Medium Risk
                </Badge>;
            case 'SUSPICIOUS_LOGIN':
            case 'UNAUTHORIZED_ACCESS':
            case 'ACCOUNT_LOCKED':
                return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                    <Shield className="h-3 w-3 mr-1" />
                    High Risk
                </Badge>;
            case 'PASSWORD_RESET_REQUESTED':
            case 'PASSWORD_CHANGED':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <User className="h-3 w-3 mr-1" />
                    Low Risk
                </Badge>;
            default:
                return <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Security Event
                </Badge>;
        }
    };

    const getActivityDescription = (type: ActivityType) => {
        switch (type) {
            case 'LOGIN_FAILED':
                return 'Failed login attempt detected';
            case 'MULTIPLE_FAILED_LOGINS':
                return 'Multiple failed login attempts from same IP/user';
            case 'SUSPICIOUS_LOGIN':
                return 'Login from unusual location or device';
            case 'UNAUTHORIZED_ACCESS':
                return 'Attempted access to restricted resources';
            case 'ACCOUNT_LOCKED':
                return 'User account locked due to security policy';
            case 'PASSWORD_RESET_REQUESTED':
                return 'Password reset requested by user';
            case 'PASSWORD_CHANGED':
                return 'User password successfully changed';
            default:
                return type.replace(/_/g, ' ').toLowerCase();
        }
    };

    const handleExportSecurityEvents = async () => {
        try {
            // Create CSV content for security events
            const csvHeaders = ['Date', 'Event Type', 'Risk Level', 'User', 'Description', 'IP Address', 'Cooperative', 'Additional Info'];
            const csvRows = activities.map(activity => {
                const riskLevel = activity.type.includes('SUSPICIOUS') || activity.type.includes('UNAUTHORIZED')
                    ? 'High'
                    : activity.type.includes('FAILED') || activity.type.includes('LOCKED')
                        ? 'Medium'
                        : 'Low';

                return [
                    new Date(activity.createdAt).toLocaleString(),
                    activity.type,
                    riskLevel,
                    activity.user ? `${activity.user.firstName} ${activity.user.lastName} (${activity.user.phone})` : 'Unknown',
                    activity.description,
                    activity.ipAddress || 'Unknown',
                    activity.cooperative?.name || 'N/A',
                    activity.metadata ? JSON.stringify(activity.metadata) : 'N/A'
                ];
            });

            const csvContent = [csvHeaders, ...csvRows]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');

            // Download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `security-events-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Failed to export security events:', err);
            alert('Failed to export security events. Please try again.');
        }
    };

    const highRiskEvents = activities.filter(a =>
        ['SUSPICIOUS_LOGIN', 'UNAUTHORIZED_ACCESS', 'ACCOUNT_LOCKED'].includes(a.type)
    ).length;

    const mediumRiskEvents = activities.filter(a =>
        ['LOGIN_FAILED', 'MULTIPLE_FAILED_LOGINS'].includes(a.type)
    ).length;

    const lowRiskEvents = activities.filter(a =>
        ['PASSWORD_RESET_REQUESTED', 'PASSWORD_CHANGED'].includes(a.type)
    ).length;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-copay-navy flex items-center gap-2">
                            <Shield className="text-copay-blue" />
                            Security Events
                        </h1>
                        <p className="text-copay-gray">
                            Monitor and respond to security-related activities across the platform
                        </p>
                    </div>
                    <div className="flex space-x-2 mt-4 sm:mt-0">
                        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button variant="outline" onClick={handleExportSecurityEvents}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/activities">
                                <Eye className="h-4 w-4 mr-2" />
                                All Activities
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Security Statistics */}
                {error ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                            <h3 className="text-lg font-medium text-copay-navy mb-2">Failed to load security events</h3>
                            <p className="text-copay-gray mb-4">{error}</p>
                            <Button onClick={handleRefresh}>Try Again</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Total Events
                                </CardTitle>
                                <Shield className="h-4 w-4 text-copay-gray" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-copay-navy">
                                    {loading ? (
                                        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(activities.length)
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    High Risk
                                </CardTitle>
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    {loading ? (
                                        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(highRiskEvents)
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Medium Risk
                                </CardTitle>
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {loading ? (
                                        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(mediumRiskEvents)
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Low Risk
                                </CardTitle>
                                <User className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    {loading ? (
                                        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(lowRiskEvents)
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Security Event Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter Security Events
                        </CardTitle>
                        <CardDescription>
                            Search and filter security events by type and user
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <Input
                                    placeholder="Search events..."
                                    value={filters.search || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                />
                            </div>

                            <div>
                                <Select
                                    value={filters.type || 'all'}
                                    onValueChange={(value) => setFilters(prev => ({
                                        ...prev,
                                        type: value === 'all' ? undefined : (value as ActivityType),
                                        page: 1
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Event Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Security Events</SelectItem>
                                        <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                                        <SelectItem value="MULTIPLE_FAILED_LOGINS">Multiple Failed Logins</SelectItem>
                                        <SelectItem value="SUSPICIOUS_LOGIN">Suspicious Login</SelectItem>
                                        <SelectItem value="UNAUTHORIZED_ACCESS">Unauthorized Access</SelectItem>
                                        <SelectItem value="ACCOUNT_LOCKED">Account Locked</SelectItem>
                                        <SelectItem value="PASSWORD_RESET_REQUESTED">Password Reset</SelectItem>
                                        <SelectItem value="PASSWORD_CHANGED">Password Changed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Select defaultValue="recent">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Time Range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="recent">Last 24 Hours</SelectItem>
                                        <SelectItem value="week">Last 7 Days</SelectItem>
                                        <SelectItem value="month">Last 30 Days</SelectItem>
                                        <SelectItem value="all">All Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Events Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Security Events ({formatNumber(activities.length)})
                        </CardTitle>
                        <CardDescription>
                            Real-time monitoring of security-related activities and threats
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                                ))}
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-8">
                                <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-copay-navy mb-2">No security events found</h3>
                                <p className="text-copay-gray">
                                    {Object.values(filters).some(v => v && v !== true)
                                        ? 'Try adjusting your filters to see more events.'
                                        : 'Great! No security events have been detected recently.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Risk Level</TableHead>
                                            <TableHead>Event Type</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead>Cooperative</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activities.map((activity) => (
                                            <TableRow key={activity.id} className="hover:bg-red-50">
                                                <TableCell>
                                                    {getSecurityLevelBadge(activity.type)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-copay-navy">
                                                        {activity.type.replace(/_/g, ' ')}
                                                    </div>
                                                    <div className="text-sm text-copay-gray">
                                                        {getActivityDescription(activity.type)}
                                                    </div>
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
                                                        <span className="text-gray-500">Unknown User</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm">{activity.description}</p>
                                                    {activity.metadata && (
                                                        <p className="text-xs text-copay-gray mt-1">
                                                            Additional info available
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="h-3 w-3 text-copay-gray" />
                                                        <span className="text-sm font-mono">
                                                            {activity.ipAddress || 'Unknown'}
                                                        </span>
                                                    </div>
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
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {new Date(activity.createdAt).toLocaleDateString()}
                                                            </p>
                                                            <p className="text-xs text-copay-gray">
                                                                {new Date(activity.createdAt).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Button variant="outline" size="sm">
                                                            <Eye className="h-3 w-3 mr-1" />
                                                            Details
                                                        </Button>
                                                        {['SUSPICIOUS_LOGIN', 'UNAUTHORIZED_ACCESS'].includes(activity.type) && (
                                                            <Button variant="destructive" size="sm">
                                                                <Shield className="h-3 w-3 mr-1" />
                                                                Block
                                                            </Button>
                                                        )}
                                                    </div>
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

export default withAuth(SecurityEventsPage);