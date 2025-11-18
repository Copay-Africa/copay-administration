'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import {
    MessageSquare,
    Search,
    Eye,
    Edit,
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    Download,
    Trash2,
    User,
    Calendar,
    Flag
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
    Complaint,
    ComplaintFilters,
    ComplaintStats,
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

export default function ComplaintsPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [stats, setStats] = useState<ComplaintStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<ComplaintFilters>({
        page: 1,
        limit: 10,
        search: '',
        status: undefined,
        priority: undefined,
    });
    const [selectedComplaints, setSelectedComplaints] = useState<string[]>([]);

    // Fetch complaints and statistics using documented endpoints only
    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        setError('');
        
        try {
            console.log('Fetching complaints with filters:', filters);
            console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL);
            
            // Use documented endpoints according to API documentation:
            // ✅ GET /complaints/organization - for organization complaints list
            // ✅ GET /complaints/organization/stats - for organization complaint statistics
            const [complaintsResponse, statsResponse] = await Promise.all([
                apiClient.complaints.getOrganizationComplaints(filters),
                apiClient.complaints.getOrganizationStats()
            ]);

            console.log('Complaints response:', complaintsResponse);
            console.log('Stats response:', statsResponse);

            // Handle paginated response format for complaints
            if (complaintsResponse && typeof complaintsResponse === 'object' && 'data' in complaintsResponse) {
                setComplaints(complaintsResponse.data as Complaint[]);
            } else if (Array.isArray(complaintsResponse)) {
                setComplaints(complaintsResponse as Complaint[]);
            } else {
                console.error('Unexpected complaints response format:', complaintsResponse);
                setComplaints([]);
            }

            // Handle stats response
            if (statsResponse && typeof statsResponse === 'object') {
                setStats(statsResponse as ComplaintStats);
            } else {
                console.error('Unexpected stats response format:', statsResponse);
                setStats(null);
            }
        } catch (err) {
            console.error('Failed to fetch complaints:', err);
            
            // Better error typing for network/API errors
            const error = err as Error & {
                name?: string;
                code?: string;
                response?: {
                    data?: unknown;
                    status?: number;
                    statusText?: string;
                };
            };
            
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            
            // Provide more specific error messages based on the error type
            let errorMessage = 'Failed to load complaints data';
            const isNetworkError = error.code === 'ERR_NETWORK' || 
                                  error.message?.includes('fetch') || 
                                  error.message?.includes('Failed to fetch') ||
                                  error.name === 'TypeError';
            
            if (error.response?.status === 401) {
                errorMessage = 'Authentication failed. Please log in again.';
            } else if (error.response?.status === 403) {
                errorMessage = 'Access denied. You may not have permission to view complaints.';
            } else if (error.response?.status === 404) {
                errorMessage = 'Complaints API endpoint not found. The server may not be configured correctly.';
            } else if (isNetworkError) {
                errorMessage = `Cannot connect to the API server (${process.env.NEXT_PUBLIC_API_URL}). Please check if the server is running.`;
                
                // In development, provide empty data as fallback
                if (process.env.NODE_ENV === 'development') {
                    console.warn('Using empty data due to API connection failure');
                    setComplaints([]);
                    setStats({
                        total: 0,
                        byStatus: [
                            { status: 'OPEN', count: 0 },
                            { status: 'IN_PROGRESS', count: 0 },
                            { status: 'RESOLVED', count: 0 },
                            { status: 'CLOSED', count: 0 }
                        ],
                        byPriority: [
                            { priority: 'LOW', count: 0 },
                            { priority: 'MEDIUM', count: 0 },
                            { priority: 'HIGH', count: 0 },
                            { priority: 'URGENT', count: 0 }
                        ],
                        recentComplaints: []
                    });
                    setError(''); // Clear error when using empty fallback data
                    return;
                }
            } else {
                errorMessage = error.message || 'Failed to load complaints data';
            }
            
            setError(errorMessage);
            
            // Set empty data on error to prevent UI breaking
            setComplaints([]);
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    const handleStatusUpdate = async (id: string, status: ComplaintStatus, resolution?: string) => {
        try {
            await apiClient.complaints.updateStatus(id, { status, resolution });
            fetchComplaints(); // Refresh the list
        } catch (err) {
            console.error('Failed to update complaint status:', err);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedComplaints.length === 0) return;

        try {
            // Note: Bulk delete would need API support - for now, delete individually
            for (const id of selectedComplaints) {
                // Assuming a delete method exists or we update status to CLOSED
                await apiClient.complaints.updateStatus(id, { status: 'CLOSED', resolution: 'Bulk closed by admin' });
            }
            setSelectedComplaints([]);
            fetchComplaints();
        } catch (err) {
            console.error('Failed to bulk delete complaints:', err);
        }
    };

    const handleSelectAll = () => {
        if (selectedComplaints.length === complaints.length) {
            setSelectedComplaints([]);
        } else {
            setSelectedComplaints(complaints.map(c => c.id));
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copay-navy mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading complaints...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
                            <p className="text-gray-600 mb-6 text-center max-w-md">
                                We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
                            </p>
                            <div className="bg-gray-50 p-4 rounded-lg mb-6 w-full max-w-md">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Error Details (Development Only)</h3>
                                <code className="text-xs text-red-600 break-all">{error}</code>
                            </div>
                            <div className="flex space-x-3">
                                <Button onClick={() => window.location.reload()}>
                                    Try Again
                                </Button>
                                <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                                    Go to Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-copay-navy flex items-center gap-2">
                            <MessageSquare className="w-8 h-8 text-copay-blue" />
                            Complaints Management
                        </h1>
                        <p className="text-copay-gray mt-1">Manage and resolve tenant issues and complaints</p>
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    {stats.byStatus?.find((s) => s.status === 'OPEN')?.count || 0}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                                <Clock className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {stats.byStatus?.find((s) => s.status === 'IN_PROGRESS')?.count || 0}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {stats.byStatus?.find((s) => s.status === 'RESOLVED')?.count || 0}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                            <div className="flex flex-1 space-x-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search complaints..."
                                        value={filters.search || ''}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                        className="pl-10"
                                    />
                                </div>

                                <Select value={filters.status || 'all'} onValueChange={(value) =>
                                    setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as ComplaintStatus, page: 1 }))
                                }>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="OPEN">Open</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                                        <SelectItem value="CLOSED">Closed</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filters.priority || 'all'} onValueChange={(value) =>
                                    setFilters(prev => ({ ...prev, priority: value === 'all' ? undefined : value as ComplaintPriority, page: 1 }))
                                }>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Priority</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="LOW">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedComplaints.length > 0 && (
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Close Selected ({selectedComplaints.length})
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
                                                checked={selectedComplaints.length === complaints.length && complaints.length > 0}
                                                onChange={handleSelectAll}
                                                className="rounded border-gray-300 text-copay-navy focus:ring-copay-navy"
                                            />
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Complaint</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Submitter</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Priority</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Created</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {complaints.map((complaint) => (
                                        <tr key={complaint.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedComplaints.includes(complaint.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedComplaints([...selectedComplaints, complaint.id]);
                                                        } else {
                                                            setSelectedComplaints(selectedComplaints.filter(id => id !== complaint.id));
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-copay-navy focus:ring-copay-navy"
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{complaint.title}</p>
                                                    <p className="text-sm text-gray-500 truncate max-w-xs">{complaint.description}</p>
                                                    {complaint.cooperative && (
                                                        <p className="text-xs text-gray-400 mt-1">{complaint.cooperative.name}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    <User className="w-4 h-4 mr-2 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {complaint.user?.firstName} {complaint.user?.lastName}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{complaint.user?.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">{getPriorityBadge(complaint.priority)}</td>
                                            <td className="py-3 px-4">{getStatusBadge(complaint.status)}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    {new Date(complaint.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex space-x-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={`/complaints/${complaint.id}`}>
                                                            <Eye className="w-4 h-4" />
                                                        </a>
                                                    </Button>

                                                    {complaint.status !== 'CLOSED' && (
                                                        <Select onValueChange={(status) =>
                                                            handleStatusUpdate(complaint.id, status as ComplaintStatus)
                                                        }>
                                                            <SelectTrigger asChild>
                                                                <Button variant="outline" size="sm">
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="OPEN">Mark as Open</SelectItem>
                                                                <SelectItem value="IN_PROGRESS">Mark as In Progress</SelectItem>
                                                                <SelectItem value="RESOLVED">Mark as Resolved</SelectItem>
                                                                <SelectItem value="CLOSED">Mark as Closed</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {complaints.length === 0 && (
                                <div className="text-center py-8">
                                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No complaints found</p>
                                    <p className="text-sm text-gray-400">Complaints will appear here once submitted by tenants</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}