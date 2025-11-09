'use client';

import { useState, useCallback } from 'react';
import {
    Search,
    Filter,
    Calendar,
    User,
    MapPin,
    Activity as ActivityIcon,
    AlertTriangle,
    Download,
    RefreshCw,
    Clock,
    ChevronDown,
    ChevronUp,
    X
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
    Activity as ActivityType,
    ActivityFilters,
    PaginatedResponse
} from '@/types';

interface AuditSearchProps {
    className?: string;
}

// Activity type groups for easier filtering
const activityTypeGroups = {
    'Authentication': ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET'],
    'User Management': ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_STATUS_CHANGED'],
    'Payment Operations': ['PAYMENT_CREATED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED'],
    'Complaints': ['COMPLAINT_CREATED', 'COMPLAINT_UPDATED', 'COMPLAINT_RESOLVED'],
    'System Configuration': ['SYSTEM_CONFIG', 'SETTINGS_CHANGED', 'POLICY_UPDATED'],
    'Security Events': ['SUSPICIOUS_LOGIN', 'MULTIPLE_FAILED_LOGINS', 'UNAUTHORIZED_ACCESS', 'SECURITY_POLICY_CHANGE']
};

// Get activity icon
const getActivityIcon = (activityType: string) => {
    if (activityType.includes('LOGIN')) return <User className="w-4 h-4" />;
    if (activityType.includes('PAYMENT')) return <ActivityIcon className="w-4 h-4" />;
    if (activityType.includes('SECURITY') || activityType.includes('SUSPICIOUS')) return <AlertTriangle className="w-4 h-4" />;
    return <ActivityIcon className="w-4 h-4" />;
};

// Get activity color
const getActivityColor = (activityType: string, isSecurityEvent: boolean) => {
    if (isSecurityEvent) return 'bg-red-100 text-red-800 border-red-300';
    if (activityType.includes('LOGIN')) return 'bg-green-100 text-green-800 border-green-300';
    if (activityType.includes('PAYMENT')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (activityType.includes('USER')) return 'bg-purple-100 text-purple-800 border-purple-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
};

// Format date
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

export function AuditSearch({ className }: AuditSearchProps) {
    const [activities, setActivities] = useState<ActivityType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);

    const [filters, setFilters] = useState<ActivityFilters>({
        page: 1,
        limit: 50,
        search: '',
        type: undefined,
        entityType: undefined,
        userId: undefined,
        isSecurityEvent: undefined,
        fromDate: undefined,
        toDate: undefined,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
    });

    // Search activities
    const searchActivities = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            let response: PaginatedResponse<ActivityType>;

            // Use appropriate endpoint based on filters
            if (filters.isSecurityEvent === true) {
                response = await apiClient.activities.getSecurityActivities(filters) as PaginatedResponse<ActivityType>;
            } else {
                response = await apiClient.activities.getAll(filters) as PaginatedResponse<ActivityType>;
            }

            setActivities(response.data || []);
            setTotalCount(response.meta?.total || 0);
        } catch (err) {
            console.error('Failed to search activities:', err);
            setError('Failed to search audit trail');
            setActivities([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Handle filter change
    const handleFilterChange = (key: keyof ActivityFilters, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: key !== 'page' ? 1 : value
        }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            page: 1,
            limit: 50,
            search: '',
            type: undefined,
            entityType: undefined,
            userId: undefined,
            isSecurityEvent: undefined,
            fromDate: undefined,
            toDate: undefined,
            sortBy: 'createdAt',
            sortOrder: 'DESC'
        });
    };

    // Export search results
    const exportResults = async () => {
        try {
            const exportData = activities.map(activity => ({
                timestamp: activity.createdAt,
                type: activity.type,
                description: activity.description,
                user: activity.user ? `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() : 'System',
                entityType: activity.entityType,
                entityId: activity.entityId,
                ipAddress: activity.ipAddress || '',
                isSecurityEvent: activity.isSecurityEvent,
                userAgent: activity.userAgent || ''
            }));

            const csvContent = [
                'Timestamp,Type,Description,User,Entity Type,Entity ID,IP Address,Security Event,User Agent',
                ...exportData.map(row =>
                    `"${row.timestamp}","${row.type}","${row.description}","${row.user}","${row.entityType}","${row.entityId}","${row.ipAddress}","${row.isSecurityEvent}","${row.userAgent}"`
                )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `audit-search-results-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to export results:', err);
        }
    };

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / (filters.limit || 50));
    const hasNextPage = (filters.page || 1) < totalPages;
    const hasPreviousPage = (filters.page || 1) > 1;

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Search className="w-7 h-7 text-blue-600" />
                        Audit Search
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Advanced search and filtering for audit trail data
                    </p>
                </div>
            </div>

            {/* Search Interface */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Search Filters
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        >
                            {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            Advanced
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Basic Search */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Search Description</label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search activity descriptions..."
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
                                    {Object.entries(activityTypeGroups).map(([group, types]) =>
                                        types.map(type => (
                                            <SelectItem key={type} value={type}>
                                                {type.replace(/_/g, ' ')}
                                            </SelectItem>
                                        ))
                                    )}
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

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    <label className="text-sm font-medium">Sort By</label>
                                    <Select
                                        value={filters.sortBy || 'createdAt'}
                                        onValueChange={(value) => handleFilterChange('sortBy', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="createdAt">Created Date</SelectItem>
                                            <SelectItem value="type">Activity Type</SelectItem>
                                            <SelectItem value="entityType">Entity Type</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Sort Order</label>
                                    <Select
                                        value={filters.sortOrder || 'DESC'}
                                        onValueChange={(value: 'ASC' | 'DESC') => handleFilterChange('sortOrder', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sort order" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DESC">Newest First</SelectItem>
                                            <SelectItem value="ASC">Oldest First</SelectItem>
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
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={searchActivities} disabled={loading}>
                            <Search className="w-4 h-4 mr-2" />
                            Search
                        </Button>
                        <Button onClick={clearFilters} variant="outline">
                            <X className="w-4 h-4 mr-2" />
                            Clear Filters
                        </Button>
                        {activities.length > 0 && (
                            <Button onClick={exportResults} variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Export Results
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Error State */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertTriangle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search Results */}
            {(loading || activities.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Search Results ({totalCount.toLocaleString()} found)
                            </span>
                            {loading && (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                                <span className="ml-2">Searching audit trail...</span>
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No activities found matching your search criteria</p>
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
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activities.map((activity) => (
                                            <TableRow
                                                key={activity.id}
                                                className={activity.isSecurityEvent ? 'bg-red-50 border-red-100' : ''}
                                            >
                                                <TableCell className="font-mono text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3 h-3 text-muted-foreground" />
                                                        {formatDate(activity.createdAt)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`${getActivityColor(activity.type, activity.isSecurityEvent)} flex items-center gap-1 w-fit`}
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
                                                        <Badge variant="outline" className="w-fit">
                                                            {activity.entityType}
                                                        </Badge>
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
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedActivity(activity)}
                                                    >
                                                        <Search className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {((filters.page || 1) - 1) * (filters.limit || 50) + 1} to{' '}
                                        {Math.min((filters.page || 1) * (filters.limit || 50), totalCount)} of{' '}
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
                                        <span className="flex items-center px-3 text-sm">
                                            Page {filters.page} of {totalPages}
                                        </span>
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
            )}

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
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Activity Type</label>
                                    <div className="mt-1">
                                        <Badge
                                            variant="outline"
                                            className={`${getActivityColor(selectedActivity.type, selectedActivity.isSecurityEvent)} flex items-center gap-1 w-fit`}
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
                                        <Badge variant="outline">
                                            {selectedActivity.entityType}
                                        </Badge>
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
    );
}

export default AuditSearch;