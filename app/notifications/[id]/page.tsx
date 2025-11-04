/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Mail,
    MailOpen,
    CheckCircle,
    Clock,
    AlertTriangle,
    CreditCard,
    Building2,
    Calendar,
    Send,
    ExternalLink,
    Edit,
    Trash2,
    Check,
    Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api-client';
import type { Notification } from '@/types';

// Notification type configuration
const getNotificationTypeConfig = (type: string) => {
    switch (type) {
        case 'PAYMENT_DUE':
            return {
                icon: <CreditCard className="w-5 h-5" />,
                label: 'Payment Due',
                color: 'bg-blue-100 text-blue-800 border-blue-300',
                description: 'Payment deadline approaching'
            };
        case 'PAYMENT_OVERDUE':
            return {
                icon: <AlertTriangle className="w-5 h-5" />,
                label: 'Payment Overdue',
                color: 'bg-red-100 text-red-800 border-red-300',
                description: 'Payment is past due date'
            };
        case 'PAYMENT_RECEIVED':
            return {
                icon: <CheckCircle className="w-5 h-5" />,
                label: 'Payment Received',
                color: 'bg-green-100 text-green-800 border-green-300',
                description: 'Payment has been processed'
            };
        case 'ACCOUNT_UPDATE':
            return {
                icon: <Building2 className="w-5 h-5" />,
                label: 'Account Update',
                color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                description: 'Account information has been updated'
            };
        case 'SYSTEM_ALERT':
            return {
                icon: <AlertTriangle className="w-5 h-5" />,
                label: 'System Alert',
                color: 'bg-orange-100 text-orange-800 border-orange-300',
                description: 'Important system notification'
            };
        case 'ANNOUNCEMENT':
            return {
                icon: <Send className="w-5 h-5" />,
                label: 'Announcement',
                color: 'bg-purple-100 text-purple-800 border-purple-300',
                description: 'General system announcement'
            };
        default:
            return {
                icon: <Mail className="w-5 h-5" />,
                label: type,
                color: 'bg-gray-100 text-gray-800 border-gray-300',
                description: 'Notification'
            };
    }
};

export default function NotificationDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [notification, setNotification] = useState<Notification | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [markingAsRead, setMarkingAsRead] = useState(false);

    useEffect(() => {
        const fetchNotification = async () => {
            try {
                // Note: This would need to be implemented in the API client
                const response = await apiClient.notifications.getById(params.id);
                setNotification(response as any);
                setError('');
            } catch (err) {
                console.error('Failed to fetch notification:', err);
                setError('Failed to load notification details');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchNotification();
        }
    }, [params.id]);

    const handleMarkAsRead = async () => {
        if (!notification || notification.isRead) return;

        setMarkingAsRead(true);
        try {
            await apiClient.notifications.markAsRead(notification.id);
            setNotification(prev => prev ? { ...prev, isRead: true } : null);
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        } finally {
            setMarkingAsRead(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copay-navy mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading notification...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Notifications
                </Button>
                <div className="text-center py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Notification</h3>
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!notification) {
        return (
            <div className="space-y-4">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Notifications
                </Button>
                <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Notification Not Found</h3>
                    <p className="text-gray-500">The notification you're looking for doesn't exist or has been removed.</p>
                </div>
            </div>
        );
    }

    const typeConfig = getNotificationTypeConfig(notification.type);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Notification Details</h1>
                        <p className="text-gray-600">View and manage notification information</p>
                    </div>
                </div>

                <div className="flex space-x-3">
                    {!notification.isRead && (
                        <Button
                            onClick={handleMarkAsRead}
                            disabled={markingAsRead}
                            className="bg-copay-navy hover:bg-copay-navy/90"
                        >
                            {markingAsRead ? (
                                <Clock className="w-4 h-4 mr-2" />
                            ) : (
                                <Check className="w-4 h-4 mr-2" />
                            )}
                            {markingAsRead ? 'Marking...' : 'Mark as Read'}
                        </Button>
                    )}

                    <Button variant="outline">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>

                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Notification Overview */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className={`p-3 rounded-lg ${typeConfig.color} border`}>
                                        {typeConfig.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <Badge className={typeConfig.color}>
                                                {typeConfig.label}
                                            </Badge>
                                            {notification.isRead ? (
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                                    <MailOpen className="w-3 h-3 mr-1" />
                                                    Read
                                                </Badge>
                                            ) : (
                                                <Badge variant="default" className="bg-blue-100 text-blue-800">
                                                    <Mail className="w-3 h-3 mr-1" />
                                                    Unread
                                                </Badge>
                                            )}
                                        </div>
                                        <h2 className="text-xl font-semibold text-gray-900 mb-2">{notification.title}</h2>
                                        <p className="text-gray-600">{typeConfig.description}</p>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">Message</h3>
                                    <p className="text-gray-700 leading-relaxed">{notification.message}</p>
                                </div>

                                <Separator />

                                <div className="flex items-center text-sm text-gray-500">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>
                                        Created on {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>

                                {notification.isRead && notification.readAt && (
                                    <div className="flex items-center text-sm text-gray-500">
                                        <MailOpen className="w-4 h-4 mr-2" />
                                        <span>
                                            Read on {new Date(notification.readAt).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Related Information */}
                    {(notification.reminder || notification.payment) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Related Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {notification.reminder && (
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-start space-x-3">
                                                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-blue-900">Related Reminder</h4>
                                                    <p className="text-blue-700 mt-1">{notification.reminder.title}</p>
                                                    {(notification.reminder as any).description && (
                                                        <p className="text-blue-600 text-sm mt-1">{(notification.reminder as any).description}</p>
                                                    )}
                                                    <p className="text-blue-600 text-sm mt-2">
                                                        Due: {new Date(notification.reminder.dueDate).toLocaleDateString()}
                                                    </p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-3 text-blue-700 border-blue-300 hover:bg-blue-100"
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        View Reminder
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {notification.payment && (
                                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-start space-x-3">
                                                <CreditCard className="w-5 h-5 text-green-600 mt-0.5" />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-green-900">Related Payment</h4>
                                                    <div className="mt-2 space-y-1">
                                                        <p className="text-green-700">
                                                            <span className="font-medium">Amount:</span> RWF {notification.payment.amount.toLocaleString()}
                                                        </p>
                                                        <p className="text-green-700">
                                                            <span className="font-medium">Status:</span>
                                                            <Badge
                                                                variant={notification.payment.status === 'COMPLETED' ? 'default' : 'secondary'}
                                                                className="ml-2"
                                                            >
                                                                {notification.payment.status}
                                                            </Badge>
                                                        </p>
                                                        <p className="text-green-600 text-sm">
                                                            Payment Date: {new Date(notification.payment.paymentDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-3 text-green-700 border-green-300 hover:bg-green-100"
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                        View Payment
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {!notification.isRead && (
                                    <Button
                                        onClick={handleMarkAsRead}
                                        disabled={markingAsRead}
                                        className="w-full bg-copay-navy hover:bg-copay-navy/90"
                                    >
                                        {markingAsRead ? (
                                            <Clock className="w-4 h-4 mr-2" />
                                        ) : (
                                            <Check className="w-4 h-4 mr-2" />
                                        )}
                                        {markingAsRead ? 'Marking as Read...' : 'Mark as Read'}
                                    </Button>
                                )}

                                <Button variant="outline" className="w-full">
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share Notification
                                </Button>

                                <Button variant="outline" className="w-full">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Notification
                                </Button>

                                <Separator />

                                <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Notification
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notification Metadata */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">ID</label>
                                    <p className="text-sm text-gray-900 font-mono">{notification.id}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Type</label>
                                    <p className="text-sm text-gray-900">{notification.type}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500">Created</label>
                                    <p className="text-sm text-gray-900">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                {notification.isRead && notification.readAt && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Read At</label>
                                        <p className="text-sm text-gray-900">
                                            {new Date(notification.readAt).toLocaleString()}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-gray-500">User ID</label>
                                    <p className="text-sm text-gray-900 font-mono">{notification.userId}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>System Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Status</span>
                                    <Badge variant={notification.isRead ? 'secondary' : 'default'}>
                                        {notification.isRead ? 'Read' : 'Unread'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Priority</span>
                                    <Badge variant={notification.type.includes('OVERDUE') || notification.type === 'SYSTEM_ALERT' ? 'destructive' : 'outline'}>
                                        {notification.type.includes('OVERDUE') || notification.type === 'SYSTEM_ALERT' ? 'High' : 'Normal'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Channel</span>
                                    <span className="text-gray-900">In-App</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}