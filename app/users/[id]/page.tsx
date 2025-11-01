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
  Clock
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
    if (!user.isActive) {
      return (
        <Badge variant="destructive">
          <Ban className="h-3 w-3 mr-1" />
          Inactive
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
    
    const action = user.isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      await apiClient.users.updateStatus(user.id, { isActive: !user.isActive });
      setUser(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
      alert(`User ${action}d successfully`);
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      alert(`Failed to ${action} user. Please try again.`);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.users.remove(user.id);
      alert('User deleted successfully');
      router.push('/users');
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user. Please try again.');
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
            <Button variant="ghost" asChild>
              <Link href="/users" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Link>
            </Button>
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
            <Button
              variant={user.isActive ? "destructive" : "default"}
              onClick={handleToggleUserStatus}
            >
              {user.isActive ? (
                <>
                  <Ban className="h-4 w-4 mr-1" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Activate
                </>
              )}
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
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