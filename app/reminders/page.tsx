'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Bell,
    Plus,
    Download,
    Filter,
    Clock,
    Calendar,
    CheckCircle,
    Pause,
    Play,
    Eye,
    Repeat,
    Trash2,
    AlertTriangle
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
import type { Reminder, ReminderFilters, ReminderStats, ReminderType, ReminderStatus } from '@/types';

/**
 * Reminders Management Page
 * Automated payment reminders and notification management for Super Admins
 */

function RemindersPage() {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [stats, setStats] = useState<ReminderStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<ReminderFilters>({
        page: 1,
        limit: 20,
        search: '',
        type: undefined,
        status: undefined,
        isRecurring: undefined,
        isDue: undefined,
    });

    // Function to refresh reminders and stats
    const fetchRemindersAndStats = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch reminders and stats in parallel
            const [remindersResponse, statsResponse] = await Promise.all([
                apiClient.reminders.getAll(filters),
                apiClient.reminders.getStats()
            ]);

            // Handle response format - could be array directly or wrapped in data property
            const reminderData = Array.isArray(remindersResponse)
                ? remindersResponse
                : (remindersResponse.data || remindersResponse);

            setReminders(reminderData as Reminder[]);
            setStats(statsResponse as ReminderStats);
        } catch (err) {
            console.error('Failed to fetch reminders:', err);
            const errorMessage = (err as Error)?.message || 'Failed to load reminders. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchRemindersAndStats();
    }, [filters, fetchRemindersAndStats]);

    const getReminderTypeBadge = (type: ReminderType) => {
        switch (type) {
            case 'PAYMENT_DUE':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Payment Due
                </Badge>;
            case 'PAYMENT_OVERDUE':
                return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Overdue
                </Badge>;
            case 'CUSTOM':
                return <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Bell className="h-3 w-3 mr-1" />
                    Custom
                </Badge>;
            default:
                return <Badge variant="secondary">
                    <Bell className="h-3 w-3 mr-1" />
                    {type}
                </Badge>;
        }
    };

    const getReminderStatusBadge = (status: ReminderStatus) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge variant="success" className="bg-green-50 text-green-700 border-green-200">
                    <Play className="h-3 w-3 mr-1" />
                    Active
                </Badge>;
            case 'PAUSED':
                return <Badge variant="warning" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Pause className="h-3 w-3 mr-1" />
                    Paused
                </Badge>;
            case 'COMPLETED':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                </Badge>;
            case 'CANCELLED':
                return <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Cancelled
                </Badge>;
            default:
                return <Badge variant="secondary">
                    {status}
                </Badge>;
        }
    };

    const handlePauseReminder = async (reminderId: string, currentStatus: ReminderStatus) => {
        try {
            const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
            await apiClient.reminders.updateStatus(reminderId, newStatus);

            // Refresh the reminders list
            fetchRemindersAndStats();
        } catch (err) {
            console.error('Failed to update reminder status:', err);
            alert('Failed to update reminder status. Please try again.');
        }
    };



    const handleExportReminders = async () => {
        try {
            // Create CSV content
            const csvHeaders = ['Title', 'Type', 'Status', 'Due Date', 'Recurring', 'Payment Type', 'Cooperative', 'Amount', 'Created'];
            const csvRows = reminders.map(reminder => [
                reminder.title,
                reminder.type,
                reminder.status,
                new Date(reminder.reminderDate).toLocaleString(),
                reminder.isRecurring ? 'Yes' : 'No',
                reminder.paymentType?.name || 'N/A',
                reminder.cooperative?.name || 'N/A',
                reminder.customAmount ? `${reminder.customAmount.toLocaleString()} RWF` : 'N/A',
                new Date(reminder.createdAt).toLocaleString()
            ]);

            const csvContent = [csvHeaders, ...csvRows]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');

            // Download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `reminders-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Failed to export reminders:', err);
            alert('Failed to export reminder data. Please try again.');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-copay-navy">Reminders Overview</h1>
                        <p className="text-copay-gray">
                            Monitor automated payment reminders and notifications across all cooperatives
                        </p>
                    </div>
                    <div className="flex space-x-2 mt-4 sm:mt-0">
                        <Button variant="outline" onClick={handleExportReminders}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                        </Button>
                    </div>
                </div>

                {/* Reminder Statistics */}
                {error ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                            <h3 className="text-lg font-medium text-copay-navy mb-2">Failed to load reminders</h3>
                            <p className="text-copay-gray mb-4">{error}</p>
                            <Button onClick={() => window.location.reload()}>Try Again</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Total Reminders
                                </CardTitle>
                                <Bell className="h-4 w-4 text-copay-gray" />
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
                                    Active Reminders
                                </CardTitle>
                                <Play className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {loading ? (
                                        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(stats?.active || 0)
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Due Today
                                </CardTitle>
                                <Clock className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">
                                    {loading ? (
                                        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(stats?.dueToday || 0)
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Recurring
                                </CardTitle>
                                <Repeat className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    {loading ? (
                                        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(stats?.recurring || 0)
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
                            Filter Reminders
                        </CardTitle>
                        <CardDescription>
                            Search and filter reminders by type, status, and other criteria
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                            <div>
                                <Input
                                    placeholder="Search reminders..."
                                    value={filters.search || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                />
                            </div>

                            <div>
                                <Select
                                    value={filters.type || 'all'}
                                    onValueChange={(value) => setFilters(prev => ({
                                        ...prev,
                                        type: value === 'all' ? undefined : (value as ReminderType),
                                        page: 1
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="PAYMENT_DUE">Payment Due</SelectItem>
                                        <SelectItem value="PAYMENT_OVERDUE">Payment Overdue</SelectItem>
                                        <SelectItem value="CUSTOM">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Select
                                    value={filters.status || 'all'}
                                    onValueChange={(value) => setFilters(prev => ({
                                        ...prev,
                                        status: value === 'all' ? undefined : (value as ReminderStatus),
                                        page: 1
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="PAUSED">Paused</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Select
                                    value={filters.isRecurring === undefined ? 'all' : (filters.isRecurring ? 'recurring' : 'one-time')}
                                    onValueChange={(value) => setFilters(prev => ({
                                        ...prev,
                                        isRecurring: value === 'all' ? undefined : value === 'recurring',
                                        page: 1
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Frequencies</SelectItem>
                                        <SelectItem value="recurring">Recurring</SelectItem>
                                        <SelectItem value="one-time">One-time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Select
                                    value={filters.isDue === undefined ? 'all' : (filters.isDue ? 'due' : 'not-due')}
                                    onValueChange={(value) => setFilters(prev => ({
                                        ...prev,
                                        isDue: value === 'all' ? undefined : value === 'due',
                                        page: 1
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Due Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Reminders</SelectItem>
                                        <SelectItem value="due">Due Now</SelectItem>
                                        <SelectItem value="not-due">Not Due</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Reminders Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Reminders ({formatNumber(reminders.length)})
                        </CardTitle>
                        <CardDescription>
                            Automated payment reminders and notifications management
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                                ))}
                            </div>
                        ) : reminders.length === 0 ? (
                            <div className="text-center py-8">
                                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-copay-navy mb-2">No reminders found</h3>
                                <p className="text-copay-gray mb-4">
                                    {Object.values(filters).some(v => v)
                                        ? 'Try adjusting your filters to see more reminders.'
                                        : 'No reminders are currently set up in the system.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Frequency</TableHead>
                                            <TableHead>Payment Type</TableHead>
                                            <TableHead>Cooperative</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reminders.map((reminder) => (
                                            <TableRow key={reminder.id}>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-copay-navy">{reminder.title}</p>
                                                        <p className="text-sm text-copay-gray line-clamp-2">{reminder.description}</p>
                                                        {reminder.customAmount && (
                                                            <p className="text-sm font-medium text-green-600">
                                                                {reminder.customAmount.toLocaleString()} RWF
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getReminderTypeBadge(reminder.type)}
                                                </TableCell>
                                                <TableCell>
                                                    {getReminderStatusBadge(reminder.status)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-3 w-3 text-copay-gray" />
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {new Date(reminder.reminderDate).toLocaleDateString()}
                                                            </p>
                                                            <p className="text-xs text-copay-gray">
                                                                {new Date(reminder.reminderDate).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {reminder.isRecurring ? (
                                                            <>
                                                                <Repeat className="h-3 w-3 text-blue-500" />
                                                                <span className="text-sm">{reminder.recurringPattern}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm text-gray-500">One-time</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {reminder.paymentType ? (
                                                        <div className="space-y-1">
                                                            <p className="font-medium">{reminder.paymentType.name}</p>
                                                            <p className="text-sm text-copay-gray">{reminder.paymentType.description}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {reminder.cooperative ? (
                                                        <div className="space-y-1">
                                                            <p className="font-medium">{reminder.cooperative.name}</p>
                                                            <p className="text-sm text-copay-gray">{reminder.cooperative.code}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">All Cooperatives</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-1">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/reminders/${reminder.id}`}>
                                                                <Eye className="h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handlePauseReminder(reminder.id, reminder.status)}
                                                        >
                                                            {reminder.status === 'ACTIVE' ? (
                                                                <Pause className="h-3 w-3" />
                                                            ) : (
                                                                <Play className="h-3 w-3" />
                                                            )}
                                                        </Button>
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

export default withAuth(RemindersPage);