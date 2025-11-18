'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Megaphone,
    Plus,
    Download,
    Filter,
    Clock,
    Send,
    CheckCircle,
    XCircle,
    Eye,
    Edit,
    Trash2,
    AlertTriangle,
    Users,
    Calendar,
    Flag
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
import type { 
  Announcement, 
  AnnouncementFilters, 
  AnnouncementStats, 
  AnnouncementStatus, 
  AnnouncementPriority,
  AnnouncementTargetType 
} from '@/types';

/**
 * Announcements Management Page
 * System-wide announcement creation and delivery management for Super Admins
 */

function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [stats, setStats] = useState<AnnouncementStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<AnnouncementFilters>({
        page: 1,
        limit: 20,
        search: '',
        status: undefined,
        priority: undefined,
    });

    // Function to refresh announcements and stats
    const fetchAnnouncementsAndStats = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch announcements and stats in parallel
            const [announcementsResponse, statsResponse] = await Promise.all([
                apiClient.announcements.getAll(filters),
                apiClient.announcements.getStats()
            ]);

            // Handle response format - could be array directly or wrapped in data property
            const announcementData = Array.isArray(announcementsResponse)
                ? announcementsResponse
                : (announcementsResponse.data || announcementsResponse);

            setAnnouncements(announcementData as Announcement[]);
            setStats(statsResponse as AnnouncementStats);
        } catch (err) {
            console.error('Failed to fetch announcements:', err);
            const errorMessage = (err as Error)?.message || 'Failed to load announcements. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchAnnouncementsAndStats();
    }, [filters, fetchAnnouncementsAndStats]);

    const getStatusBadge = (status: AnnouncementStatus) => {
        switch (status) {
            case 'DRAFT':
                return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                    <Edit className="h-3 w-3 mr-1" />
                    Draft
                </Badge>;
            case 'SCHEDULED':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Scheduled
                </Badge>;
            case 'SENDING':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Send className="h-3 w-3 mr-1" />
                    Sending
                </Badge>;
            case 'SENT':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Sent
                </Badge>;
            case 'CANCELLED':
                return <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    Cancelled
                </Badge>;
            default:
                return <Badge variant="secondary">
                    {status}
                </Badge>;
        }
    };

    const getPriorityBadge = (priority: AnnouncementPriority) => {
        switch (priority) {
            case 'URGENT':
                return <Badge variant="destructive" className="bg-red-600 text-white">
                    <Flag className="h-3 w-3 mr-1" />
                    Urgent
                </Badge>;
            case 'HIGH':
                return <Badge variant="destructive" className="bg-orange-500 text-white">
                    <Flag className="h-3 w-3 mr-1" />
                    High
                </Badge>;
            case 'MEDIUM':
                return <Badge variant="outline" className="bg-blue-500 text-white">
                    <Flag className="h-3 w-3 mr-1" />
                    Medium
                </Badge>;
            case 'LOW':
                return <Badge variant="secondary" className="bg-gray-400 text-white">
                    <Flag className="h-3 w-3 mr-1" />
                    Low
                </Badge>;
            default:
                return <Badge variant="secondary">
                    {priority}
                </Badge>;
        }
    };

    const getTargetTypeBadge = (targetType: AnnouncementTargetType) => {
        switch (targetType) {
            case 'ALL_TENANTS':
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Users className="h-3 w-3 mr-1" />
                    All Tenants
                </Badge>;
            case 'ALL_ORGANIZATION_ADMINS':
                return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    <Users className="h-3 w-3 mr-1" />
                    All Org Admins
                </Badge>;
            case 'SPECIFIC_COOPERATIVE':
                return <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                    <Users className="h-3 w-3 mr-1" />
                    Specific Coop
                </Badge>;
            case 'SPECIFIC_USERS':
                return <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                    <Users className="h-3 w-3 mr-1" />
                    Specific Users
                </Badge>;
            default:
                return <Badge variant="secondary">
                    {targetType}
                </Badge>;
        }
    };

    const handleSendAnnouncement = async (announcementId: string) => {
        try {
            await apiClient.announcements.send(announcementId);
            // Refresh the announcements list
            fetchAnnouncementsAndStats();
        } catch (err) {
            console.error('Failed to send announcement:', err);
            alert('Failed to send announcement. Please try again.');
        }
    };

    const handleDeleteAnnouncement = async (announcementId: string) => {
        if (confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
            try {
                await apiClient.announcements.remove(announcementId);
                // Refresh the announcements list
                fetchAnnouncementsAndStats();
            } catch (err) {
                console.error('Failed to delete announcement:', err);
                alert('Failed to delete announcement. Please try again.');
            }
        }
    };

    const handleExportAnnouncements = async () => {
        try {
            // Create CSV content
            const csvHeaders = ['Title', 'Status', 'Priority', 'Target Type', 'Recipients', 'Scheduled For', 'Sent At', 'Created By', 'Created At'];
            const csvRows = announcements.map(announcement => [
                announcement.title,
                announcement.status,
                announcement.priority,
                announcement.targetType,
                announcement.estimatedRecipientsCount || 'N/A',
                announcement.scheduledFor ? new Date(announcement.scheduledFor).toLocaleString() : 'N/A',
                announcement.sentAt ? new Date(announcement.sentAt).toLocaleString() : 'N/A',
                announcement.createdBy.name,
                new Date(announcement.createdAt).toLocaleString()
            ]);

            const csvContent = [csvHeaders, ...csvRows]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');

            // Download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `announcements-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Failed to export announcements:', err);
            alert('Failed to export announcement data. Please try again.');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-copay-navy flex items-center gap-2">
                            <Megaphone className="h-6 w-6 text-copay-blue" />
                            Announcements Management
                        </h1>
                        <p className="text-copay-gray mt-1">
                            Create and manage system-wide announcements for tenants and administrators
                        </p>
                    </div>
                    <div className="flex space-x-2 mt-4 sm:mt-0">
                        <Button variant="outline" onClick={handleExportAnnouncements}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                        </Button>
                        <Button asChild className="bg-copay-blue hover:bg-copay-navy text-white">
                            <Link href="/announcements/create">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Announcement
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Announcement Statistics */}
                {error ? (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                            <h3 className="text-lg font-medium text-copay-navy mb-2">Failed to load announcements</h3>
                            <p className="text-copay-gray mb-4">{error}</p>
                            <Button onClick={() => window.location.reload()} className="bg-copay-blue hover:bg-copay-navy text-white">Try Again</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Total Announcements
                                </CardTitle>
                                <Megaphone className="h-4 w-4 text-copay-gray" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-copay-navy">
                                    {loading ? (
                                        <div className="h-8 bg-copay-light-gray rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(stats?.totalAnnouncements || 0)
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Sent Today
                                </CardTitle>
                                <Send className="h-4 w-4 text-copay-blue" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-copay-blue">
                                    {loading ? (
                                        <div className="h-8 bg-copay-light-gray rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(stats?.sentToday || 0)
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Scheduled
                                </CardTitle>
                                <Clock className="h-4 w-4 text-copay-blue" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-copay-blue">
                                    {loading ? (
                                        <div className="h-8 bg-copay-light-gray rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(stats?.byStatus?.SCHEDULED || 0)
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Draft
                                </CardTitle>
                                <Edit className="h-4 w-4 text-copay-gray" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-copay-navy">
                                    {loading ? (
                                        <div className="h-8 bg-copay-light-gray rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(stats?.byStatus?.DRAFT || 0)
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card className="border-copay-light-gray">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-copay-navy">
                            <Filter className="h-5 w-5" />
                            Filter Announcements
                        </CardTitle>
                        <CardDescription>
                            Search and filter announcements by status, priority, and other criteria
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <Input
                                    placeholder="Search announcements..."
                                    value={filters.search || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                />
                            </div>

                            <div>
                                <Select
                                    value={filters.status || 'all'}
                                    onValueChange={(value) => setFilters(prev => ({
                                        ...prev,
                                        status: value === 'all' ? undefined : (value as AnnouncementStatus),
                                        page: 1
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="DRAFT">Draft</SelectItem>
                                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                        <SelectItem value="SENDING">Sending</SelectItem>
                                        <SelectItem value="SENT">Sent</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Select
                                    value={filters.priority || 'all'}
                                    onValueChange={(value) => setFilters(prev => ({
                                        ...prev,
                                        priority: value === 'all' ? undefined : (value as AnnouncementPriority),
                                        page: 1
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Priorities</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="LOW">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Announcements Table */}
                <Card className="border-copay-light-gray">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-copay-navy">
                            <Megaphone className="h-5 w-5" />
                            Announcements ({formatNumber(announcements.length)})
                        </CardTitle>
                        <CardDescription>
                            System-wide announcements and notification management
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-16 bg-copay-light-gray rounded animate-pulse"></div>
                                ))}
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="text-center py-8">
                                <Megaphone className="h-12 w-12 text-copay-gray mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium text-copay-navy mb-2">No announcements found</h3>
                                <p className="text-copay-gray mb-4">
                                    {Object.values(filters).some(v => v)
                                        ? 'Try adjusting your filters to see more announcements.'
                                        : 'Create your first system announcement to get started.'}
                                </p>
                                <Button asChild className="bg-copay-blue hover:bg-copay-navy text-white">
                                    <Link href="/announcements/create">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create First Announcement
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Target</TableHead>
                                            <TableHead>Recipients</TableHead>
                                            <TableHead>Schedule</TableHead>
                                            <TableHead>Created By</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {announcements.map((announcement) => (
                                            <TableRow key={announcement.id}>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-copay-navy">{announcement.title}</p>
                                                        <p className="text-sm text-copay-gray line-clamp-2">{announcement.message}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(announcement.status)}
                                                </TableCell>
                                                <TableCell>
                                                    {getPriorityBadge(announcement.priority)}
                                                </TableCell>
                                                <TableCell>
                                                    {getTargetTypeBadge(announcement.targetType)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-center">
                                                        <p className="font-medium text-copay-navy">
                                                            {announcement.actualRecipientsCount || announcement.estimatedRecipientsCount || 0}
                                                        </p>
                                                        <p className="text-xs text-copay-gray">
                                                            {announcement.actualRecipientsCount ? 'Actual' : 'Estimated'}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {announcement.scheduledFor ? (
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-3 w-3 text-copay-gray" />
                                                            <div>
                                                                <p className="text-sm font-medium">
                                                                    {new Date(announcement.scheduledFor).toLocaleDateString()}
                                                                </p>
                                                                <p className="text-xs text-copay-gray">
                                                                    {new Date(announcement.scheduledFor).toLocaleTimeString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">Immediate</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-sm">{announcement.createdBy.name}</p>
                                                        <p className="text-xs text-copay-gray">{announcement.createdBy.role}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-1">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/announcements/${announcement.id}`}>
                                                                <Eye className="h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                        
                                                        {announcement.status === 'DRAFT' && (
                                                            <Button variant="outline" size="sm" asChild>
                                                                <Link href={`/announcements/${announcement.id}/edit`}>
                                                                    <Edit className="h-3 w-3" />
                                                                </Link>
                                                            </Button>
                                                        )}

                                                        {(announcement.status === 'DRAFT' || announcement.status === 'SCHEDULED') && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleSendAnnouncement(announcement.id)}
                                                            >
                                                                <Send className="h-3 w-3" />
                                                            </Button>
                                                        )}

                                                        {(announcement.status === 'DRAFT' || announcement.status === 'CANCELLED') && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
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

export default withAuth(AnnouncementsPage);