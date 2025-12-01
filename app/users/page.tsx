'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Filter,
    Download,
    Users as UsersIcon,
    UserPlus,
    Eye,
    Ban,
    CheckCircle,
    AlertCircle,
    Building2,
    Phone,
    Mail,
    Calendar,
    Shield,
    User as UserIcon,
    Trash2
} from 'lucide-react';
import Link from 'next/link';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { CreateUserDialog } from '@/components/users/create-user-dialog';
import { withAuth } from '@/context/auth-context';
import { formatNumber } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { User, UserFilters, UserStats, UserRole, UserAnalytics } from '@/types';

/**
 * Users Management Page
 * Manage users across all cooperatives 
 */

function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState<UserFilters>({
        page: 1,
        limit: 20,
        search: '',
        role: undefined,
    });

    // Function to refresh users, stats and analytics
    const fetchUsersAndAnalytics = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch users, stats and analytics in parallel
            const [usersResponse, statsResponse, analyticsResponse] = await Promise.all([
                apiClient.users.getAll(filters),
                apiClient.users.getStats(),
                apiClient.users.getAnalytics()
            ]);

            // Handle response format - could be array directly or wrapped in data property
            const userData = Array.isArray(usersResponse)
                ? usersResponse
                : (usersResponse.data || usersResponse);

            setUsers(userData as User[]);
            setStats(statsResponse as UserStats);
            setAnalytics(analyticsResponse as UserAnalytics);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            const errorMessage = (err as Error)?.message || 'Failed to load users. Please try again.';
            setError(errorMessage);
            // Set empty fallback stats on error
            setUsers([]);
            setStats({
                total: 0,
                byRole: [],
                byStatus: [],
                recentUsers: []
            });
            setAnalytics(null);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchUsersAndAnalytics();
    }, [filters, fetchUsersAndAnalytics]);

    const getRoleBadge = (role: UserRole) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return <Badge variant="destructive" className="bg-purple-100 text-purple-800 border-purple-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Super Admin
                </Badge>;
            case 'ORGANIZATION_ADMIN':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                    <Building2 className="h-3 w-3 mr-1" />
                    Org Admin
                </Badge>;
            case 'TENANT':
                return <Badge variant="outline">
                    <UserIcon className="h-3 w-3 mr-1" />
                    Tenant
                </Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    const getStatusBadge = (user: User) => {
        if (!user.isActive) {
            return <Badge variant="destructive">
                <Ban className="h-3 w-3 mr-1" />
                Inactive
            </Badge>;
        }
        return <Badge variant="success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
        </Badge>;
    };

    const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} this user?`)) {
            return;
        }

        try {
            await apiClient.users.updateStatus(userId, { isActive: !currentStatus });
            // Refresh the users list
            setUsers(prev => prev.map(user =>
                user.id === userId ? { ...user, isActive: !currentStatus } : user
            ));
            alert(`User ${action}d successfully`);
        } catch (err) {
            console.error(`Failed to ${action} user:`, err);
            alert(`Failed to ${action} user. Please try again.`);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        const confirmMessage = `Are you sure you want to permanently delete "${userName}"?\n\nThis action cannot be undone and will:\n- Remove the user account permanently\n- Delete all associated data\n- Remove access to all cooperatives`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        try {
            await apiClient.users.remove(userId);
            // Remove user from local state
            setUsers(prev => prev.filter(user => user.id !== userId));
            // Refresh analytics to update counts
            fetchUsersAndAnalytics();
            alert('User deleted successfully');
        } catch (err) {
            console.error('Failed to delete user:', err);
            alert('Failed to delete user. Please try again.');
        }
    };

    const handleExportUsers = async () => {
        try {
            // Create CSV content
            const csvHeaders = ['Name', 'Phone', 'Email', 'Role', 'Status', 'Cooperative', 'Last Login', 'Created Date'];
            const csvRows = users.map(user => [
                `${user.firstName} ${user.lastName}`,
                user.phone,
                user.email || 'N/A',
                user.role,
                user.isActive ? 'Active' : 'Inactive',
                user.cooperative?.name || 'N/A',
                user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never',
                new Date(user.createdAt).toLocaleDateString()
            ]);

            const csvContent = [csvHeaders, ...csvRows]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');

            // Download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Failed to export users:', err);
            alert('Failed to export user data. Please try again.');
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-copay-navy">User Management</h1>
                        <p className="text-copay-gray mt-1">
                            Manage user accounts across all cooperatives
                        </p>
                    </div>
                    <div className="flex space-x-2 mt-4 sm:mt-0">
                        <Button variant="outline" onClick={handleExportUsers}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                        </Button>
                        <CreateUserDialog onUserCreated={fetchUsersAndAnalytics}>
                            <Button className="bg-copay-blue hover:bg-copay-navy text-white">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add User
                            </Button>
                        </CreateUserDialog>
                    </div>
                </div>

                {/* User Analytics */}
                {error ? (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                            <h3 className="text-lg font-medium text-copay-navy mb-2">Failed to load users</h3>
                            <p className="text-copay-gray mb-4">{error}</p>
                            <Button onClick={() => window.location.reload()} className="bg-copay-blue hover:bg-copay-navy text-white">Try Again</Button>
                        </CardContent>
                    </Card>
                ) : analytics && !loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Total Users
                                </CardTitle>
                                <UsersIcon className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-copay-navy">
                                    {formatNumber(analytics.totalUsers)}
                                </div>
                                <p className="text-xs text-copay-gray">
                                    registered users
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Active Users
                                </CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {formatNumber(analytics.activeUsers)}
                                </div>
                                <p className="text-xs text-copay-gray">
                                    currently active
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    New Registrations
                                </CardTitle>
                                <UserPlus className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-600">
                                    {formatNumber(analytics.newRegistrations)}
                                </div>
                                <p className="text-xs text-copay-gray">
                                    recent signups
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-copay-light-gray hover:shadow-md transition-shadow duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-copay-gray">
                                    Growth Rate
                                </CardTitle>
                                <UserPlus className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">
                                    {analytics.growthRate.toFixed(1)}%
                                </div>
                                <p className="text-xs text-copay-gray">
                                    growth rate
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i} className="border-copay-light-gray">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="h-4 bg-copay-light-gray rounded animate-pulse w-20"></div>
                                    <div className="h-4 w-4 bg-copay-light-gray rounded animate-pulse"></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-8 bg-copay-light-gray rounded animate-pulse w-16 mb-2"></div>
                                    <div className="h-3 bg-copay-light-gray rounded animate-pulse w-12"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Professional Analytics Charts */}
                {analytics && !loading && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Role Distribution Pie Chart */}
                        <Card className="border-copay-light-gray">
                            <CardHeader>
                                <CardTitle className="text-copay-navy">Role Distribution</CardTitle>
                                <CardDescription>
                                    User distribution by roles
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={analytics.roleDistribution.map(item => ({
                                                    name: item.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
                                                    value: item.count,
                                                    percentage: item.percentage
                                                }))}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry: any) => `${entry.name} (${entry.percentage.toFixed(1)}%)`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {analytics.roleDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={[
                                                        '#8B5CF6', // Purple for Super Admin
                                                        '#3B82F6', // Blue for Org Admin  
                                                        '#1E40AF'  // Navy for Tenant
                                                    ][index % 3]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any, name: any) => [`${formatNumber(Number(value))} users`, name]} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status Distribution Bar Chart */}
                        <Card className="border-copay-light-gray">
                            <CardHeader>
                                <CardTitle className="text-copay-navy">Status Distribution</CardTitle>
                                <CardDescription>
                                    User account status breakdown
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={analytics.statusDistribution.map(item => ({
                                            status: item.status,
                                            count: item.count,
                                            percentage: item.percentage
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="status" />
                                            <YAxis />
                                            <Tooltip formatter={(value: any, name: any) => [`${formatNumber(Number(value))} users`, 'Users']} />
                                            <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Activity Trends Line Chart */}
                {analytics && analytics.activityTrends.length > 0 && !loading && (
                    <Card className="border-copay-light-gray">
                        <CardHeader>
                            <CardTitle className="text-copay-navy">Activity Trends</CardTitle>
                            <CardDescription>
                                User activity and registration trends over time
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div style={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer>
                                    <LineChart data={analytics.activityTrends.map(trend => ({
                                        date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                        activeUsers: trend.activeUsers,
                                        newUsers: trend.newUsers,
                                        fullDate: trend.date
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip 
                                            formatter={(value: any, name: any) => [
                                                `${formatNumber(Number(value))} users`, 
                                                name === 'activeUsers' ? 'Active Users' : 'New Users'
                                            ]}
                                            labelFormatter={(label: any) => `Date: ${label}`}
                                        />
                                        <Legend />
                                        <Line 
                                            type="monotone" 
                                            dataKey="activeUsers" 
                                            stroke="#3B82F6" 
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            name="Active Users"
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="newUsers" 
                                            stroke="#10B981" 
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            name="New Registrations"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
                <Card className="border-copay-light-gray">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-copay-navy">
                            <Filter className="h-5 w-5" />
                            Filter Users
                        </CardTitle>
                        <CardDescription>
                            Search and filter users by various criteria
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search by name, phone, or email..."
                                    value={filters.search || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                    className="w-full"
                                />
                            </div>
                            <div className="sm:w-48">
                                <Select
                                    value={filters.role || 'all'}
                                    onValueChange={(value) => setFilters(prev => ({
                                        ...prev,
                                        role: value === 'all' ? undefined : (value as UserRole),
                                        page: 1
                                    }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                        <SelectItem value="ORGANIZATION_ADMIN">Organization Admin</SelectItem>
                                        <SelectItem value="TENANT">Tenant</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card className="border-copay-light-gray">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-copay-navy">
                            <UsersIcon className="h-5 w-5" />
                            Users ({formatNumber(users?.length || 0)})
                        </CardTitle>
                        <CardDescription>
                            Manage user accounts and permissions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-16 bg-copay-light-gray rounded animate-pulse"></div>
                                ))}
                            </div>
                        ) : (users?.length || 0) === 0 ? (
                            <div className="text-center py-8">
                                <UsersIcon className="h-12 w-12 text-copay-gray mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium text-copay-navy mb-2">No users found</h3>
                                <p className="text-copay-gray">
                                    {filters.search || filters.role
                                        ? 'Try adjusting your search or filter criteria.'
                                        : 'Users will appear here when they are created.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Cooperative</TableHead>
                                            <TableHead>Last Login</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-copay-navy">
                                                            {user.firstName} {user.lastName}
                                                        </p>
                                                        <p className="text-sm text-copay-gray">ID: {user.id.slice(0, 8)}...</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-3 w-3 text-copay-gray" />
                                                            <span className="text-sm">{user.phone}</span>
                                                        </div>
                                                        {user.email && (
                                                            <div className="flex items-center gap-2">
                                                                <Mail className="h-3 w-3 text-copay-gray" />
                                                                <span className="text-sm">{user.email}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getRoleBadge(user.role)}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(user)}
                                                </TableCell>
                                                <TableCell>
                                                    {user.cooperative ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="h-3 w-3 text-copay-gray" />
                                                                <span className="font-medium">{user.cooperative.name}</span>
                                                            </div>
                                                            <p className="text-sm text-copay-gray">
                                                                {user.cooperative.code}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-3 w-3 text-copay-gray" />
                                                        <span className="text-sm">
                                                            {user.lastLoginAt
                                                                ? new Date(user.lastLoginAt).toLocaleDateString()
                                                                : 'Never'
                                                            }
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/users/${user.id}`}>
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                View
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant={user.isActive ? "destructive" : "default"}
                                                            onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                                                        >
                                                            {user.isActive ? (
                                                                <>
                                                                    <Ban className="h-3 w-3 mr-1" />
                                                                    Deactivate
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Activate
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                                                            title="Delete user permanently"
                                                        >
                                                            <Trash2 className="h-3 w-3 mr-1" />
                                                            Delete
                                                        </Button>
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

export default withAuth(UsersPage);