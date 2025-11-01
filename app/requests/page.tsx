'use client';

import { useState, useEffect } from 'react';
import { 
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Building2,
  Users,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { formatNumber } from '@/lib/utils';
import type { OnboardingRequest } from '@/types';

/**
 * Onboarding Requests Page
 * Review and manage new cooperative registration requests
 */

// Mock onboarding requests data
const mockRequests: OnboardingRequest[] = [
  {
    id: 'REQ-001',
    organizationName: 'Musanze Coffee Cooperative',
    contactPerson: 'Jean Baptiste Uwimana',
    phone: '+250788555444',
    email: 'info@musanzecoffee.rw',
    businessType: 'Agriculture - Coffee Production',
    memberCount: 120,
    requestedPlan: 'Standard',
    status: 'SUBMITTED',
    submittedAt: '2024-01-25T10:30:00Z',
    documents: [
      {
        id: 'DOC-001',
        name: 'Certificate of Registration',
        type: 'PDF',
        url: '/documents/cert-musanze-001.pdf',
        uploadedAt: '2024-01-25T10:25:00Z',
      },
      {
        id: 'DOC-002',
        name: 'Member List',
        type: 'Excel',
        url: '/documents/members-musanze-001.xlsx',
        uploadedAt: '2024-01-25T10:27:00Z',
      },
    ],
  },
  {
    id: 'REQ-002',
    organizationName: 'Rwimiyaga Women Cooperative',
    contactPerson: 'Marie Claire Mukamana',
    phone: '+250788666333',
    email: 'contact@rwimiyaga.rw',
    businessType: 'Handicrafts & Textiles',
    memberCount: 85,
    requestedPlan: 'Premium',
    status: 'UNDER_REVIEW',
    submittedAt: '2024-01-20T14:15:00Z',
    reviewedAt: '2024-01-22T09:00:00Z',
    reviewedBy: 'admin-001',
    documents: [
      {
        id: 'DOC-003',
        name: 'Business License',
        type: 'PDF',
        url: '/documents/license-rwimiyaga-002.pdf',
        uploadedAt: '2024-01-20T14:10:00Z',
      },
    ],
  },
  {
    id: 'REQ-003',
    organizationName: 'Gicumbi Livestock Farmers',
    contactPerson: 'Paul Nkurunziza',
    phone: '+250788777222',
    email: 'admin@gicumbi-livestock.rw',
    businessType: 'Livestock & Dairy',
    memberCount: 200,
    requestedPlan: 'Enterprise',
    status: 'APPROVED',
    submittedAt: '2024-01-15T11:45:00Z',
    reviewedAt: '2024-01-18T16:30:00Z',
    reviewedBy: 'admin-002',
    reviewNotes: 'All documents verified. Excellent business plan.',
    documents: [
      {
        id: 'DOC-004',
        name: 'Certificate of Registration',
        type: 'PDF',
        url: '/documents/cert-gicumbi-003.pdf',
        uploadedAt: '2024-01-15T11:40:00Z',
      },
      {
        id: 'DOC-005',
        name: 'Financial Statements',
        type: 'PDF',
        url: '/documents/financials-gicumbi-003.pdf',
        uploadedAt: '2024-01-15T11:42:00Z',
      },
    ],
  },
];

function RequestsPage() {
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setRequests(mockRequests);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'UNDER_REVIEW':
        return <Eye className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="secondary">Under Review</Badge>;
      case 'SUBMITTED':
        return <Badge variant="warning">Submitted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (requestId: string) => {
    // In real implementation: await apiClient.onboardingRequests.approve(requestId);
    console.log('Approving request:', requestId);
    // Update local state or refetch
  };

  const handleReject = async (requestId: string) => {
    // In real implementation: await apiClient.onboardingRequests.reject(requestId, reason);
    console.log('Rejecting request:', requestId);
    // Update local state or refetch
  };

  const pendingCount = requests.filter(r => r.status === 'SUBMITTED').length;
  const underReviewCount = requests.filter(r => r.status === 'UNDER_REVIEW').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-copay-navy">Onboarding Requests</h1>
            <p className="text-copay-gray">
              Review and approve new cooperative registrations
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
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
                {formatNumber(requests.length)}
              </div>
              <p className="text-xs text-copay-gray">
                All time requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-copay-gray">
                Pending Review
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-copay-navy">
                {formatNumber(pendingCount)}
              </div>
              <p className="text-xs text-copay-gray">
                Awaiting initial review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-copay-gray">
                Under Review
              </CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-copay-navy">
                {formatNumber(underReviewCount)}
              </div>
              <p className="text-xs text-copay-gray">
                Currently being reviewed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-copay-gray">
                Approved
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-copay-navy">
                {formatNumber(approvedCount)}
              </div>
              <p className="text-xs text-copay-gray">
                Successfully onboarded
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-copay-navy">Onboarding Requests</CardTitle>
            <CardDescription>
              Review and manage cooperative registration requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-copay-gray" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
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
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Business Type</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 text-copay-gray mr-2" />
                              <span className="font-medium text-copay-navy">
                                {request.organizationName}
                              </span>
                            </div>
                            <div className="text-sm text-copay-gray mt-1">
                              Plan: {request.requestedPlan}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.contactPerson}</div>
                            <div className="text-sm text-copay-gray flex items-center mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {request.phone}
                            </div>
                            <div className="text-sm text-copay-gray flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {request.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{request.businessType}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-copay-gray mr-1" />
                            {formatNumber(request.memberCount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(request.status)}
                            {getStatusBadge(request.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-copay-gray">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(request.submittedAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {request.status === 'SUBMITTED' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleApprove(request.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleReject(request.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredRequests.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-copay-gray mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-copay-navy mb-2">
                      No requests found
                    </h3>
                    <p className="text-copay-gray">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'New onboarding requests will appear here'
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

export default withAuth(RequestsPage);