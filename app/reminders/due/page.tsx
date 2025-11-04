'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Clock,
    AlertTriangle,
    Bell,
    RefreshCw,
    Calendar,
    Eye,
    CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { formatNumber } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { Reminder, ReminderType, ReminderStatus } from '@/types';

/**
 * Due Reminders Page
 * Monitor and manage reminders that are due for sending
 */

function DueRemindersPage() {
    const [dueReminders, setDueReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);


    // Function to refresh due reminders
    const fetchDueReminders = useCallback(async () => {
        const isRefresh = refreshing;
        if (!isRefresh) setLoading(true);
        setError('');

        try {
            const response = await apiClient.reminders.getDueReminders();

            // Handle response format - could be array directly or wrapped in data property
            const reminderData = Array.isArray(response)
                ? response
                : (response.data || response);

            setDueReminders(reminderData as Reminder[]);
        } catch (err) {
            console.error('Failed to fetch due reminders:', err);
            const errorMessage = (err as Error)?.message || 'Failed to load due reminders. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [refreshing]);

    useEffect(() => {
        fetchDueReminders();
    }, [fetchDueReminders]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDueReminders();
    };

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
                    <Clock className="h-3 w-3 mr-1" />
                    Ready to Send
                </Badge>;
            case 'PAUSED':
                return <Badge variant="warning" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Paused
                </Badge>;
            case 'COMPLETED':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                </Badge>;
            default:
                return <Badge variant="secondary">
                    {status}
                </Badge>;
        }
    };

    const getUrgencyBadge = (reminderDate: string) => {
        const now = new Date();
        const due = new Date(reminderDate);
        const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < 0) {
            return <Badge variant="destructive">Overdue</Badge>;
        } else if (diffHours < 1) {
            return <Badge variant="destructive">Due Now</Badge>;
        } else if (diffHours < 24) {
            return <Badge variant="warning">Due Today</Badge>;
        } else {
            return <Badge variant="outline">Upcoming</Badge>;
        }
    };



    const overdueReminders = dueReminders.filter(r => new Date(r.reminderDate) < new Date());
    const dueTodayReminders = dueReminders.filter(r => {
        const today = new Date();
        const reminderDate = new Date(r.reminderDate);
        return reminderDate.toDateString() === today.toDateString();
    });
    const upcomingReminders = dueReminders.filter(r => {
        const today = new Date();
        const reminderDate = new Date(r.reminderDate);
        return reminderDate > today;
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-copay-navy flex items-center gap-2">
                            <Clock className="h-6 w-6 text-orange-500" />
                            Due Reminders
                        </h1>
                        <p className="text-copay-gray">
                            Monitor reminders that are due for delivery across the system
                        </p>
                    </div>
                    <div className="flex space-x-2 mt-4 sm:mt-0">
                        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/reminders">
                                <Bell className="h-4 w-4 mr-2" />
                                All Reminders
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Due Reminders Statistics */}
                {error ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                            <h3 className="text-lg font-medium text-copay-navy mb-2">Failed to load due reminders</h3>
                            <p className="text-copay-gray mb-4">{error}</p>
                            <Button onClick={handleRefresh}>Try Again</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Total Due
                                </CardTitle>
                                <Clock className="h-4 w-4 text-copay-gray" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-copay-navy">
                                    {loading ? (
                                        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(dueReminders.length)
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Overdue
                                </CardTitle>
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    {loading ? (
                                        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(overdueReminders.length)
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Due Today
                                </CardTitle>
                                <Calendar className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">
                                    {loading ? (
                                        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(dueTodayReminders.length)
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Upcoming
                                </CardTitle>
                                <Bell className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    {loading ? (
                                        <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(upcomingReminders.length)
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Due Reminders Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Due Reminders ({formatNumber(dueReminders.length)})
                        </CardTitle>
                        <CardDescription>
                            Reminders that are due for sending - take action to notify users
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                                ))}
                            </div>
                        ) : dueReminders.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-copay-navy mb-2">No reminders due</h3>
                                <p className="text-copay-gray">
                                    Great! All reminders are up to date. Check back later or create new reminders.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Urgency</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Notification Types</TableHead>
                                            <TableHead>Cooperative</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dueReminders
                                            .sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime())
                                            .map((reminder) => (
                                                <TableRow key={reminder.id} className="hover:bg-orange-50">
                                                    <TableCell>
                                                        {getUrgencyBadge(reminder.reminderDate)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <p className="font-medium text-copay-navy">{reminder.title}</p>
                                                            <p className="text-sm text-copay-gray line-clamp-1">{reminder.description}</p>
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
                                                        <div className="flex flex-wrap gap-1">
                                                            {reminder.notificationTypes.map((type) => (
                                                                <Badge key={type} variant="outline" className="text-xs">
                                                                    {type}
                                                                </Badge>
                                                            ))}
                                                        </div>
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

export default withAuth(DueRemindersPage);