'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    User,
    Calendar,
    Clock,
    MessageSquare,
    Flag,
    Building2,
    Phone,
    
    FileText,
    Save,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Edit2,
    Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import type {
    Complaint,
    ComplaintStatus,
    ComplaintPriority
} from '@/types';

// Status badge configuration
const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
        case 'OPEN':
            return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Open
            </Badge>;
        case 'IN_PROGRESS':
            return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <Clock className="w-3 h-3 mr-1" />
                In Progress
            </Badge>;
        case 'RESOLVED':
            return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Resolved
            </Badge>;
        case 'CLOSED':
            return <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-300">
                <XCircle className="w-3 h-3 mr-1" />
                Closed
            </Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

// Priority badge configuration
const getPriorityBadge = (priority: ComplaintPriority) => {
    switch (priority) {
        case 'URGENT':
            return <Badge variant="destructive" className="bg-red-600 text-white">
                <Flag className="w-3 h-3 mr-1" />
                Urgent
            </Badge>;
        case 'HIGH':
            return <Badge variant="destructive" className="bg-orange-500 text-white">
                <Flag className="w-3 h-3 mr-1" />
                High
            </Badge>;
        case 'MEDIUM':
            return <Badge variant="default" className="bg-blue-500 text-white">
                <Flag className="w-3 h-3 mr-1" />
                Medium
            </Badge>;
        case 'LOW':
            return <Badge variant="secondary" className="bg-gray-400 text-white">
                <Flag className="w-3 h-3 mr-1" />
                Low
            </Badge>;
        default:
            return <Badge variant="outline">{priority}</Badge>;
    }
};

export default function ComplaintDetailPage() {
    const params = useParams();
    const router = useRouter();
    const complaintId = params.id as string;

    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);

    // Edit mode states
    const [isEditing, setIsEditing] = useState(false);
    const [newStatus, setNewStatus] = useState<ComplaintStatus>('OPEN');
    const [resolution, setResolution] = useState('');

    // Fetch complaint details
    const fetchComplaint = useCallback(async () => {
        try {
            const response = await apiClient.complaints.getById(complaintId);
            const complaintData = response as Complaint;
            setComplaint(complaintData);
            setNewStatus(complaintData.status);
            setResolution(complaintData.resolution || '');
            setError('');
        } catch (err) {
            console.error('Failed to fetch complaint:', err);
            setError('Failed to load complaint details');
        } finally {
            setLoading(false);
        }
    }, [complaintId]);

    useEffect(() => {
        fetchComplaint();
    }, [fetchComplaint]);

    const handleStatusUpdate = async () => {
        if (!complaint) return;

        setUpdating(true);
        try {
            await apiClient.complaints.updateStatus(complaint.id, {
                status: newStatus,
                resolution: resolution.trim() || undefined
            });

            // Refresh complaint data
            await fetchComplaint();
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update complaint:', err);
            setError('Failed to update complaint status');
        } finally {
            setUpdating(false);
        }
    };

    const handleCancel = () => {
        if (complaint) {
            setNewStatus(complaint.status);
            setResolution(complaint.resolution || '');
        }
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copay-navy mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading complaint details...</p>
                </div>
            </div>
        );
    }

    if (error && !complaint) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Complaint</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => router.push('/complaints')} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Complaints
                    </Button>
                </div>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Complaint Not Found</h2>
                    <p className="text-gray-600 mb-4">The complaint you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
                    <Button onClick={() => router.push('/complaints')} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Complaints
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" onClick={() => router.push('/complaints')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Complaint Details</h1>
                        <p className="text-gray-600">Complaint ID: {complaint.id}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {!isEditing && complaint.status !== 'CLOSED' && (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Update Status
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Complaint Info */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{complaint.title}</CardTitle>
                                <div className="flex items-center space-x-2">
                                    {getPriorityBadge(complaint.priority)}
                                    {getStatusBadge(complaint.status)}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                <p className="text-gray-700 leading-relaxed">{complaint.description}</p>
                            </div>

                            {complaint.attachments && complaint.attachments.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                        <Paperclip className="w-4 h-4 mr-2" />
                                        Attachments ({complaint.attachments.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {complaint.attachments.map((attachment, index) => (
                                            <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <a
                                                    href={attachment.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    {attachment.filename}
                                                </a>
                                                <span className="text-xs text-gray-500">
                                                    ({Math.round(attachment.size / 1024)} KB)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {complaint.resolution && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Resolution</h4>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <p className="text-green-800">{complaint.resolution}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Status Update Section */}
                    {isEditing && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Update Complaint Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <Select value={newStatus} onValueChange={(value) => setNewStatus(value as ComplaintStatus)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="OPEN">Open</SelectItem>
                                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                                            <SelectItem value="CLOSED">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Resolution Notes
                                    </label>
                                    <Textarea
                                        value={resolution}
                                        onChange={(e) => setResolution(e.target.value)}
                                        placeholder="Add notes about the status update or resolution..."
                                        rows={4}
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}

                                <div className="flex space-x-3">
                                    <Button
                                        onClick={handleStatusUpdate}
                                        disabled={updating}
                                        className="bg-copay-navy hover:bg-copay-navy/90"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {updating ? 'Updating...' : 'Update Status'}
                                    </Button>
                                    <Button variant="outline" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Submitter Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <User className="w-5 h-5 mr-2" />
                                Submitter Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="font-medium text-gray-900">
                                    {complaint.user?.firstName} {complaint.user?.lastName}
                                </p>
                                {complaint.user?.phone && (
                                    <div className="flex items-center mt-1">
                                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                        <a
                                            href={`tel:${complaint.user.phone}`}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            {complaint.user.phone}
                                        </a>
                                    </div>
                                )}

                            </div>
                        </CardContent>
                    </Card>

                    {/* Cooperative Info */}
                    {complaint.cooperative && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                    <Building2 className="w-5 h-5 mr-2" />
                                    Cooperative
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div>
                                    <p className="font-medium text-gray-900">{complaint.cooperative.name}</p>
                                    <p className="text-sm text-gray-600">Code: {complaint.cooperative.code}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <Clock className="w-5 h-5 mr-2" />
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                <div>
                                    <p className="text-sm font-medium">Created</p>
                                    <div className="flex items-center text-xs text-gray-500">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(complaint.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {complaint.updatedAt !== complaint.createdAt && (
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                                    <div>
                                        <p className="text-sm font-medium">Last Updated</p>
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(complaint.updatedAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {complaint.resolvedAt && (
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                    <div>
                                        <p className="text-sm font-medium">Resolved</p>
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(complaint.resolvedAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}