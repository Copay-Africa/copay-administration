/* eslint-disable @typescript-eslint/no-explicit-any */
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
  Calendar,
  Tags
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
import CategoryDialog from '@/components/cooperative-categories/category-dialog';
import CategoryCard from '@/components/cooperative-categories/category-card';
import { withAuth } from '@/context/auth-context';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { Organization, OrganizationFilters, CooperativeCategory } from '@/types';

/**
 * Organizations Management Page
 * Displays and manages all registered cooperatives in the system
 */

function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [categories, setCategories] = useState<CooperativeCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
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
        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [filters]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await apiClient.cooperativeCategories.getAll({ page: 1, limit: 50 });
      const data = (response && (response as any).data) ? (response as any).data : (response as any);
      const list: CooperativeCategory[] = Array.isArray(data) ? data : (response as any).data || [];
      setCategories(list);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

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

  const handleCategorySaved = (category: CooperativeCategory) => {
    setCategories(prev => {
      const exists = prev.find(c => c.id === category.id);
      if (exists) return prev.map(c => (c.id === category.id ? category : c));
      return [category, ...prev];
    });
  };

  const handleCategoryDeleted = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleShowCategories = () => {
    setShowCategories(true);
    if (categories.length === 0) {
      fetchCategories();
    }
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
            <p className="text-copay-gray mt-1">
              Manage registered cooperatives and their subscriptions
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Button variant="outline" onClick={handleShowCategories}>
              <Tags className="h-4 w-4 mr-2" />
              Categories
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-copay-blue hover:bg-copay-navy text-white">
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
          <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
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
              <p className="text-xs text-copay-gray mt-1">
                +2 from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-copay-gray">
                Active Organizations
              </CardTitle>
              <Building2 className="h-4 w-4 text-copay-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-copay-navy">
                {formatNumber(organizations.filter(o => o.status === 'ACTIVE').length)}
              </div>
              <p className="text-xs text-copay-gray mt-1">
                94% of total organizations
              </p>
            </CardContent>
          </Card>

          <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
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
              <p className="text-xs text-copay-gray mt-1">
                Across all cooperatives
              </p>
            </CardContent>
          </Card>

          <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
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
              <p className="text-xs text-copay-gray mt-1">
                From subscriptions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Management Section */}
        {showCategories && (
          <Card className="border-copay-light-gray">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-copay-navy">Cooperative Categories</CardTitle>
                  <CardDescription>
                    Manage categories to organize cooperatives by type
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <CategoryDialog 
                    onSaved={handleCategorySaved}
                    trigger={
                      <Button className="bg-copay-blue hover:bg-copay-navy text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    }
                  />
                  <Button variant="outline" onClick={() => setShowCategories(false)}>
                    Hide Categories
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-copay-light-gray rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={handleCategorySaved}
                      onDeleted={handleCategoryDeleted}
                    />
                  ))}
                </div>
              )}
              {!categoriesLoading && categories.length === 0 && (
                <div className="text-center py-8">
                  <Tags className="h-12 w-12 text-copay-gray mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-copay-navy mb-2">
                    No categories found
                  </h3>
                  <p className="text-copay-gray mb-4">
                    Create categories to organize your cooperatives by type
                  </p>
                  <CategoryDialog 
                    onSaved={handleCategorySaved}
                    trigger={
                      <Button className="bg-copay-blue hover:bg-copay-navy text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Category
                      </Button>
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="border-copay-light-gray">
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
                      <TableHead>Organization</TableHead>
                      <TableHead>Category</TableHead>
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
                          {org.category ? (
                            <span className="text-sm text-copay-navy">{org.category.name}</span>
                          ) : (
                            <span className="text-sm text-copay-gray">Uncategorized</span>
                          )}
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