'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Filter,
  Download,
  FileText,
  UserCheck,
  UserX,
  Clock,
  Eye,
  Check,
  X,
  AlertCircle,
  Building2,
  Phone,
  Home,
  Calendar,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { formatNumber } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { AccountRequest, AccountRequestFilters, AccountRequestStats } from '@/types';

/**
 * Account Requests Management Page
 * Manage account requests across all cooperatives 
 */

function AccountRequestsPage() {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [stats, setStats] = useState<AccountRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<AccountRequestFilters>({
    page: 1,
    limit: 20,
    search: '',
    status: undefined,
  });

  // Function to refresh requests and stats
  const fetchRequestsAndStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch requests and stats in parallel
      const [requestsResponse, statsResponse] = await Promise.all([
        apiClient.accountRequests.getAll(filters),
        apiClient.accountRequests.getStats()
      ]);

      // Handle response format - could be array directly or wrapped in data property
      const requestData = Array.isArray(requestsResponse) 
        ? requestsResponse 
        : (requestsResponse.data || requestsResponse);
        
      setRequests(requestData as AccountRequest[]);
      setStats(statsResponse as AccountRequestStats);
    } catch (err) {
      console.error('Failed to fetch account requests:', err);
      const errorMessage = (err as Error)?.message || 'Failed to load account requests. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRequestsAndStats();
  }, [filters, fetchRequestsAndStats]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'APPROVED':
        return <Badge variant="success" className="bg-green-100 text-green-800 border-green-200">
          <Check className="h-3 w-3 mr-1" />
          Approved
        </Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <X className="h-3 w-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleProcessRequest = async (requestId: string, action: 'APPROVE' | 'REJECT', notes?: string, rejectionReason?: string) => {
    try {
      await apiClient.accountRequests.process(requestId, {
        action,
        notes,
        rejectionReason
      });
      // Refresh the requests list
      await fetchRequestsAndStats();
      alert(`Account request ${action.toLowerCase()}d successfully`);
    } catch (err) {
      console.error(`Failed to ${action.toLowerCase()} request:`, err);
      alert(`Failed to ${action.toLowerCase()} request. Please try again.`);
    }
  };

  const handleExportRequests = () => {
    try {
      // Create CSV content
      const csvHeaders = ['Full Name', 'Phone', 'Room Number', 'Status', 'Cooperative', 'Submitted Date', 'Processed Date', 'Notes'];
      const csvRows = requests.map(request => [
        request.fullName,
        request.phone,
        request.roomNumber,
        request.status,
        request.cooperative?.name || 'Unknown',
        new Date(request.createdAt).toLocaleDateString(),
        request.processedAt ? new Date(request.processedAt).toLocaleDateString() : 'N/A',
        request.notes || request.rejectionReason || 'N/A'
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `account-requests-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export requests:', err);
      alert('Failed to export request data. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-copay-navy">Account Requests</h1>
            <p className="text-copay-gray">
              Manage account requests from potential tenants across all cooperatives
            </p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" onClick={handleExportRequests}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Request Statistics */}
        {error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-copay-navy mb-2">Failed to load account requests</h3>
              <p className="text-copay-gray mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-copay-gray">
                  Total Requests
                </CardTitle>
                <FileText className="h-4 w-4 text-copay-gray" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-copay-navy">
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                  ) : (
                    formatNumber(stats?.total || 0)
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-copay-gray">
                  Pending Requests
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                  ) : (
                    formatNumber(stats?.byStatus?.find(s => s.status === 'PENDING')?.count || 0)
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-copay-gray">
                  Approved
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                  ) : (
                    formatNumber(stats?.byStatus?.find(s => s.status === 'APPROVED')?.count || 0)
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-copay-gray">
                  Rejected
                </CardTitle>
                <UserX className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                  ) : (
                    formatNumber(stats?.byStatus?.find(s => s.status === 'REJECTED')?.count || 0)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Requests
            </CardTitle>
            <CardDescription>
              Search and filter account requests by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, phone, or room number..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  className="w-full"
                />
              </div>
              <div className="sm:w-48">
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    status: value === 'all' ? undefined : (value as 'PENDING' | 'APPROVED' | 'REJECTED'), 
                    page: 1 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Account Requests ({formatNumber(requests.length)})
            </CardTitle>
            <CardDescription>
              Manage account requests from potential tenants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-copay-navy mb-2">No account requests found</h3>
                <p className="text-copay-gray">
                  {filters.search || filters.status 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Account requests will appear here when tenants submit applications.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Cooperative</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-copay-navy">{request.fullName}</p>
                            <p className="text-sm text-copay-gray">ID: {request.id.slice(0, 8)}...</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-copay-gray" />
                              <span className="text-sm">{request.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="h-3 w-3 text-copay-gray" />
                            <span className="font-medium">{request.roomNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3 text-copay-gray" />
                              <span className="font-medium">{request.cooperative?.name || 'Unknown'}</span>
                            </div>
                            <p className="text-sm text-copay-gray">
                              {request.cooperative?.code}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(request.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-copay-gray" />
                            <span className="text-sm">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/requests/${request.id}`}>
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Link>
                            </Button>
                            {request.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleProcessRequest(request.id, 'APPROVE', 'Approved by admin')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleProcessRequest(request.id, 'REJECT', undefined, 'Rejected by admin')}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(AccountRequestsPage);
