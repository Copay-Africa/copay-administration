/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import {
    Shield,
    Search,
    Filter,
    Eye,
    Download,
    RefreshCw,
    Clock,
    User,
    Settings,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Activity as ActivityIcon,
    Database,
    Lock,
    Unlock,
    UserPlus,
    UserMinus,
    CreditCard,
    MessageSquare,
    Bell,
    Calendar,
    MapPin,
    Smartphone,
    Monitor,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { apiClient } from '@/lib/api-client';
import type {
    Activity,
    ActivityFilters,
    PaginatedResponse
} from '@/types';

// Activity type icons mapping
const getActivityIcon = (activityType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
        'LOGIN': <Unlock className="w-4 h-4" />,
        'LOGOUT': <Lock className="w-4 h-4" />,
        'LOGIN_FAILED': <XCircle className="w-4 h-4" />,
        'PASSWORD_RESET': <Shield className="w-4 h-4" />,
        'USER_CREATED': <UserPlus className="w-4 h-4" />,
        'USER_UPDATED': <User className="w-4 h-4" />,
        'USER_DELETED': <UserMinus className="w-4 h-4" />,
        'PAYMENT_CREATED': <CreditCard className="w-4 h-4" />,
        'PAYMENT_COMPLETED': <CheckCircle className="w-4 h-4" />,
        'PAYMENT_FAILED': <XCircle className="w-4 h-4" />,
        'COMPLAINT_CREATED': <MessageSquare className="w-4 h-4" />,
        'COMPLAINT_UPDATED': <MessageSquare className="w-4 h-4" />,
        'REMINDER_CREATED': <Bell className="w-4 h-4" />,
        'REMINDER_SENT': <Bell className="w-4 h-4" />,
        'SYSTEM_CONFIG': <Settings className="w-4 h-4" />,
        'SECURITY_EVENT': <AlertTriangle className="w-4 h-4" />,
        'DATA_EXPORT': <Download className="w-4 h-4" />,
        'DATA_IMPORT': <Database className="w-4 h-4" />,
    };
    return iconMap[activityType] || <ActivityIcon className="w-4 h-4" />;
};

// Activity type colors
const getActivityTypeColor = (activityType: string, isSecurityEvent: boolean) => {
    if (isSecurityEvent) {
        return 'bg-red-100 text-red-800 border-red-300';
    }

    if (activityType.includes('LOGIN')) {
        return 'bg-green-100 text-green-800 border-green-300';
    }
    if (activityType.includes('PAYMENT')) {
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    if (activityType.includes('USER')) {
        return 'bg-purple-100 text-purple-800 border-purple-300';
    }
    if (activityType.includes('COMPLAINT')) {
        return 'bg-orange-100 text-orange-800 border-orange-300';
    }
    if (activityType.includes('SYSTEM')) {
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }

    return 'bg-slate-100 text-slate-800 border-slate-300';
};

// Entity type badges
const getEntityTypeBadge = (entityType: string) => {
    const colorMap: Record<string, string> = {
        'USER': 'bg-blue-50 text-blue-700 border-blue-200',
        'PAYMENT': 'bg-green-50 text-green-700 border-green-200',
        'COOPERATIVE': 'bg-purple-50 text-purple-700 border-purple-200',
        'REMINDER': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        'COMPLAINT': 'bg-orange-50 text-orange-700 border-orange-200',
        'SYSTEM': 'bg-gray-50 text-gray-700 border-gray-200',
    };

    return (
        <Badge variant="outline" className={colorMap[entityType] || 'bg-slate-50 text-slate-700'}>
            {entityType}
        </Badge>
    );
};

// Format date for display
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

// Format user agent for display
const formatUserAgent = (userAgent?: string) => {
    if (!userAgent) return 'Unknown';

    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
        return <><Smartphone className="w-3 h-3 inline mr-1" />Mobile</>;
    }
    if (userAgent.includes('Chrome') || userAgent.includes('Firefox') || userAgent.includes('Safari')) {
        return <><Monitor className="w-3 h-3 inline mr-1" />Desktop</>;
    }
    return <><Globe className="w-3 h-3 inline mr-1" />Web</>;
};

export default function AuditTrailPage() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

    const [filters, setFilters] = useState<ActivityFilters>({
        page: 1,
        limit: 20,
        search: '',
        type: undefined,
        entityType: undefined,
        isSecurityEvent: undefined,
        fromDate: undefined,
        toDate: undefined,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
    });

    // Fetch activities using documented endpoints
    const fetchActivities = useCallback(async () => {
        try {
            let response: any;

            // Use appropriate endpoint based on security event filter
            if (filters.isSecurityEvent === true) {
                // Use security activities endpoint for security events only
                response = await apiClient.activities.getSecurityActivities(filters);
            } else {
                // Use general activities endpoint for all activities
                response = await apiClient.activities.getAll(filters);
            }

            setActivities(response.data || []);
            setTotalCount(response.meta?.total || 0);
            setError('');
        } catch (err) {
            console.error('Failed to fetch activities:', err);
            setError('Failed to load audit trail data');
            setActivities([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filters]);

    useEffect(() => {
        setLoading(true);
        fetchActivities();
    }, [fetchActivities]);

    // Handle refresh
    const handleRefresh = () => {
        setRefreshing(true);
        fetchActivities();
    };

    // Handle filter changes
    const handleFilterChange = (key: keyof ActivityFilters, value: string | number | boolean | undefined) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: key !== 'page' ? 1 : (typeof value === 'number' ? value : 1) // Reset to first page unless changing page
        }));
    };

    // Handle export (mock implementation)
    const handleExport = async () => {
        try {
            // In a real implementation, this would call an export API
            const exportData = activities.map(activity => ({
                timestamp: activity.createdAt,
                type: activity.type,
                description: activity.description,
                user: `${activity.user?.firstName || ''} ${activity.user?.lastName || ''}`.trim(),
                entityType: activity.entityType,
                entityId: activity.entityId,
                ipAddress: activity.ipAddress,
                isSecurityEvent: activity.isSecurityEvent
            }));

            // Create and download CSV
            const csvContent = [
                'Timestamp,Type,Description,User,Entity Type,Entity ID,IP Address,Security Event',
                ...exportData.map(row =>
                    `"${row.timestamp}","${row.type}","${row.description}","${row.user}","${row.entityType}","${row.entityId}","${row.ipAddress || ''}","${row.isSecurityEvent}"`
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to export audit trail:', err);
        }
    };

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / (filters.limit || 20));
    const hasNextPage = (filters.page || 1) < totalPages;
    const hasPreviousPage = (filters.page || 1) > 1;

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-copay-navy flex items-center gap-2">
                            <Shield className="w-8 h-8 text-copay-blue" />
                            Audit Trail Management
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Complete system activity logging and security event monitoring
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <a href="/audit-trail/search">
                                <Search className="w-4 h-4 mr-2" />
                                Advanced Search
                            </a>
                        </Button>
                        <Button onClick={handleExport} variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                        <Button onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                            <ActivityIcon className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">All logged activities</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {(activities || []).filter(a => a.isSecurityEvent).length}
                            </div>
                            <p className="text-xs text-muted-foreground">Critical security activities</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">User Activities</CardTitle>
                            <User className="w-4 h-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {(activities || []).filter(a => a.entityType === 'USER').length}
                            </div>
                            <p className="text-xs text-muted-foreground">User-related activities</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Payment Activities</CardTitle>
                            <CreditCard className="w-4 h-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {(activities || []).filter(a => a.entityType === 'PAYMENT').length}
                            </div>
                            <p className="text-xs text-muted-foreground">Payment transactions</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Filter Activities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Search</label>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <Input
                                        placeholder="Search activities..."
                                        value={filters.search || ''}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Activity Type</label>
                                <Select
                                    value={filters.type || 'all'}
                                    onValueChange={(value) => handleFilterChange('type', value === 'all' ? undefined : value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="LOGIN">Login</SelectItem>
                                        <SelectItem value="LOGOUT">Logout</SelectItem>
                                        <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                                        <SelectItem value="PAYMENT_CREATED">Payment Created</SelectItem>
                                        <SelectItem value="PAYMENT_COMPLETED">Payment Completed</SelectItem>
                                        <SelectItem value="USER_CREATED">User Created</SelectItem>
                                        <SelectItem value="USER_UPDATED">User Updated</SelectItem>
                                        <SelectItem value="COMPLAINT_CREATED">Complaint Created</SelectItem>
                                        <SelectItem value="SYSTEM_CONFIG">System Config</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Entity Type</label>
                                <Select
                                    value={filters.entityType || 'all'}
                                    onValueChange={(value) => handleFilterChange('entityType', value === 'all' ? undefined : value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All entities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Entities</SelectItem>
                                        <SelectItem value="USER">User</SelectItem>
                                        <SelectItem value="PAYMENT">Payment</SelectItem>
                                        <SelectItem value="COOPERATIVE">Cooperative</SelectItem>
                                        <SelectItem value="REMINDER">Reminder</SelectItem>
                                        <SelectItem value="COMPLAINT">Complaint</SelectItem>
                                        <SelectItem value="SYSTEM">System</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Security Events</label>
                                <Select
                                    value={filters.isSecurityEvent === true ? 'security' : filters.isSecurityEvent === false ? 'normal' : 'all'}
                                    onValueChange={(value) =>
                                        handleFilterChange('isSecurityEvent',
                                            value === 'security' ? true :
                                                value === 'normal' ? false : undefined
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All activities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Activities</SelectItem>
                                        <SelectItem value="security">Security Events Only</SelectItem>
                                        <SelectItem value="normal">Normal Activities Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">From Date</label>
                                <Input
                                    type="datetime-local"
                                    value={filters.fromDate || ''}
                                    onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">To Date</label>
                                <Input
                                    type="datetime-local"
                                    value={filters.toDate || ''}
                                    onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Error State */}
                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-red-800">
                                <XCircle className="w-5 h-5" />
                                <span>{error}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Activities Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Activity Log ({totalCount.toLocaleString()} total)
                            </span>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Page {filters.page} of {totalPages}</span>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                                <span className="ml-2">Loading audit trail...</span>
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <ActivityIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No activities found matching your filters</p>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Timestamp</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Entity</TableHead>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead>Device</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activities.map((activity) => (
                                            <TableRow key={activity.id} className={activity.isSecurityEvent ? 'bg-red-50 border-red-100' : ''}>
                                                <TableCell className="font-mono text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                                        {formatDate(activity.createdAt)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`${getActivityTypeColor(activity.type, activity.isSecurityEvent)} flex items-center gap-1 w-fit`}
                                                    >
                                                        {getActivityIcon(activity.type)}
                                                        {activity.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-md">
                                                        <p className="truncate" title={activity.description}>
                                                            {activity.description}
                                                        </p>
                                                        {activity.isSecurityEvent && (
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                                                <span className="text-xs text-red-600 font-medium">Security Event</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3 h-3 text-muted-foreground" />
                                                        <span className="font-medium">
                                                            {activity.user ?
                                                                `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() ||
                                                                activity.user.phone || 'Unknown User'
                                                                : 'System'
                                                            }
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        {getEntityTypeBadge(activity.entityType)}
                                                        {activity.entityId && (
                                                            <span className="text-xs text-muted-foreground font-mono">
                                                                ID: {activity.entityId.slice(-8)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MapPin className="w-3 h-3 text-muted-foreground" />
                                                        <span className="font-mono">
                                                            {activity.ipAddress || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {formatUserAgent(activity.userAgent)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedActivity(activity)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {((filters.page || 1) - 1) * (filters.limit || 20) + 1} to{' '}
                                        {Math.min((filters.page || 1) * (filters.limit || 20), totalCount)} of{' '}
                                        {totalCount} activities
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!hasPreviousPage}
                                            onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!hasNextPage}
                                            onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Detail Modal */}
                {selectedActivity && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    {getActivityIcon(selectedActivity.type)}
                                    Activity Details
                                </h3>
                                <Button variant="ghost" onClick={() => setSelectedActivity(null)}>
                                    <XCircle className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Activity Type</label>
                                        <div className="mt-1">
                                            <Badge
                                                variant="outline"
                                                className={`${getActivityTypeColor(selectedActivity.type, selectedActivity.isSecurityEvent)} flex items-center gap-1 w-fit`}
                                            >
                                                {getActivityIcon(selectedActivity.type)}
                                                {selectedActivity.type}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                                        <p className="mt-1 font-mono text-sm">{formatDate(selectedActivity.createdAt)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">User</label>
                                        <p className="mt-1">
                                            {selectedActivity.user ?
                                                `${selectedActivity.user.firstName || ''} ${selectedActivity.user.lastName || ''}`.trim() ||
                                                selectedActivity.user.phone || 'Unknown User'
                                                : 'System'
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Entity Type</label>
                                        <div className="mt-1">
                                            {getEntityTypeBadge(selectedActivity.entityType)}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Entity ID</label>
                                        <p className="mt-1 font-mono text-sm">{selectedActivity.entityId}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                                        <p className="mt-1 font-mono text-sm">{selectedActivity.ipAddress || 'Unknown'}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                                    <p className="mt-1">{selectedActivity.description}</p>
                                </div>
                                {selectedActivity.userAgent && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">User Agent</label>
                                        <p className="mt-1 text-sm font-mono bg-gray-50 p-2 rounded break-all">
                                            {selectedActivity.userAgent}
                                        </p>
                                    </div>
                                )}
                                {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Metadata</label>
                                        <pre className="mt-1 text-sm bg-gray-50 p-2 rounded overflow-x-auto">
                                            {JSON.stringify(selectedActivity.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {selectedActivity.isSecurityEvent && (
                                    <div className="bg-red-50 border border-red-200 p-3 rounded">
                                        <div className="flex items-center gap-2 text-red-800 font-medium">
                                            <AlertTriangle className="w-4 h-4" />
                                            Security Event
                                        </div>
                                        <p className="text-red-700 text-sm mt-1">
                                            This activity has been flagged as a security event and requires attention.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}