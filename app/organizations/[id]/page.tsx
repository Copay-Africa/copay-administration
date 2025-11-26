'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Building2,
    Users,
    DollarSign,
    Calendar,
    Phone,
    Mail,
    MapPin,
    Settings,
    Edit,
    MoreHorizontal,
    UserPlus,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { Organization } from '@/types';

interface ApiError {
    message?: string;
    response?: {
        status?: number;
        statusText?: string;
        data?: unknown;
    };
}

/**
 * Individual Organization Details Page
 * Displays comprehensive information about a specific organization/cooperative
 */

function OrganizationDetailsPage() {
    const params = useParams();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const organizationId = params?.id as string;

    useEffect(() => {
        const fetchOrganization = async () => {
            if (!organizationId) {
                setError('No organization ID provided');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(''); // Clear any previous errors
            try {
                console.log('Fetching organization with ID:', organizationId);
                
                let organizationData: Organization | null = null;
                
                try {
                    const response = await apiClient.organizations.getById(organizationId);
                    
                    // Handle the response - API returns organization object directly
                    if (response && typeof response === 'object') {
                        const org = response as Organization;
                        
                        // The API returns the organization object directly
                        if (org.id && org.name) {
                            organizationData = org;
                            console.log('Successfully loaded organization:', org.name);
                        } else {
                            console.warn('Response does not have expected organization structure');
                        }
                    } else {
                        console.warn('Response is not an object or is null/undefined');
                    }
                } catch (apiError) {
                    console.error('API call failed:', apiError);
                    throw apiError; // Re-throw to be handled by outer catch block
                }
                
                if (organizationData && organizationData.id) {
                    setOrganization(organizationData);
                } else {
                    setError('Organization data not available');
                }
            } catch (error) {
                console.error('Failed to fetch organization:', error);
                
                // More detailed error logging
                if (error && typeof error === 'object') {
                    const apiError = error as ApiError;
                    console.error('Error details:', {
                        message: apiError.message,
                        status: apiError.response?.status,
                        statusText: apiError.response?.statusText,
                        data: apiError.response?.data
                    });
                }
                
                let errorMessage = 'Failed to load organization details';
                if (error && typeof error === 'object') {
                    const axiosError = error as ApiError;
                    if (axiosError.response?.status === 401) {
                        errorMessage = 'Authentication required. Please log in again.';
                    } else if (axiosError.response?.status === 404) {
                        errorMessage = `Organization not found (ID: ${organizationId}).`;
                    } else if (axiosError.response?.status === 403) {
                        errorMessage = 'You do not have permission to view this organization.';
                    } else if (axiosError.response?.status === 500) {
                        errorMessage = 'Server error. Please try again later.';
                    } else if (axiosError.message) {
                        errorMessage = `${axiosError.message} (Status: ${axiosError.response?.status || 'Unknown'})`;
                    }
                }
                
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchOrganization();
    }, [organizationId]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge variant="success">Active</Badge>;
            case 'SUSPENDED':
                return <Badge variant="warning">Suspended</Badge>;
            case 'PENDING_APPROVAL':
                return <Badge variant="secondary">Pending</Badge>;
            case 'REJECTED':
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-copay-navy" />
                        <p className="text-copay-gray">Loading organization details...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !organization) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" asChild>
                            <Link href="/organizations">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Organizations
                            </Link>
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Building2 className="h-12 w-12 text-copay-gray mb-4" />
                            <h3 className="text-lg font-medium text-copay-navy mb-2">
                                Organization Not Found
                            </h3>
                            <p className="text-copay-gray mb-4">
                                {error || 'The organization you are looking for does not exist or has been removed.'}
                            </p>
                            <div className="text-xs text-gray-400 mb-4 max-w-md">
                                Debug: Error=&quot;{error}&quot;, HasOrg={!!organization}, OrgID=&quot;{organizationId}&quot;
                            </div>
                            <Button asChild>
                                <Link href="/organizations">Return to Organizations</Link>
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
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-2xl font-bold text-copay-navy">{organization.name}</h1>
                                {getStatusBadge(organization.status)}
                            </div>
                            <p className="text-copay-gray">
                                Organization Code: {organization.code}
                            </p>
                        </div>
                    </div>
                    <div className="flex space-x-2 mt-4 sm:mt-0">
                        <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-copay-gray">
                                Total Members
                            </CardTitle>
                            <Users className="h-4 w-4 text-copay-gray" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-copay-navy">
                                {formatNumber(organization.memberCount || 0)}
                            </div>
                            <p className="text-xs text-copay-gray">
                                Active members
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-copay-gray">
                                Monthly Active Users
                            </CardTitle>
                            <Users className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-copay-navy">
                                {formatNumber(organization.monthlyActiveUsers || 0)}
                            </div>
                            <p className="text-xs text-copay-gray">
                                Last 30 days
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-copay-gray">
                                Total Revenue
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-copay-gray" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-copay-navy">
                                {formatCurrency(organization.totalRevenue || 0)}
                            </div>
                            <p className="text-xs text-copay-gray">
                                All time
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-copay-gray">
                                Member Since
                            </CardTitle>
                            <Calendar className="h-4 w-4 text-copay-gray" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-copay-navy">
                                {new Date(organization.createdAt).toLocaleDateString()}
                            </div>
                            <p className="text-xs text-copay-gray">
                                Registration date
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Organization Details */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Building2 className="h-5 w-5" />
                                <span>Organization Information</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-copay-gray">Description</label>
                                <p className="text-copay-navy">{organization.description || 'No description provided'}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-copay-gray">Address</label>
                                <div className="flex items-start space-x-2">
                                    <MapPin className="h-4 w-4 text-copay-gray mt-0.5" />
                                    <p className="text-copay-navy">{organization.address}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-copay-gray">Phone</label>
                                <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-copay-gray" />
                                    <p className="text-copay-navy">{organization.phone}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-copay-gray">Email</label>
                                <div className="flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-copay-gray" />
                                    <p className="text-copay-navy">{organization.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Settings className="h-5 w-5" />
                                <span>Organization Settings</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-copay-gray">Currency</label>
                                <p className="text-copay-navy">{organization.settings.currency}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-copay-gray">Timezone</label>
                                <p className="text-copay-navy">{organization.settings.timezone}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-copay-gray">Payment Due Day</label>
                                <p className="text-copay-navy">Day {organization.settings.paymentDueDay} of each month</p>
                            </div>

                            {organization.onboardingStatus && (
                                <div>
                                    <label className="text-sm font-medium text-copay-gray">Onboarding Status</label>
                                    <p className="text-copay-navy">
                                        {organization.onboardingStatus.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Organization Admins */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center space-x-2">
                                <Users className="h-5 w-5" />
                                <span>Organization Administrators</span>
                            </CardTitle>
                            <Button>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Admin
                            </Button>
                        </div>
                        <CardDescription>
                            Manage administrator accounts for this organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-copay-gray mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-copay-navy mb-2">
                                No administrators found
                            </h3>
                            <p className="text-copay-gray mb-4">
                                This organization doesn&apos;t have any administrator accounts yet.
                            </p>
                            <Button>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add First Administrator
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest activities and updates for this organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <Calendar className="h-12 w-12 text-copay-gray mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-copay-navy mb-2">
                                No recent activity
                            </h3>
                            <p className="text-copay-gray">
                                Activity logs will appear here as the organization becomes active.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default withAuth(OrganizationDetailsPage);