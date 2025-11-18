'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    Filter,
    Download,
    Users,
    UserPlus,
    TrendingUp,
    Calendar,
    Eye,
    Edit,
    Trash2,
    AlertCircle,
    Building2,
    Phone,
    Mail
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { CreateTenantDialog } from '@/components/tenants/create-tenant-dialog';
import { withAuth } from '@/context/auth-context';
import { formatNumber } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { Tenant, TenantFilters, TenantStats } from '@/types';

/**
 * Tenants Management Page
 * Manage tenants across all cooperatives 
 */

function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [stats, setStats] = useState<TenantStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<TenantFilters>({
        page: 1,
        limit: 20,
        search: '',
        status: undefined,
    });

    // Function to refresh tenants and stats
    const fetchTenantsAndStats = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch tenants and stats in parallel
            const [tenantsResponse, statsResponse] = await Promise.all([
                apiClient.tenants.getAll(filters),
                apiClient.tenants.getStats()
            ]);

            // Handle response format - could be array directly or wrapped in data property
            const tenantData = Array.isArray(tenantsResponse)
                ? tenantsResponse
                : (tenantsResponse.data || tenantsResponse);

            setTenants(tenantData as Tenant[]);
            setStats(statsResponse as TenantStats);
        } catch (err) {
            console.error('Failed to fetch tenants:', err);
            const errorMessage = (err as Error)?.message || 'Failed to load tenants. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchTenantsAndStats();
    }, [filters, fetchTenantsAndStats]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge variant="success">Active</Badge>;
            case 'INACTIVE':
                return <Badge variant="secondary">Inactive</Badge>;
            case 'SUSPENDED':
                return <Badge variant="destructive">Suspended</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleDeleteTenant = async (tenantId: string) => {
        if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
            return;
        }

        try {
            await apiClient.tenants.remove(tenantId);
            // Refresh the tenants list
            setTenants(prev => prev.filter(tenant => tenant.id !== tenantId));
            // Show success message
            alert('Tenant deleted successfully');
        } catch (err) {
            console.error('Failed to delete tenant:', err);
            alert('Failed to delete tenant. Please try again.');
        }
    };

    const handleExportTenants = async () => {
        try {
            // Create CSV content
            const csvHeaders = ['Name', 'Phone', 'Email', 'Status', 'Cooperative', 'Total Payments', 'Total Amount', 'Join Date'];
            const csvRows = tenants.map(tenant => [
                `${tenant.firstName} ${tenant.lastName}`,
                tenant.phone,
                tenant.email || 'N/A',
                tenant.status,
                tenant.cooperative?.name || 'Unknown',
                tenant.paymentStats?.totalPayments || 0,
                tenant.paymentStats?.totalAmount || 0,
                new Date(tenant.createdAt).toLocaleDateString()
            ]);

            const csvContent = [csvHeaders, ...csvRows]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');

            // Download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `tenants-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Failed to export tenants:', err);
            alert('Failed to export tenant data. Please try again.');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-copay-navy">Tenant Management</h1>
                        <p className="text-copay-gray mt-1">
                            Manage tenant accounts across all cooperatives
                        </p>
                    </div>
                    <div className="flex space-x-2 mt-4 sm:mt-0">
                        <Button variant="outline" onClick={handleExportTenants}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                        </Button>
                        <CreateTenantDialog onTenantCreated={fetchTenantsAndStats}>
                            <Button className="bg-copay-blue hover:bg-copay-navy text-white">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Tenant
                            </Button>
                        </CreateTenantDialog>
                    </div>
                </div>

                {/* Tenant Statistics */}
                {error ? (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                            <h3 className="text-lg font-medium text-copay-navy mb-2">Failed to load tenants</h3>
                            <p className="text-copay-gray mb-4">{error}</p>
                            <Button onClick={() => window.location.reload()} className="bg-copay-blue hover:bg-copay-navy text-white">Try Again</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Total Tenants
                                </CardTitle>
                                <Users className="h-4 w-4 text-copay-gray" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-copay-navy">
                                    {loading ? (
                                        <div className="h-8 bg-copay-light-gray rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(stats?.total || 0)
                                    )}
                                </div>
                                <p className="text-xs text-copay-gray mt-1">
                                    Across all cooperatives
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Active Tenants
                                </CardTitle>
                                <Users className="h-4 w-4 text-copay-blue" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-copay-navy">
                                    {loading ? (
                                        <div className="h-8 bg-copay-light-gray rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(stats?.active || 0)
                                    )}
                                </div>
                                <p className="text-xs text-copay-gray mt-1">
                                    Currently active
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Inactive Tenants
                                </CardTitle>
                                <Users className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-copay-navy">
                                    {loading ? (
                                        <div className="h-8 bg-copay-light-gray rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(stats?.inactive || 0)
                                    )}
                                </div>
                                <p className="text-xs text-copay-gray mt-1">
                                    Not active
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    New This Month
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-copay-blue" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-copay-navy">
                                    {loading ? (
                                        <div className="h-8 bg-copay-light-gray rounded animate-pulse w-16"></div>
                                    ) : (
                                        formatNumber(stats?.recentRegistrations || 0)
                                    )}
                                </div>
                                <p className="text-xs text-copay-gray mt-1">
                                    Recent registrations
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tenants Table */}
                <Card className="border-copay-light-gray">
                    <CardHeader>
                        <CardTitle className="text-copay-navy">All Tenants</CardTitle>
                        <CardDescription>
                            Manage tenant accounts across all cooperatives
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-copay-gray" />
                                <Input
                                    placeholder="Search by name, phone, or email..."
                                    value={filters.search || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={filters.status || 'all'} onValueChange={(status) =>
                                setFilters(prev => ({ ...prev, status: status === 'all' ? undefined : status as typeof filters.status, page: 1 }))
                            }>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                                        <div className="h-4 bg-copay-light-gray rounded w-1/4"></div>
                                        <div className="h-4 bg-copay-light-gray rounded w-1/6"></div>
                                        <div className="h-4 bg-copay-light-gray rounded w-1/6"></div>
                                        <div className="h-4 bg-copay-light-gray rounded w-1/6"></div>
                                        <div className="h-4 bg-copay-light-gray rounded w-1/6"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border border-copay-light-gray rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tenant</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Cooperative</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Payment Stats</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tenants.map((tenant) => (
                                            <TableRow key={tenant.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium text-copay-navy">
                                                            {tenant.firstName} {tenant.lastName}
                                                        </div>
                                                        <div className="text-sm text-copay-gray">
                                                            ID: {tenant.id.substring(0, 8)}...
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center text-sm">
                                                            <Phone className="h-3 w-3 text-copay-gray mr-1" />
                                                            {tenant.phone}
                                                        </div>
                                                        {tenant.email && (
                                                            <div className="flex items-center text-sm text-copay-gray">
                                                                <Mail className="h-3 w-3 text-copay-gray mr-1" />
                                                                {tenant.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Building2 className="h-4 w-4 text-copay-gray mr-2" />
                                                        <div>
                                                            <div className="font-medium text-sm">
                                                                {tenant.cooperative?.name || 'Unknown'}
                                                            </div>
                                                            <div className="text-xs text-copay-gray">
                                                                {tenant.cooperative?.code || tenant.cooperativeId}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(tenant.status)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {tenant.paymentStats ? (
                                                            <div>
                                                                <div className="font-medium">
                                                                    RWF {formatNumber(tenant.paymentStats.totalAmount)}
                                                                </div>
                                                                <div className="text-copay-gray">
                                                                    {tenant.paymentStats.totalPayments} payments
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-copay-gray">No payments</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center text-sm text-copay-gray">
                                                        <Calendar className="h-4 w-4 mr-1" />
                                                        {new Date(tenant.createdAt).toLocaleDateString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/tenants/${tenant.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/tenants/${tenant.id}/edit`}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteTenant(tenant.id)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {!loading && tenants.length === 0 && (
                                    <div className="text-center py-8">
                                        <Users className="h-12 w-12 text-copay-gray mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-copay-navy mb-2">
                                            No tenants found
                                        </h3>
                                        <p className="text-copay-gray">
                                            {filters.search || filters.status
                                                ? 'No tenants match your current filters. Try adjusting your search criteria.'
                                                : 'No tenants have been registered yet. Tenant accounts will appear here once they join cooperatives.'
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default withAuth(TenantsPage);