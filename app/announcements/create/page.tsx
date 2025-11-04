'use client';

import { useState, useEffect } from 'react';
import {
    Megaphone,
    ArrowLeft,
    Save,
    Send,
    Calendar,
    Users,
    Bell,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api-client';
import type {
    CreateAnnouncementData,
    Organization,
    User,
    AnnouncementPriority,
    AnnouncementTargetType,
    NotificationType
} from '@/types';

/**
 * Create Announcement Page
 * Form for creating system-wide announcements
 */

interface AnnouncementFormData extends CreateAnnouncementData {
    targetCooperativeIds: string[];
    targetUserIds: string[];
    notificationTypes: NotificationType[];
}

function CreateAnnouncementPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<AnnouncementFormData>({
        title: '',
        message: '',
        targetType: 'ALL_TENANTS',
        targetCooperativeIds: [],
        targetUserIds: [],
        notificationTypes: ['IN_APP'],
        priority: 'MEDIUM',
        scheduledFor: '',
        expiresAt: '',
    });

    const [cooperatives, setCooperatives] = useState<Organization[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchFormData();
    }, []);

    const fetchFormData = async () => {
        setLoading(true);
        try {
            const [cooperativesResponse, usersResponse] = await Promise.all([
                apiClient.organizations.getAll({ limit: 100 }),
                apiClient.users.getAll({ limit: 100 })
            ]);

            setCooperatives((cooperativesResponse.data || cooperativesResponse) as Organization[]);
            setUsers((usersResponse.data || usersResponse) as User[]);
        } catch (err) {
            console.error('Failed to fetch form data:', err);
            setError('Failed to load form data. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof AnnouncementFormData, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleNotificationTypeChange = (type: NotificationType, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            notificationTypes: checked
                ? [...prev.notificationTypes, type]
                : prev.notificationTypes.filter(t => t !== type)
        }));
    };

    const handleCooperativeSelection = (cooperativeId: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            targetCooperativeIds: checked
                ? [...prev.targetCooperativeIds, cooperativeId]
                : prev.targetCooperativeIds.filter(id => id !== cooperativeId)
        }));
    };

    const handleUserSelection = (userId: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            targetUserIds: checked
                ? [...prev.targetUserIds, userId]
                : prev.targetUserIds.filter(id => id !== userId)
        }));
    };

    const validateForm = (): boolean => {
        if (!formData.title.trim()) {
            setError('Title is required');
            return false;
        }
        if (!formData.message.trim()) {
            setError('Message is required');
            return false;
        }
        if (formData.targetType === 'SPECIFIC_COOPERATIVE' && formData.targetCooperativeIds.length === 0) {
            setError('Please select at least one cooperative');
            return false;
        }
        if (formData.targetType === 'SPECIFIC_USERS' && formData.targetUserIds.length === 0) {
            setError('Please select at least one user');
            return false;
        }
        if (formData.notificationTypes.length === 0) {
            setError('At least one notification type must be selected');
            return false;
        }
        if (formData.scheduledFor && new Date(formData.scheduledFor) <= new Date()) {
            setError('Scheduled time must be in the future');
            return false;
        }
        if (formData.expiresAt && new Date(formData.expiresAt) <= new Date()) {
            setError('Expiration time must be in the future');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent, sendImmediately = false) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSubmitting(true);
        setError('');

        try {
            const announcementData: CreateAnnouncementData = {
                title: formData.title.trim(),
                message: formData.message.trim(),
                targetType: formData.targetType,
                targetCooperativeIds: formData.targetCooperativeIds.length > 0 ? formData.targetCooperativeIds : undefined,
                targetUserIds: formData.targetUserIds.length > 0 ? formData.targetUserIds : undefined,
                notificationTypes: formData.notificationTypes,
                priority: formData.priority,
                scheduledFor: formData.scheduledFor || undefined,
                expiresAt: formData.expiresAt || undefined,
            };

            const response = await apiClient.announcements.create(announcementData);

            // If sending immediately, call the send endpoint
            if (sendImmediately && response && typeof response === 'object' && 'id' in response) {
                await apiClient.announcements.send((response as { id: string }).id);
                setSuccess('Announcement created and sent successfully!');
            } else {
                setSuccess('Announcement created successfully!');
            }

            // Redirect after success
            setTimeout(() => {
                router.push('/announcements');
            }, 2000);

        } catch (err) {
            console.error('Failed to create announcement:', err);
            const errorMessage = (err as Error)?.message || 'Failed to create announcement. Please try again.';
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const getEstimatedRecipients = () => {
        switch (formData.targetType) {
            case 'ALL_TENANTS':
                return 'All system tenants';
            case 'ALL_ORGANIZATION_ADMINS':
                return 'All organization administrators';
            case 'SPECIFIC_COOPERATIVE':
                return `${formData.targetCooperativeIds.length} selected cooperative(s)`;
            case 'SPECIFIC_USERS':
                return `${formData.targetUserIds.length} selected user(s)`;
            default:
                return 'Unknown';
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/announcements">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Announcements
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-copay-navy flex items-center gap-2">
                                <Megaphone className="h-6 w-6" />
                                Create Announcement
                            </h1>
                            <p className="text-copay-gray">
                                Create system-wide announcements for tenants and administrators
                            </p>
                        </div>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <Card className="border-green-200 bg-green-50">
                        <CardContent className="flex items-center space-x-2 py-4">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-green-700">{success}</span>
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="flex items-center space-x-2 py-4">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="text-red-700">{error}</span>
                        </CardContent>
                    </Card>
                )}

                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>
                                Set up the basic details for your announcement
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Announcement Title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="e.g., System Maintenance Notice"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority *</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(value) => handleInputChange('priority', value as AnnouncementPriority)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOW">Low Priority</SelectItem>
                                            <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                                            <SelectItem value="HIGH">High Priority</SelectItem>
                                            <SelectItem value="URGENT">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message *</Label>
                                <Textarea
                                    id="message"
                                    value={formData.message}
                                    onChange={(e) => handleInputChange('message', e.target.value)}
                                    placeholder="Write your announcement message here..."
                                    rows={5}
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Target Audience */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Target Audience
                            </CardTitle>
                            <CardDescription>
                                Choose who should receive this announcement
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="targetType">Target Audience *</Label>
                                <Select
                                    value={formData.targetType}
                                    onValueChange={(value) => handleInputChange('targetType', value as AnnouncementTargetType)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL_TENANTS">All Tenants</SelectItem>
                                        <SelectItem value="ALL_ORGANIZATION_ADMINS">All Organization Admins</SelectItem>
                                        <SelectItem value="SPECIFIC_COOPERATIVE">Specific Cooperatives</SelectItem>
                                        <SelectItem value="SPECIFIC_USERS">Specific Users</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Specific Cooperative Selection */}
                            {formData.targetType === 'SPECIFIC_COOPERATIVE' && (
                                <div className="space-y-2">
                                    <Label>Select Cooperatives ({formData.targetCooperativeIds.length} selected)</Label>
                                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                                        {loading ? (
                                            <p className="text-sm text-gray-500">Loading cooperatives...</p>
                                        ) : cooperatives.length === 0 ? (
                                            <p className="text-sm text-gray-500">No cooperatives available</p>
                                        ) : (
                                            cooperatives.map((coop) => (
                                                <div key={coop.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`coop-${coop.id}`}
                                                        checked={formData.targetCooperativeIds.includes(coop.id)}
                                                        onChange={(e) => handleCooperativeSelection(coop.id, e.target.checked)}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <Label htmlFor={`coop-${coop.id}`} className="text-sm">
                                                        {coop.name} ({coop.code})
                                                    </Label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Specific User Selection */}
                            {formData.targetType === 'SPECIFIC_USERS' && (
                                <div className="space-y-2">
                                    <Label>Select Users ({formData.targetUserIds.length} selected)</Label>
                                    <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                                        {loading ? (
                                            <p className="text-sm text-gray-500">Loading users...</p>
                                        ) : users.length === 0 ? (
                                            <p className="text-sm text-gray-500">No users available</p>
                                        ) : (
                                            users.map((user) => (
                                                <div key={user.id} className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`user-${user.id}`}
                                                        checked={formData.targetUserIds.includes(user.id)}
                                                        onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <Label htmlFor={`user-${user.id}`} className="text-sm">
                                                        {user.firstName} {user.lastName} ({user.phone})
                                                    </Label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm text-blue-700">
                                    <strong>Estimated Recipients:</strong> {getEstimatedRecipients()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Delivery Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Delivery Settings
                            </CardTitle>
                            <CardDescription>
                                Configure how and when the announcement will be delivered
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Notification Types *</Label>
                                <div className="grid gap-2 md:grid-cols-4 mt-2">
                                    {(['SMS', 'EMAIL', 'IN_APP', 'PUSH'] as NotificationType[]).map((type) => (
                                        <div key={type} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`notification-${type}`}
                                                checked={formData.notificationTypes.includes(type)}
                                                onChange={(e) => handleNotificationTypeChange(type, e.target.checked)}
                                                className="rounded border-gray-300"
                                            />
                                            <Label htmlFor={`notification-${type}`} className="text-sm">
                                                {type.replace('_', ' ')}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="scheduledFor">Schedule For (Optional)</Label>
                                    <Input
                                        id="scheduledFor"
                                        type="datetime-local"
                                        value={formData.scheduledFor}
                                        onChange={(e) => handleInputChange('scheduledFor', e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                    <p className="text-xs text-gray-500">Leave empty to send immediately</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                                    <Input
                                        id="expiresAt"
                                        type="datetime-local"
                                        value={formData.expiresAt}
                                        onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                    />
                                    <p className="text-xs text-gray-500">When should this announcement expire</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/announcements">Cancel</Link>
                        </Button>
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={submitting || loading}
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-copay-navy mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save as Draft
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            onClick={(e) => handleSubmit(e as any, true)}
                            disabled={submitting || loading}
                            className="min-w-32"
                        >
                            {submitting ? (
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
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}

export default withAuth(CreateAnnouncementPage);