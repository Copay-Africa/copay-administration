'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  Building2,
  CreditCard,
  MessageSquare,
  Activity,
  Edit,
  Trash2,
  AlertCircle,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Save,
  X
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { formatNumber } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { Tenant, UpdateTenantRequest } from '@/types';

/**
 * Tenant Detail Page
 * View and manage individual tenant account with cross-cooperative capabilities
 */

function TenantDetailPage() {
  const { id } = useParams();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateTenantRequest>({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [availableCooperatives, setAvailableCooperatives] = useState<Array<{
    id: string;
    name: string;
    code: string;
  }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || Array.isArray(id)) return;

      setLoading(true);
      setError('');
      try {
        // Fetch tenant data and available cooperatives in parallel
        const [tenantResponse, cooperativesResponse] = await Promise.all([
          apiClient.tenants.getById(id),
          apiClient.organizations.getAll({ limit: 100 }) // Get all cooperatives for selection
        ]);

        const tenantData = tenantResponse as Tenant;
        setTenant(tenantData);
        
        // Extract cooperatives data
        const cooperativesData = Array.isArray(cooperativesResponse) 
          ? cooperativesResponse 
          : cooperativesResponse.data || [];
        setAvailableCooperatives(cooperativesData.map((coop: unknown) => {
          const c = coop as {id: string; name: string; code: string};
          return {
            id: c.id,
            name: c.name,
            code: c.code
          };
        }));
        
        // Initialize form data
        setFormData({
          firstName: tenantData.firstName,
          lastName: tenantData.lastName,
          phone: tenantData.phone,
          email: tenantData.email,
          status: tenantData.status,
          cooperativeId: tenantData.cooperativeId,
        });
      } catch (err) {
        console.error('Failed to fetch tenant data:', err);
        setError('Failed to load tenant details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleUpdate = async () => {
    if (!tenant || !id || Array.isArray(id)) return;

    setUpdateLoading(true);
    try {
      const response = await apiClient.tenants.update(id, formData);
      const updatedTenant = response as Tenant;
      setTenant(updatedTenant);
      setEditing(false);
    } catch (err) {
      console.error('Failed to update tenant:', err);
      alert('Failed to update tenant. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tenant || !id || Array.isArray(id)) return;
    
    if (!confirm(`Are you sure you want to delete tenant ${tenant.firstName} ${tenant.lastName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.tenants.remove(id);
      // Redirect to tenants list after successful deletion
      window.location.href = '/tenants';
    } catch (err) {
      console.error('Failed to delete tenant:', err);
      alert('Failed to delete tenant. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Active
        </Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Inactive
        </Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Suspended
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !tenant) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-copay-navy mb-2">Failed to load tenant</h3>
            <p className="text-copay-gray mb-4">{error || 'Tenant not found.'}</p>
            <div className="space-x-2">
              <Button variant="outline" asChild>
                <Link href="/tenants">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tenants
                </Link>
              </Button>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/tenants">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tenants
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-copay-navy">
                {tenant.firstName} {tenant.lastName}
              </h1>
              <p className="text-copay-gray">
                Tenant ID: {tenant.id}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {editing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditing(false);
                    // Reset form data
                    setFormData({
                      firstName: tenant.firstName,
                      lastName: tenant.lastName,
                      phone: tenant.phone,
                      email: tenant.email,
                      status: tenant.status,
                      cooperativeId: tenant.cooperativeId,
                    });
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={updateLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-copay-gray" />
                      <div>
                        <div className="text-sm text-copay-gray">Phone</div>
                        <div className="font-medium">{tenant.phone}</div>
                      </div>
                    </div>
                    {tenant.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-copay-gray" />
                        <div>
                          <div className="text-sm text-copay-gray">Email</div>
                          <div className="font-medium">{tenant.email}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-copay-gray" />
                      <div>
                        <div className="text-sm text-copay-gray">Joined</div>
                        <div className="font-medium">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-copay-gray" />
                      <div>
                        <div className="text-sm text-copay-gray">Last Updated</div>
                        <div className="font-medium">
                          {new Date(tenant.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
              <CardContent>
                {editing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cooperativeId">Cooperative Migration</Label>
                      <Select 
                        value={formData.cooperativeId || ''}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, cooperativeId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select cooperative" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCooperatives.map((coop) => (
                            <SelectItem key={coop.id} value={coop.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{coop.name}</span>
                                <span className="text-sm text-gray-500 ml-2">({coop.code})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.cooperativeId !== tenant.cooperativeId && (
                        <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                          ⚠️ This will migrate the tenant to a different cooperative. 
                          Payment history will be preserved but cooperative-specific data may change.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="font-medium text-copay-navy">
                        {tenant.cooperative?.name || 'Unknown Cooperative'}
                      </div>
                      <div className="text-sm text-copay-gray">
                        Code: {tenant.cooperative?.code || tenant.cooperativeId}
                      </div>
                      {tenant.cooperative?.location && (
                        <div className="flex items-center text-sm text-copay-gray mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {tenant.cooperative.location}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment History
                </CardTitle>
                <CardDescription>
                  Recent payment transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tenant.recentPayments && tenant.recentPayments.length > 0 ? (
                  <div className="space-y-4">
                    {tenant.recentPayments.map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            payment.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 
                            payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' : 
                            'bg-red-100 text-red-600'
                          }`}>
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">RWF {formatNumber(payment.amount)}</div>
                            <div className="text-sm text-copay-gray">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant={payment.status === 'COMPLETED' ? 'success' : 'secondary'}>
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-copay-gray">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No payment history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <div className="space-y-2">
                    <Label htmlFor="status">Account Status</Label>
                    <Select
                      value={formData.status || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as typeof formData.status }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-copay-gray">Account Status</span>
                    {getStatusBadge(tenant.status)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Payment Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tenant.paymentStats ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-copay-gray">Total Payments</span>
                      <span className="font-medium">
                        {tenant.paymentStats.totalPayments}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-copay-gray">Total Amount</span>
                      <span className="font-medium">
                        RWF {formatNumber(tenant.paymentStats.totalAmount)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-copay-gray">Average Payment</span>
                      <span className="font-medium">
                        RWF {formatNumber(tenant.paymentStats.averageAmount)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-copay-gray">Last Payment</span>
                      <span className="font-medium">
                        {tenant.paymentStats.lastPaymentDate 
                          ? new Date(tenant.paymentStats.lastPaymentDate).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-copay-gray">
                    <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No payment statistics</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Complaints */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Complaints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-copay-gray">Total Complaints</span>
                  <span className="font-medium">
                    {tenant.complaintCount || 0}
                  </span>
                </div>
                {(tenant.complaintCount || 0) > 0 && (
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    View Complaints
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(TenantDetailPage);