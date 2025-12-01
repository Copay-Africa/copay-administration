'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  User as UserIcon,
  Phone,
  Mail,
  Calendar,
  Shield,
  Building2,
  Ban,
  CheckCircle,
  Edit,
  Trash2,
  Clock,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api-client';
import type { User, UserRole } from '@/types';

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * User Detail/Profile Page
 * View and manage individual user details
 */

function UserDetailPage({ params }: UserDetailPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<{
    toggle: boolean;
    deactivate: boolean;
    delete: boolean;
  }>({ toggle: false, deactivate: false, delete: false });

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.users.getById(params.id);
        const userData = response as User;
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        const errorMessage = (err as Error)?.message || 'Failed to load user details.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchUser();
    }
  }, [params.id]);

  // Helper function to determine if user is active
  const isUserActive = (user: User) => {
    return user.isActive !== false && 
           user.status !== 'INACTIVE' && 
           user.status !== 'SUSPENDED';
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <Badge variant="destructive" className="bg-purple-100 text-purple-800 border-purple-200">
            <Shield className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        );
      case 'ORGANIZATION_ADMIN':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            <Building2 className="h-3 w-3 mr-1" />
            Organization Admin
          </Badge>
        );
      case 'TENANT':
        return (
          <Badge variant="outline">
            <UserIcon className="h-3 w-3 mr-1" />
            Tenant
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusBadge = (user: User) => {
    if (!isUserActive(user)) {
      return (
        <Badge variant="destructive">
          <Ban className="h-3 w-3 mr-1" />
          {user.status === 'SUSPENDED' ? 'Suspended' : 'Inactive'}
        </Badge>
      );
    }
    return (
      <Badge variant="success">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  const handleToggleUserStatus = async () => {
    if (!user) return;
    
    const action = isUserActive(user) ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, toggle: true }));
    try {
      await apiClient.users.updateStatus(user.id, { isActive: !isUserActive(user) });
      setUser(prev => prev ? { ...prev, isActive: !isUserActive(prev) } : null);
      alert(`User ${action}d successfully`);
    } catch (err: any) {
      console.error(`Failed to ${action} user:`, err);
      alert(`Failed to ${action} user: ${err.message || 'Please try again.'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, toggle: false }));
    }
  };

  const handleDeactivateUser = async () => {
    if (!user) return;
    
    if (!confirm(`Are you sure you want to deactivate this user?\n\nThis will:\n- Set the account as inactive\n- Prevent login access\n- Preserve all data and history\n- Allow reactivation later`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, deactivate: true }));
    try {
      await apiClient.users.updateStatus(user.id, { isActive: false });
      setUser(prev => prev ? { ...prev, isActive: false } : null);
      alert('User account deactivated successfully');
    } catch (err: any) {
      console.error('Failed to deactivate user:', err);
      alert(`Failed to deactivate user: ${err.message || 'Please try again.'}`);
    } finally {
      setActionLoading(prev => ({ ...prev, deactivate: false }));
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    if (!confirm(`Are you sure you want to PERMANENTLY delete this user?\n\nWARNING: This action cannot be undone!\n\nThis will:\n- Permanently remove the user account\n- Delete all associated data\n- Remove access to all cooperatives`)) {
      return;
    }

    setActionLoading(prev => ({ ...prev, delete: true }));
    try {
      await apiClient.users.remove(user.id);
      alert('User deleted permanently');
      router.push('/users');
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      
      // Check for 404 errors or delete endpoint failures
      const is404Error = err?.response?.status === 404 || 
                        (err as any)?.status === 404 || 
                        err?.message?.includes('404') || 
                        err?.message?.includes('Cannot DELETE') ||
                        err?.message?.includes('DELETE /api/v1/users');
      
      if (is404Error) {
        alert('Delete functionality is not available on this server. Use deactivate instead.');
      } else {
        alert(`Failed to delete user: ${err.message || 'Please try again.'}`);
      }
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/users" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Link>
            </Button>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-copay-navy mb-2">
                {error ? 'Failed to load user' : 'User not found'}
              </h3>
              <p className="text-copay-gray mb-4">
                {error || 'The user you are looking for does not exist or has been deleted.'}
              </p>
              <Button asChild>
                <Link href="/users">Back to Users</Link>
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
              <h1 className="text-2xl font-bold text-copay-navy">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-copay-gray">
                User ID: {user.id}
              </p>
            </div>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
            {isUserActive(user) ? (
              <Button
                variant="outline"
                onClick={handleDeactivateUser}
                disabled={actionLoading.deactivate || actionLoading.delete}
              >
                {actionLoading.deactivate ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4 mr-2" />
                )}
                {actionLoading.deactivate ? 'Deactivating...' : 'Deactivate User'}
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => handleToggleUserStatus()}
                disabled={actionLoading.toggle || actionLoading.delete}
              >
                {actionLoading.toggle ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {actionLoading.toggle ? 'Activating...' : 'Activate User'}
              </Button>
            )}
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={actionLoading.delete || actionLoading.deactivate || actionLoading.toggle}
            >
              {actionLoading.delete ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {actionLoading.delete ? 'Deleting...' : 'Delete User'}
            </Button>
          </div>
        </div>

        {/* User Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-copay-gray">Full Name</label>
                <p className="text-lg font-semibold text-copay-navy">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-copay-gray">Role</label>
                  <div className="mt-1">
                    {getRoleBadge(user.role)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-copay-gray">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(user)}
                  </div>
                </div>
              </div>

              <Separator />
              
              <div>
                <label className="text-sm font-medium text-copay-gray">User ID</label>
                <p className="font-mono text-sm text-copay-navy">
                  {user.id}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-copay-gray">Phone Number</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-copay-gray" />
                  <p className="text-copay-navy font-medium">{user.phone}</p>
                </div>
              </div>

              {user.email && (
                <div>
                  <label className="text-sm font-medium text-copay-gray">Email Address</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-copay-gray" />
                    <p className="text-copay-navy">{user.email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization/Cooperative Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.cooperative ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-copay-gray">Cooperative</label>
                    <p className="text-lg font-semibold text-copay-navy">
                      {user.cooperative.name}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-copay-gray">Cooperative Code</label>
                    <p className="font-mono text-sm text-copay-navy">
                      {user.cooperative.code}
                    </p>
                  </div>


                </>
              ) : (
                <div className="text-center py-4">
                  <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-copay-gray">No cooperative assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Account Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Account Activity
            </CardTitle>
            <CardDescription>
              Track user account activity and login history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-copay-gray">Account Created</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-copay-gray" />
                    <p className="text-copay-navy">
                      {new Date(user.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-copay-gray">Last Updated</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-copay-gray" />
                    <p className="text-copay-navy">
                      {new Date(user.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-copay-gray">Last Login</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-copay-gray" />
                    <p className="text-copay-navy">
                      {user.lastLoginAt 
                        ? new Date(user.lastLoginAt).toLocaleString()
                        : 'Never logged in'
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-copay-gray">Account Status</label>
                  <div className="mt-1">
                    {getStatusBadge(user)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(UserDetailPage);