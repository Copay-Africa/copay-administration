'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import {
    Mail,
    Search,
    Eye,
    MailOpen,
    CheckCircle,
    Clock,
    AlertTriangle,
    CreditCard,
    Building2,
    Calendar,
    Check,
    Download,
    RefreshCw,
    Send
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
import { apiClient } from '@/lib/api-client';
import type {
    Notification,
    NotificationFilters,
    PaginatedResponse
} from '@/types';

// Notification type badge configuration
const getTypeBadge = (type: string) => {
    switch (type) {
        case 'PAYMENT_DUE':
            return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">
                <CreditCard className="w-3 h-3 mr-1" />
                Payment Due
            </Badge>;
        case 'PAYMENT_OVERDUE':
            return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Payment Overdue
            </Badge>;
        case 'PAYMENT_RECEIVED':
            return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Payment Received
            </Badge>;
        case 'ACCOUNT_UPDATE':
            return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <Building2 className="w-3 h-3 mr-1" />
                Account Update
            </Badge>;
        case 'SYSTEM_ALERT':
            return <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-300">
                <AlertTriangle className="w-3 h-3 mr-1" />
                System Alert
            </Badge>;
        case 'ANNOUNCEMENT':
            return <Badge variant="default" className="bg-purple-100 text-purple-800 border-purple-300">
                <Send className="w-3 h-3 mr-1" />
                Announcement
            </Badge>;
        default:
            return <Badge variant="outline">{type}</Badge>;
    }
};

// Notification status badge
const getStatusBadge = (notification: Notification) => {
    if (notification.isRead) {
        return <Badge variant="secondary" className="bg-gray-100 text-gray-600">
            <MailOpen className="w-3 h-3 mr-1" />
            Read
        </Badge>;
    } else {
        return <Badge variant="default" className="bg-blue-100 text-blue-800">
            <Mail className="w-3 h-3 mr-1" />
            Unread
        </Badge>;
    }
};

interface NotificationStats {
    total: number;
    unread: number;
    byType: Record<string, number>;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [stats, setStats] = useState<NotificationStats>({
        total: 0,
        unread: 0,
        byType: {}
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<NotificationFilters>({
        page: 1,
        limit: 10,
        search: '',
        read: undefined,
        type: undefined,
    });
    const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
    const [markingAsRead, setMarkingAsRead] = useState<string[]>([]);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const response = await apiClient.notifications.getAll(filters) as PaginatedResponse<Notification>;

            setNotifications(response.data || []);

            // Calculate stats
            const allNotifications = response.data || [];
            const unreadCount = allNotifications.filter(n => !n.isRead).length;
            const typeStats: Record<string, number> = {};

            allNotifications.forEach(n => {
                typeStats[n.type] = (typeStats[n.type] || 0) + 1;
            });

            setStats({
                total: allNotifications.length,
                unread: unreadCount,
                byType: typeStats
            });

            setError('');
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
            setError('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id: string) => {
        setMarkingAsRead(prev => [...prev, id]);
        try {
            await apiClient.notifications.markAsRead(id);
            fetchNotifications(); // Refresh the list
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        } finally {
            setMarkingAsRead(prev => prev.filter(nId => nId !== id));
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await apiClient.notifications.markAllAsRead();
            fetchNotifications(); // Refresh the list
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
        }
    };

    const handleBulkMarkAsRead = async () => {
        if (selectedNotifications.length === 0) return;

        try {
            // Mark selected notifications as read individually
            for (const id of selectedNotifications) {
                await apiClient.notifications.markAsRead(id);
            }
            setSelectedNotifications([]);
            fetchNotifications();
        } catch (err) {
            console.error('Failed to bulk mark notifications as read:', err);
        }
    };

    const handleSelectAll = () => {
        if (selectedNotifications.length === notifications.length) {
            setSelectedNotifications([]);
        } else {
            setSelectedNotifications(notifications.map(n => n.id));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copay-navy mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading notifications...</p>
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
                            <Mail className="w-8 h-8 text-copay-blue" />
                            Notifications Center
                        </h1>
                        <p className="text-copay-gray mt-1">Manage and track all system notifications</p>
                    </div>
                <div className="flex space-x-3">
                    <Button variant="outline" size="sm" onClick={fetchNotifications}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    {stats.unread > 0 && (
                        <Button size="sm" onClick={handleMarkAllAsRead} className="bg-copay-navy hover:bg-copay-navy/90">
                            <Check className="w-4 h-4 mr-2" />
                            Mark All as Read
                        </Button>
                    )}
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unread</CardTitle>
                        <Mail className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payment Alerts</CardTitle>
                        <CreditCard className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {(stats.byType['PAYMENT_DUE'] || 0) + (stats.byType['PAYMENT_OVERDUE'] || 0)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {stats.byType['SYSTEM_ALERT'] || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div className="flex flex-1 space-x-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search notifications..."
                                    value={filters.search || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={filters.read !== undefined ? filters.read.toString() : 'all'} onValueChange={(value) =>
                                setFilters(prev => ({ ...prev, read: value === 'all' ? undefined : value === 'true', page: 1 }))
                            }>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="false">Unread</SelectItem>
                                    <SelectItem value="true">Read</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filters.type || 'all'} onValueChange={(value) =>
                                setFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value, page: 1 }))
                            }>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="PAYMENT_DUE">Payment Due</SelectItem>
                                    <SelectItem value="PAYMENT_OVERDUE">Payment Overdue</SelectItem>
                                    <SelectItem value="PAYMENT_RECEIVED">Payment Received</SelectItem>
                                    <SelectItem value="ACCOUNT_UPDATE">Account Update</SelectItem>
                                    <SelectItem value="SYSTEM_ALERT">System Alert</SelectItem>
                                    <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedNotifications.length > 0 && (
                            <div className="flex space-x-2">
                                <Button variant="outline" size="sm" onClick={handleBulkMarkAsRead}>
                                    <Check className="w-4 h-4 mr-2" />
                                    Mark Read ({selectedNotifications.length})
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300 text-copay-navy focus:ring-copay-navy"
                                        />
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Notification</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notifications.map((notification) => (
                                    <tr key={notification.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50/30' : ''}`}>
                                        <td className="py-3 px-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedNotifications.includes(notification.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedNotifications([...selectedNotifications, notification.id]);
                                                    } else {
                                                        setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-copay-navy focus:ring-copay-navy"
                                            />
                                        </td>
                                        <td className="py-3 px-4">{getStatusBadge(notification)}</td>
                                        <td className="py-3 px-4">
                                            <div>
                                                <p className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate max-w-md">{notification.message}</p>
                                                {notification.payment && (
                                                    <p className="text-xs text-green-600 mt-1">
                                                        Payment: RWF {notification.payment.amount.toLocaleString()} ({notification.payment.status})
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">{getTypeBadge(notification.type)}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                <div>
                                                    <p>{new Date(notification.createdAt).toLocaleDateString()}</p>
                                                    <p className="text-xs">{new Date(notification.createdAt).toLocaleTimeString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex space-x-2">
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        disabled={markingAsRead.includes(notification.id)}
                                                    >
                                                        {markingAsRead.includes(notification.id) ? (
                                                            <Clock className="w-4 h-4" />
                                                        ) : (
                                                            <MailOpen className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                )}

                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {notifications.length === 0 && (
                            <div className="text-center py-8">
                                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No notifications found</p>
                                <p className="text-sm text-gray-400">Notifications will appear here when generated by the system</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            </div>
        </DashboardLayout>
    );
}