'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Megaphone,
  ArrowLeft,
  Calendar,
  Users,
  Bell,
  Send,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Flag,
  AlertTriangle,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api-client';
import type { 
  Announcement, 
  AnnouncementStatus, 
  AnnouncementPriority,
  AnnouncementTargetType
} from '@/types';

/**
 * Announcement Detail Page
 * View and manage individual announcement details
 */

function AnnouncementDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const announcementId = params.id as string;

    useEffect(() => {
        const fetchAnnouncement = async () => {
            if (!announcementId) return;

            setLoading(true);
            setError('');

            try {
                console.log('Fetching announcement with ID:', announcementId);
                const response = await apiClient.announcements.getById(announcementId);
                console.log('Announcement response:', response);
                
                // The API client already unwraps the data, so response is the Announcement object
                if (response) {
                    setAnnouncement(response as Announcement);
                    console.log('Announcement set successfully');
                } else {
                    throw new Error('No data received from API');
                }
            } catch (err: unknown) {
                console.error('Failed to fetch announcement:', err);
                
                // More detailed error handling
                const error = err as { response?: { status?: number; data?: unknown } };
                console.log('Full error object:', error);
                console.log('Error response:', error.response);
                console.log('Error status:', error.response?.status);
                console.log('Error data:', error.response?.data);
                
                if (error.response?.status === 404) {
                    setError('Announcement not found. It may have been deleted or you don\'t have permission to view it.');
                } else if (error.response?.status === 500) {
                    setError('Server error occurred while fetching the announcement. Please try again later.');
                } else if (error.response?.status === 403) {
                    setError('You don\'t have permission to view this announcement.');
                } else {
                    setError('Failed to load announcement: Unknown error');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncement();
    }, [announcementId]);

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
                return <Badge variant="secondary">{status}</Badge>;
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
                return <Badge variant="secondary">{priority}</Badge>;
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
                return <Badge variant="secondary">{targetType}</Badge>;
        }
    };

    const handleSendAnnouncement = async () => {
        if (!announcement) return;
        
        if (confirm('Are you sure you want to send this announcement now?')) {
            setProcessing(true);
            try {
                await apiClient.announcements.send(announcement.id);
                
                // Refresh the announcement data
                const response = await apiClient.announcements.getById(announcement.id);
                setAnnouncement(response as Announcement);
            } catch (err) {
                console.error('Failed to send announcement:', err);
                alert('Failed to send announcement. Please try again.');
            } finally {
                setProcessing(false);
            }
        }
    };

    const handleDeleteAnnouncement = async () => {
        if (!announcement) return;
        
        if (confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
            setProcessing(true);
            try {
                await apiClient.announcements.remove(announcement.id);
                router.push('/announcements');
            } catch (err) {
                console.error('Failed to delete announcement:', err);
                alert('Failed to delete announcement. Please try again.');
                setProcessing(false);
            }
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copay-navy mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading announcement...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
                            <h3 className="text-lg font-medium text-copay-navy mb-2">Error Loading Announcement</h3>
                            <p className="text-copay-gray mb-4 text-center">{error}</p>
                            <div className="flex space-x-2">
                                <Button onClick={() => window.location.reload()}>Try Again</Button>
                                <Button variant="outline" asChild>
                                    <Link href="/announcements">Back to Announcements</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    if (!announcement) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-copay-navy mb-2">Announcement Not Found</h3>
                            <p className="text-copay-gray mb-4">The requested announcement could not be found.</p>
                            <Button asChild>
                                <Link href="/announcements">Back to Announcements</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/announcements">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Announcements
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-copay-navy">Announcement Details</h1>
                            <p className="text-copay-gray">View and manage announcement information</p>
                        </div>
                    </div>
                    
                    <div className="flex space-x-2">
                        {announcement.status === 'DRAFT' && (
                            <Button variant="outline" asChild>
                                <Link href={`/announcements/${announcement.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                        
                        {(announcement.status === 'DRAFT' || announcement.status === 'SCHEDULED') && (
                            <Button onClick={handleSendAnnouncement} disabled={processing}>
                                {processing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Send Now
                                    </>
                                )}
                            </Button>
                        )}
                        
                        {(announcement.status === 'DRAFT' || announcement.status === 'CANCELLED') && (
                            <Button variant="outline" onClick={handleDeleteAnnouncement} disabled={processing}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                {/* Announcement Details */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <CardTitle className="text-xl">{announcement.title}</CardTitle>
                                        <div className="flex items-center space-x-2">
                                            {getStatusBadge(announcement.status)}
                                            {getPriorityBadge(announcement.priority)}
                                            {getTargetTypeBadge(announcement.targetType)}
                                        </div>
                                    </div>
                                    <Megaphone className="h-6 w-6 text-copay-blue" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-copay-navy mb-2">Message</h4>
                                        <p className="text-copay-gray whitespace-pre-wrap">{announcement.message}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Delivery Statistics */}
                        {announcement.deliveryStats && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bell className="h-5 w-5" />
                                        Delivery Statistics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {Object.entries(announcement.deliveryStats).map(([type, stats]) => (
                                            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{type.replace('_', ' ')}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {stats.delivered}/{stats.sent} delivered ({stats.failed} failed)
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium">
                                                        {stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0}%
                                                    </p>
                                                    <p className="text-xs text-gray-500">Success Rate</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Metadata */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-copay-gray">Created By</p>
                                    <div className="mt-1">
                                        <p className="font-medium">{announcement.createdBy.name}</p>
                                        <p className="text-sm text-copay-gray">{announcement.createdBy.role}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm font-medium text-copay-gray">Created At</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-copay-gray" />
                                        <p className="text-sm">{new Date(announcement.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                {announcement.scheduledFor && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-sm font-medium text-copay-gray">Scheduled For</p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-blue-500" />
                                                <p className="text-sm">{new Date(announcement.scheduledFor).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {announcement.sentAt && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-sm font-medium text-copay-gray">Sent At</p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <p className="text-sm">{new Date(announcement.sentAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {announcement.expiresAt && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-sm font-medium text-copay-gray">Expires At</p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <XCircle className="h-4 w-4 text-red-500" />
                                                <p className="text-sm">{new Date(announcement.expiresAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recipients */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Recipients
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-copay-gray">Target Type</p>
                                    <div className="mt-1">
                                        {getTargetTypeBadge(announcement.targetType)}
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid gap-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-copay-gray">Estimated</span>
                                        <span className="font-medium">{announcement.estimatedRecipientsCount || 0}</span>
                                    </div>
                                    {announcement.actualRecipientsCount !== undefined && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-copay-gray">Actual</span>
                                            <span className="font-medium">{announcement.actualRecipientsCount}</span>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div>
                                    <p className="text-sm font-medium text-copay-gray">Notification Types</p>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {announcement.notificationTypes.map((type) => (
                                            <Badge key={type} variant="outline" className="text-xs">
                                                {type.replace('_', ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default withAuth(AnnouncementDetailPage);