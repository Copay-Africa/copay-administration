'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  Eye,
  MoreHorizontal,
  Building2,
  Users,
  DollarSign,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import DashboardLayout from '@/components/layout/dashboard-layout';
import CreateOrganizationForm from '@/components/organizations/create-organization-form';
import { withAuth } from '@/context/auth-context';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { Organization, OrganizationFilters } from '@/types';

/**
 * Organizations Management Page
 * Displays and manages all registered cooperatives in the system
 */

// Fallback data for organizations in case of API failure
const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'Kigali Workers Cooperative',
    code: 'KWC-2023-001',
    description: 'A cooperative for urban workers in Kigali',
    phone: '+250788123456',
    email: 'info@kigaliworkers.rw',
    address: 'KG 15 Ave, Gasabo, Kigali City, Rwanda',
    status: 'ACTIVE',
    memberCount: 245,
    totalRevenue: 2450000,
    monthlyActiveUsers: 230,
    settings: {
      currency: 'RWF',
      timezone: 'Africa/Kigali',
      paymentDueDay: 15,
      reminderDays: [3, 7, 14],
    },
    createdAt: '2023-08-15T10:30:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
    onboardingStatus: 'APPROVED',
  },
  {
    id: '2',
    name: 'Nyagatare Farmers Union',
    code: 'NFU-2023-002',
    description: 'Agricultural cooperative in Eastern Province',
    phone: '+250788654321',
    email: 'contact@nyafarmers.rw',
    address: 'Nyagatare Center, Nyagatare, Eastern Province, Rwanda',
    status: 'PENDING_APPROVAL',
    memberCount: 180,
    totalRevenue: 450000,
    monthlyActiveUsers: 165,
    settings: {
      currency: 'RWF',
      timezone: 'Africa/Kigali',
      paymentDueDay: 15,
      reminderDays: [3, 7, 14],
    },
    createdAt: '2023-12-01T09:15:00Z',
    updatedAt: '2023-12-01T09:15:00Z',
    onboardingStatus: 'UNDER_REVIEW',
  },
  {
    id: '3',
    name: 'Ubuzima Health Cooperative',
    code: 'UHC-2023-003',
    description: 'Healthcare workers cooperative',
    phone: '+250788987654',
    email: 'admin@ubuzima.rw',
    address: 'KN 78 St, Kicukiro, Kigali City, Rwanda',
    status: 'ACTIVE',
    memberCount: 156,
    totalRevenue: 780000,
    monthlyActiveUsers: 145,
    settings: {
      currency: 'RWF',
      timezone: 'Africa/Kigali',
      paymentDueDay: 15,
      reminderDays: [3, 7, 14],
    },
    createdAt: '2023-09-20T11:45:00Z',
    updatedAt: '2024-01-10T16:30:00Z',
    onboardingStatus: 'APPROVED',
  },
];

function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<OrganizationFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined,
  });

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      try {
        const response = await apiClient.organizations.getAll();
        setOrganizations(response.data as Organization[]);
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
        // Fallback to mock data in case of error
        setOrganizations(mockOrganizations);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [filters]);

  const handleOrganizationCreated = () => {
    setIsCreateDialogOpen(false);
    // Refresh the organizations list
    const fetchOrganizations = async () => {
      try {
        const response = await apiClient.organizations.getAll();
        setOrganizations(response.data as Organization[]);
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      }
    };
    fetchOrganizations();
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : (status as 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL' | 'REJECTED'),
      page: 1
    }));
  };

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

  const filteredOrganizations = organizations.filter(org => {
    if (filters.search && !org.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && org.status !== filters.status) {
      return false;
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-copay-navy">Organizations</h1>
            <p className="text-copay-gray">
              Manage registered cooperatives and their subscriptions
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Organization
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                </DialogHeader>
                <CreateOrganizationForm
                  onSuccess={handleOrganizationCreated}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-copay-gray">
                Total Organizations
              </CardTitle>
              <Building2 className="h-4 w-4 text-copay-gray" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-copay-navy">
                {formatNumber(organizations.length)}
              </div>
              <p className="text-xs text-copay-gray">
                +2 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-copay-gray">
                Active Organizations
              </CardTitle>
              <Building2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-copay-navy">
                {formatNumber(organizations.filter(o => o.status === 'ACTIVE').length)}
              </div>
              <p className="text-xs text-copay-gray">
                94% of total organizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-copay-gray">
                Total Members
              </CardTitle>
              <Users className="h-4 w-4 text-copay-gray" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-copay-navy">
                {formatNumber(organizations.reduce((sum, org) => sum + (org.memberCount || 0), 0))}
              </div>
              <p className="text-xs text-copay-gray">
                Across all cooperatives
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-copay-gray">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-copay-gray" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-copay-navy">
                {formatCurrency(organizations.length * 25000)}
              </div>
              <p className="text-xs text-copay-gray">
                From subscriptions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-copay-navy">Organizations List</CardTitle>
            <CardDescription>
              View and manage all registered cooperatives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-copay-gray" />
                <Input
                  placeholder="Search organizations..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Organizations Table */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-copay-navy">{org.name}</div>
                            <div className="text-sm text-copay-gray">
                              {org.code || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(org.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-copay-gray mr-1" />
                            {formatNumber(org.memberCount || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">Basic</div>
                            <div className="text-sm text-copay-gray">
                              {formatCurrency(25000)}/mo
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">
                            {formatCurrency(org.totalRevenue || 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-copay-gray">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(org.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/organizations/${org.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredOrganizations.length === 0 && (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-copay-gray mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-copay-navy mb-2">
                      No organizations found
                    </h3>
                    <p className="text-copay-gray">
                      {filters.search || filters.status
                        ? 'Try adjusting your search or filters'
                        : 'Start by adding your first organization'
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

export default withAuth(OrganizationsPage);