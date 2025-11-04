'use client';

import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    User,
    Phone,
    Home,
    Building2,
    Calendar,
    Clock,
    Check,
    X,
    FileText,
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api-client';
import type { AccountRequest } from '@/types';

/**
 * Account Request Detail Page
 * View and process individual account requests
 */

function AccountRequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [request, setRequest] = useState<AccountRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const requestId = params.id as string;

    useEffect(() => {
        const fetchRequest = async () => {
            if (!requestId) return;

            setLoading(true);
            setError('');

            try {
                console.log('Fetching account request with ID:', requestId);
                console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL);
                
                // Check authentication
                const token = document.cookie.split(';').find(c => c.trim().startsWith('copay_access_token='));
                console.log('Auth token exists:', !!token);
                if (token) {
                    console.log('Token length:', token.split('=')[1]?.length);
                }
                
                // Test direct API call
                const directUrl = `https://copay-six.vercel.app/api/v1/account-requests/${requestId}`;
                console.log('Direct API URL:', directUrl);
                
                try {
                    const directResponse = await fetch(directUrl, {
                        headers: {
                            'Authorization': `Bearer ${token?.split('=')[1]}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log('Direct fetch status:', directResponse.status);
                    console.log('Direct fetch ok:', directResponse.ok);
                    
                    if (directResponse.ok) {
                        const directData = await directResponse.json();
                        console.log('Direct fetch data:', directData);
                    }
                } catch (directErr) {
                    console.log('Direct fetch error:', directErr);
                }
                
                const response = await apiClient.accountRequests.getById(requestId);
                console.log('API Response received:', response);
                console.log('Response type:', typeof response);
                console.log('Response keys:', response ? Object.keys(response) : 'null');
                
                // The API client already unwraps the data, so response is the AccountRequest object
                if (response) {
                    setRequest(response as AccountRequest);
                    console.log('Account request set successfully');
                } else {
                    throw new Error('No data received from API');
                }
            } catch (err: unknown) {
                console.error('Failed to fetch request:', err);
                
                // More detailed error handling
                const error = err as any;
                console.log('Full error object:', error);
                console.log('Error response:', error.response);
                console.log('Error status:', error.response?.status);
                console.log('Error data:', error.response?.data);
                
                if (error.response?.status === 404) {
                    setError('Account request not found. It may have been deleted or you don\'t have permission to view it.');
                } else if (error.response?.status === 500) {
                    setError('Server error occurred while fetching the account request. Please try again later.');
                } else if (error.response?.status === 403) {
                    setError('You don\'t have permission to view this account request.');
                } else {
                    setError(`Failed to load account request: ${error.message || 'Unknown error'}`);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [requestId]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Clock className="h-4 w-4 mr-2" />
                    Pending Review
                </Badge>;
            case 'APPROVED':
                return <Badge variant="success" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approved
                </Badge>;
            case 'REJECTED':
                return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                    <X className="h-4 w-4 mr-2" />
                    Rejected
                </Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    const handleProcessRequest = async (action: 'APPROVE' | 'REJECT') => {
        if (!request) return;

        if (action === 'REJECT' && !rejectionReason.trim()) {
            alert('Please provide a rejection reason.');
            return;
        }

        setProcessing(true);

        try {
            await apiClient.accountRequests.process(request.id, {
                action,
                notes: notes.trim() || undefined,
                rejectionReason: action === 'REJECT' ? rejectionReason.trim() : undefined
            });

            // Update local state
            setRequest(prev => prev ? {
                ...prev,
                status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                notes: notes.trim() || prev.notes,
                rejectionReason: action === 'REJECT' ? rejectionReason.trim() : prev.rejectionReason,
                processedAt: new Date().toISOString()
            } : null);

            alert(`Account request ${action.toLowerCase()}d successfully!`);
        } catch (err) {
            console.error(`Failed to ${action.toLowerCase()} request:`, err);
            alert(`Failed to ${action.toLowerCase()} request. Please try again.`);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !request) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                            <h3 className="text-xl font-medium text-copay-navy mb-2">Failed to load request</h3>
                            <p className="text-copay-gray mb-6 text-center">
                                {error || 'Account request not found or you don\'t have permission to view it.'}
                            </p>
                            <div className="flex space-x-4">
                                <Button variant="outline" onClick={() => router.back()}>
                                    Go Back
                                </Button>
                                <Button onClick={() => window.location.reload()}>
                                    Try Again
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
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" asChild>
                        <Link href="/requests">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Requests
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-copay-navy">Account Request Details</h1>
                        <p className="text-copay-gray">
                            Review and process account request from {request.fullName}
                        </p>
                    </div>
                    <div>
                        {getStatusBadge(request.status)}
                    </div>
                </div>

                {/* Request Information */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Applicant Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Applicant Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <p className="text-lg font-medium text-copay-navy">{request.fullName}</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    Phone Number
                                </Label>
                                <p className="font-mono text-copay-navy">{request.phone}</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Home className="h-4 w-4" />
                                    Room Number
                                </Label>
                                <p className="text-lg font-medium text-copay-navy">{request.roomNumber}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cooperative Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Cooperative Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Cooperative Name</Label>
                                <p className="text-lg font-medium text-copay-navy">
                                    {request.cooperative?.name || 'Unknown Cooperative'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Cooperative Code</Label>
                                <p className="font-mono text-copay-gray">
                                    {request.cooperative?.code || 'N/A'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Cooperative ID</Label>
                                <p className="font-mono text-sm text-copay-gray">{request.cooperativeId}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Request Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Request Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Submitted Date</Label>
                                <p className="text-copay-navy">
                                    {new Date(request.createdAt).toLocaleString()}
                                </p>
                            </div>

                            {request.processedAt && (
                                <div className="space-y-2">
                                    <Label>Processed Date</Label>
                                    <p className="text-copay-navy">
                                        {new Date(request.processedAt).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            {request.processedBy && (
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Processed By</Label>
                                    <p className="text-copay-navy">
                                        {request.processedBy.firstName} {request.processedBy.lastName}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Notes and Actions */}
                {request.status === 'PENDING' ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Process Request
                            </CardTitle>
                            <CardDescription>
                                Review the request and take appropriate action
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Add any notes about this request..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                                <Textarea
                                    id="rejectionReason"
                                    placeholder="Required if rejecting the request..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                />
                                <p className="text-sm text-gray-500">
                                    This field is required when rejecting a request
                                </p>
                            </div>

                            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                                <Button
                                    variant="destructive"
                                    onClick={() => handleProcessRequest('REJECT')}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <X className="h-4 w-4 mr-2" />
                                    )}
                                    Reject Request
                                </Button>
                                <Button
                                    onClick={() => handleProcessRequest('APPROVE')}
                                    disabled={processing}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {processing ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4 mr-2" />
                                    )}
                                    Approve Request
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Processing Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {request.notes && (
                                <div className="space-y-2">
                                    <Label>Admin Notes</Label>
                                    <p className="text-copay-navy bg-blue-50 p-3 rounded-lg border">
                                        {request.notes}
                                    </p>
                                </div>
                            )}

                            {request.rejectionReason && (
                                <div className="space-y-2">
                                    <Label>Rejection Reason</Label>
                                    <p className="text-red-800 bg-red-50 p-3 rounded-lg border border-red-200">
                                        {request.rejectionReason}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}

export default withAuth(AccountRequestDetailPage);