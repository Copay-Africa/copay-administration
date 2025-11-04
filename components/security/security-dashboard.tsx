'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    AlertTriangle,
    Shield,
    Eye,
    Clock,
    Users,
    Lock,
    Unlock,
    MapPin,
    Activity as ActivityIcon,
    RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import type {
    Activity
} from '@/types';

// Security event severity levels
const getSecuritySeverity = (activityType: string) => {
    const severityMap: Record<string, { level: 'critical' | 'high' | 'medium' | 'low', color: string }> = {
        'LOGIN_FAILED': { level: 'high', color: 'bg-red-100 text-red-800 border-red-300' },
        'UNAUTHORIZED_ACCESS': { level: 'critical', color: 'bg-red-600 text-white border-red-600' },
        'MULTIPLE_FAILED_LOGINS': { level: 'critical', color: 'bg-red-600 text-white border-red-600' },
        'SUSPICIOUS_LOGIN': { level: 'high', color: 'bg-orange-100 text-orange-800 border-orange-300' },
        'PASSWORD_RESET': { level: 'medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
        'USER_DELETED': { level: 'high', color: 'bg-red-100 text-red-800 border-red-300' },
        'ADMIN_ACTION': { level: 'medium', color: 'bg-blue-100 text-blue-800 border-blue-300' },
        'SECURITY_POLICY_CHANGE': { level: 'high', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    };
    
    return severityMap[activityType] || { level: 'low', color: 'bg-gray-100 text-gray-800 border-gray-300' };
};

// Format time ago
const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
};

interface SecurityDashboardProps {
    className?: string;
}

export function SecurityDashboard({ className }: SecurityDashboardProps) {
    const [securityEvents, setSecurityEvents] = useState<Activity[]>([]);
    const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        totalSecurityEvents: 0,
        criticalEvents: 0,
        failedLogins: 0,
        suspiciousActivities: 0,
        uniqueUsers: 0,
        uniqueIPs: 0
    });

    // Fetch security data
    const fetchSecurityData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Fetch security events and recent activities
            const [securityResponse, activitiesResponse] = await Promise.all([
                apiClient.activities.getSecurityEvents({
                    limit: 10,
                    sortBy: 'createdAt',
                    sortOrder: 'DESC'
                }),
                apiClient.activities.getAll({
                    limit: 10,
                    sortBy: 'createdAt',
                    sortOrder: 'DESC'
                })
            ]);

            const securityData = (securityResponse.data || []) as Activity[];
            const activitiesData = (activitiesResponse.data || []) as Activity[];

            setSecurityEvents(securityData);
            setRecentActivities(activitiesData);

            // Calculate statistics
            const criticalEvents = securityData.filter(event => 
                getSecuritySeverity(event.type).level === 'critical'
            ).length;

            const failedLogins = securityData.filter(event => 
                event.type === 'LOGIN_FAILED'
            ).length;

            const suspiciousActivities = securityData.filter(event => 
                event.type === 'SUSPICIOUS_LOGIN' || event.type === 'MULTIPLE_FAILED_LOGINS'
            ).length;

            const uniqueUsers = new Set(
                [...securityData, ...activitiesData]
                    .map(event => event.userId)
                    .filter(Boolean)
            ).size;

            const uniqueIPs = new Set(
                [...securityData, ...activitiesData]
                    .map(event => event.ipAddress)
                    .filter(Boolean)
            ).size;

            setStats({
                totalSecurityEvents: securityData.length,
                criticalEvents,
                failedLogins,
                suspiciousActivities,
                uniqueUsers,
                uniqueIPs
            });

            setError('');
        } catch (err) {
            console.error('Failed to fetch security data:', err);
            setError('Failed to load security data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSecurityData();
        
        // Set up auto-refresh every 30 seconds for real-time monitoring
        const interval = setInterval(fetchSecurityData, 30000);
        return () => clearInterval(interval);
    }, [fetchSecurityData]);

    if (loading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2">Loading security dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="w-7 h-7 text-red-600" />
                        Security Dashboard
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Real-time security monitoring and threat detection
                    </p>
                </div>
                <Button onClick={fetchSecurityData} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Security Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="border-red-200 bg-red-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">Security Events</CardTitle>
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-900">{stats.totalSecurityEvents}</div>
                        <p className="text-xs text-red-700">Total events today</p>
                    </CardContent>
                </Card>

                <Card className="border-red-300 bg-red-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-900">Critical Events</CardTitle>
                        <Shield className="w-4 h-4 text-red-700" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-900">{stats.criticalEvents}</div>
                        <p className="text-xs text-red-800">Immediate attention</p>
                    </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-800">Failed Logins</CardTitle>
                        <Lock className="w-4 h-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-900">{stats.failedLogins}</div>
                        <p className="text-xs text-orange-700">Authentication failures</p>
                    </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-800">Suspicious</CardTitle>
                        <Eye className="w-4 h-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-900">{stats.suspiciousActivities}</div>
                        <p className="text-xs text-yellow-700">Activities flagged</p>
                    </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">Active Users</CardTitle>
                        <Users className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">{stats.uniqueUsers}</div>
                        <p className="text-xs text-blue-700">Unique users today</p>
                    </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-800">IP Addresses</CardTitle>
                        <MapPin className="w-4 h-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-900">{stats.uniqueIPs}</div>
                        <p className="text-xs text-purple-700">Unique locations</p>
                    </CardContent>
                </Card>
            </div>

            {/* Error State */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertTriangle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Security Events */}
                <Card className="border-red-200">
                    <CardHeader className="bg-red-50">
                        <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                            <AlertTriangle className="w-5 h-5" />
                            Recent Security Events
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {securityEvents.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No recent security events</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {securityEvents.map((event) => {
                                    const severity = getSecuritySeverity(event.type);
                                    return (
                                        <div key={event.id} className="p-4 hover:bg-gray-50">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="outline" className={severity.color}>
                                                            {event.type}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {severity.level.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium mb-1">{event.description}</p>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            {event.user ? 
                                                                `${event.user.firstName || ''} ${event.user.lastName || ''}`.trim() || 
                                                                event.user.phone || 'Unknown'
                                                                : 'System'
                                                            }
                                                        </span>
                                                        {event.ipAddress && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {event.ipAddress}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTimeAgo(event.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent User Activities */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ActivityIcon className="w-5 h-5" />
                            Recent User Activities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentActivities.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <ActivityIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No recent activities</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {recentActivities.slice(0, 8).map((activity) => (
                                    <div key={activity.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    {activity.type === 'LOGIN' ? 
                                                        <Unlock className="w-4 h-4 text-green-600" /> :
                                                        activity.type === 'LOGOUT' ? 
                                                        <Lock className="w-4 h-4 text-gray-600" /> :
                                                        <ActivityIcon className="w-4 h-4 text-blue-600" />
                                                    }
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{activity.description}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        <span>
                                                            {activity.user ? 
                                                                `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || 
                                                                activity.user.phone || 'Unknown'
                                                                : 'System'
                                                            }
                                                        </span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {activity.entityType}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatTimeAgo(activity.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default SecurityDashboard;