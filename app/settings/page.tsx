'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import {
    Settings,
    CreditCard,
    Bell,
    Shield,
    ToggleLeft,
    Users,
    Database,
    Globe,
    Lock,
    Mail,
    Smartphone,
    DollarSign,
    AlertTriangle,
    CheckCircle,
    Zap,
    Eye,
    EyeOff,
    Save,
    RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

// Configuration categories
const configCategories = [
    {
        id: 'payment',
        name: 'Payment Configuration',
        icon: CreditCard,
        description: 'Payment processing, limits, and fee structures',
        color: 'bg-green-100 text-green-800 border-green-300'
    },
    {
        id: 'notifications',
        name: 'Notification Settings',
        icon: Bell,
        description: 'Email, SMS, and push notification preferences',
        color: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    {
        id: 'security',
        name: 'Security Policies',
        icon: Shield,
        description: 'Authentication, session, and access control settings',
        color: 'bg-red-100 text-red-800 border-red-300'
    },
    {
        id: 'features',
        name: 'Feature Toggles',
        icon: ToggleLeft,
        description: 'Enable/disable features and experimental functionality',
        color: 'bg-purple-100 text-purple-800 border-purple-300'
    },
    {
        id: 'tenants',
        name: 'Multi-Tenant Config',
        icon: Users,
        description: 'Tenant-specific settings and resource limits',
        color: 'bg-orange-100 text-orange-800 border-orange-300'
    },
    {
        id: 'system',
        name: 'System Settings',
        icon: Database,
        description: 'Database, caching, and performance configurations',
        color: 'bg-gray-100 text-gray-800 border-gray-300'
    }
];

// Mock system configuration data
const systemConfig = {
    payment: {
        stripeEnabled: true,
        stripePublishableKey: 'pk_test_***',
        stripeSecretKey: 'sk_test_***',
        maxTransactionAmount: 100000,
        minTransactionAmount: 100,
        transactionFeePercentage: 2.5,
        processingFee: 50,
        supportedCurrencies: ['RWF', 'USD', 'EUR'],
        defaultCurrency: 'RWF'
    },
    notifications: {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smsProvider: 'Twilio',
        maxDailyEmails: 10000,
        maxDailySms: 5000,
        emailTemplatesEnabled: true
    },
    security: {
        passwordMinLength: 8,
        passwordRequireSpecialChars: true,
        passwordRequireNumbers: true,
        passwordRequireUppercase: true,
        twoFactorRequired: false,
        sessionTimeoutMinutes: 30,
        maxLoginAttempts: 5,
        accountLockoutMinutes: 15
    },
    features: {
        newDashboard: true,
        advancedAnalytics: false,
        bulkPayments: true,
        autoReminders: true,
        mobileApp: false,
        apiAccess: true,
        webhooks: true,
        customBranding: false
    },
    tenants: {
        maxTenantsPerOrganization: 10,
        allowCustomDomains: false,
        requireSslCertificates: true,
        maxUsersPerTenant: 1000,
        maxStoragePerTenant: 10240, // MB
        allowDataExport: true,
        requireDataRetention: true
    },
    system: {
        databaseConnectionPoolSize: 20,
        cacheEnabled: true,
        cacheTtlMinutes: 60,
        maxFileUploadSize: 10, // MB
        sessionSecret: '***hidden***',
        logLevel: 'info',
        enableMetrics: true,
        backupEnabled: true
    }
};

export default function SystemSettingsPage() {
    const [activeCategory, setActiveCategory] = useState('payment');
    const [config, setConfig] = useState(systemConfig);
    const [loading, setLoading] = useState(false);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [showSecrets, setShowSecrets] = useState(false);

    // Handle configuration change
    const handleConfigChange = (category: string, key: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            [category]: {
                ...prev[category as keyof typeof prev],
                [key]: value
            }
        }));
        setUnsavedChanges(true);
    };

    // Save configuration
    const handleSave = async () => {
        try {
            setLoading(true);
            // Mock API call - in real implementation, this would save to backend
            await new Promise(resolve => setTimeout(resolve, 1000));
            setUnsavedChanges(false);
        } catch (err) {
            console.error('Failed to save configuration:', err);
        } finally {
            setLoading(false);
        }
    };

    // Reset configuration
    const handleReset = () => {
        setConfig(systemConfig);
        setUnsavedChanges(false);
    };

    // Render configuration section based on active category
    const renderConfigSection = () => {
        const categoryConfig = config[activeCategory as keyof typeof config] as Record<string, any>;

        switch (activeCategory) {
            case 'payment':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" />
                                        Stripe Configuration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="stripe-enabled">Stripe Enabled</Label>
                                        <input
                                            id="stripe-enabled"
                                            type="checkbox"
                                            checked={categoryConfig.stripeEnabled}
                                            onChange={(e) => handleConfigChange('payment', 'stripeEnabled', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="stripe-publishable">Publishable Key</Label>
                                        <Input
                                            id="stripe-publishable"
                                            type={showSecrets ? 'text' : 'password'}
                                            value={categoryConfig.stripePublishableKey}
                                            onChange={(e) => handleConfigChange('payment', 'stripePublishableKey', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="stripe-secret">Secret Key</Label>
                                        <div className="relative">
                                            <Input
                                                id="stripe-secret"
                                                type={showSecrets ? 'text' : 'password'}
                                                value={categoryConfig.stripeSecretKey}
                                                onChange={(e) => handleConfigChange('payment', 'stripeSecretKey', e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-2 top-1/2 -translate-y-1/2"
                                                onClick={() => setShowSecrets(!showSecrets)}
                                            >
                                                {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="w-5 h-5" />
                                        Transaction Limits
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="max-amount">Maximum Transaction Amount (₦)</Label>
                                        <Input
                                            id="max-amount"
                                            type="number"
                                            value={categoryConfig.maxTransactionAmount}
                                            onChange={(e) => handleConfigChange('payment', 'maxTransactionAmount', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="min-amount">Minimum Transaction Amount (₦)</Label>
                                        <Input
                                            id="min-amount"
                                            type="number"
                                            value={categoryConfig.minTransactionAmount}
                                            onChange={(e) => handleConfigChange('payment', 'minTransactionAmount', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="fee-percentage">Transaction Fee (%)</Label>
                                        <Input
                                            id="fee-percentage"
                                            type="number"
                                            step="0.1"
                                            value={categoryConfig.transactionFeePercentage}
                                            onChange={(e) => handleConfigChange('payment', 'transactionFeePercentage', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="processing-fee">Processing Fee (₦)</Label>
                                        <Input
                                            id="processing-fee"
                                            type="number"
                                            value={categoryConfig.processingFee}
                                            onChange={(e) => handleConfigChange('payment', 'processingFee', parseInt(e.target.value))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="w-5 h-5" />
                                    Currency Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="default-currency">Default Currency</Label>
                                    <Select
                                        value={categoryConfig.defaultCurrency}
                                        onValueChange={(value) => handleConfigChange('payment', 'defaultCurrency', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categoryConfig.supportedCurrencies.map((currency: string) => (
                                                <SelectItem key={currency} value={currency}>
                                                    {currency}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Supported Currencies</Label>
                                    <div className="flex gap-2 mt-2">
                                        {categoryConfig.supportedCurrencies.map((currency: string) => (
                                            <Badge key={currency} variant="outline">
                                                {currency}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="w-5 h-5" />
                                        Email Configuration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="email-enabled">Email Notifications</Label>
                                        <input
                                            id="email-enabled"
                                            type="checkbox"
                                            checked={categoryConfig.emailEnabled}
                                            onChange={(e) => handleConfigChange('notifications', 'emailEnabled', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="smtp-host">SMTP Host</Label>
                                        <Input
                                            id="smtp-host"
                                            value={categoryConfig.smtpHost}
                                            onChange={(e) => handleConfigChange('notifications', 'smtpHost', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="smtp-port">SMTP Port</Label>
                                        <Input
                                            id="smtp-port"
                                            type="number"
                                            value={categoryConfig.smtpPort}
                                            onChange={(e) => handleConfigChange('notifications', 'smtpPort', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="max-emails">Max Daily Emails</Label>
                                        <Input
                                            id="max-emails"
                                            type="number"
                                            value={categoryConfig.maxDailyEmails}
                                            onChange={(e) => handleConfigChange('notifications', 'maxDailyEmails', parseInt(e.target.value))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Smartphone className="w-5 h-5" />
                                        SMS & Push Configuration
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="sms-enabled">SMS Notifications</Label>
                                        <input
                                            id="sms-enabled"
                                            type="checkbox"
                                            checked={categoryConfig.smsEnabled}
                                            onChange={(e) => handleConfigChange('notifications', 'smsEnabled', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="push-enabled">Push Notifications</Label>
                                        <input
                                            id="push-enabled"
                                            type="checkbox"
                                            checked={categoryConfig.pushEnabled}
                                            onChange={(e) => handleConfigChange('notifications', 'pushEnabled', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="sms-provider">SMS Provider</Label>
                                        <Select
                                            value={categoryConfig.smsProvider}
                                            onValueChange={(value) => handleConfigChange('notifications', 'smsProvider', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Twilio">Twilio</SelectItem>
                                                <SelectItem value="Nexmo">Nexmo</SelectItem>
                                                <SelectItem value="AWS SNS">AWS SNS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="max-sms">Max Daily SMS</Label>
                                        <Input
                                            id="max-sms"
                                            type="number"
                                            value={categoryConfig.maxDailySms}
                                            onChange={(e) => handleConfigChange('notifications', 'maxDailySms', parseInt(e.target.value))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lock className="w-5 h-5" />
                                        Password Policies
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="password-min-length">Minimum Length</Label>
                                        <Input
                                            id="password-min-length"
                                            type="number"
                                            value={categoryConfig.passwordMinLength}
                                            onChange={(e) => handleConfigChange('security', 'passwordMinLength', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="require-special">Require Special Characters</Label>
                                        <input
                                            id="require-special"
                                            type="checkbox"
                                            checked={categoryConfig.passwordRequireSpecialChars}
                                            onChange={(e) => handleConfigChange('security', 'passwordRequireSpecialChars', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="require-numbers">Require Numbers</Label>
                                        <input
                                            id="require-numbers"
                                            type="checkbox"
                                            checked={categoryConfig.passwordRequireNumbers}
                                            onChange={(e) => handleConfigChange('security', 'passwordRequireNumbers', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="require-uppercase">Require Uppercase</Label>
                                        <input
                                            id="require-uppercase"
                                            type="checkbox"
                                            checked={categoryConfig.passwordRequireUppercase}
                                            onChange={(e) => handleConfigChange('security', 'passwordRequireUppercase', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5" />
                                        Authentication Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="two-factor-required">Require 2FA</Label>
                                        <input
                                            id="two-factor-required"
                                            type="checkbox"
                                            checked={categoryConfig.twoFactorRequired}
                                            onChange={(e) => handleConfigChange('security', 'twoFactorRequired', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                                        <Input
                                            id="session-timeout"
                                            type="number"
                                            value={categoryConfig.sessionTimeoutMinutes}
                                            onChange={(e) => handleConfigChange('security', 'sessionTimeoutMinutes', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                                        <Input
                                            id="max-login-attempts"
                                            type="number"
                                            value={categoryConfig.maxLoginAttempts}
                                            onChange={(e) => handleConfigChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="lockout-minutes">Account Lockout (minutes)</Label>
                                        <Input
                                            id="lockout-minutes"
                                            type="number"
                                            value={categoryConfig.accountLockoutMinutes}
                                            onChange={(e) => handleConfigChange('security', 'accountLockoutMinutes', parseInt(e.target.value))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            case 'features':
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ToggleLeft className="w-5 h-5" />
                                Feature Toggle Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Feature</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Toggle</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(categoryConfig).map(([key, value]) => (
                                        <TableRow key={key}>
                                            <TableCell className="font-medium">
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {getFeatureDescription(key)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={value ? "default" : "secondary"}>
                                                    {value ? "Enabled" : "Disabled"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <input
                                                    type="checkbox"
                                                    checked={value as boolean}
                                                    onChange={(e) => handleConfigChange('features', key, e.target.checked)}
                                                    className="rounded"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                );

            case 'tenants':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Resource Limits
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="max-tenants">Max Tenants per Organization</Label>
                                        <Input
                                            id="max-tenants"
                                            type="number"
                                            value={categoryConfig.maxTenantsPerOrganization}
                                            onChange={(e) => handleConfigChange('tenants', 'maxTenantsPerOrganization', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="max-users-tenant">Max Users per Tenant</Label>
                                        <Input
                                            id="max-users-tenant"
                                            type="number"
                                            value={categoryConfig.maxUsersPerTenant}
                                            onChange={(e) => handleConfigChange('tenants', 'maxUsersPerTenant', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="max-storage">Max Storage per Tenant (MB)</Label>
                                        <Input
                                            id="max-storage"
                                            type="number"
                                            value={categoryConfig.maxStoragePerTenant}
                                            onChange={(e) => handleConfigChange('tenants', 'maxStoragePerTenant', parseInt(e.target.value))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="w-5 h-5" />
                                        Domain & Security
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="custom-domains">Allow Custom Domains</Label>
                                        <input
                                            id="custom-domains"
                                            type="checkbox"
                                            checked={categoryConfig.allowCustomDomains}
                                            onChange={(e) => handleConfigChange('tenants', 'allowCustomDomains', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="require-ssl">Require SSL Certificates</Label>
                                        <input
                                            id="require-ssl"
                                            type="checkbox"
                                            checked={categoryConfig.requireSslCertificates}
                                            onChange={(e) => handleConfigChange('tenants', 'requireSslCertificates', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="allow-data-export">Allow Data Export</Label>
                                        <input
                                            id="allow-data-export"
                                            type="checkbox"
                                            checked={categoryConfig.allowDataExport}
                                            onChange={(e) => handleConfigChange('tenants', 'allowDataExport', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="require-retention">Require Data Retention</Label>
                                        <input
                                            id="require-retention"
                                            type="checkbox"
                                            checked={categoryConfig.requireDataRetention}
                                            onChange={(e) => handleConfigChange('tenants', 'requireDataRetention', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            case 'system':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Database className="w-5 h-5" />
                                        Database & Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="db-pool-size">Database Connection Pool Size</Label>
                                        <Input
                                            id="db-pool-size"
                                            type="number"
                                            value={categoryConfig.databaseConnectionPoolSize}
                                            onChange={(e) => handleConfigChange('system', 'databaseConnectionPoolSize', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="cache-enabled">Enable Caching</Label>
                                        <input
                                            id="cache-enabled"
                                            type="checkbox"
                                            checked={categoryConfig.cacheEnabled}
                                            onChange={(e) => handleConfigChange('system', 'cacheEnabled', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="cache-ttl">Cache TTL (minutes)</Label>
                                        <Input
                                            id="cache-ttl"
                                            type="number"
                                            value={categoryConfig.cacheTtlMinutes}
                                            onChange={(e) => handleConfigChange('system', 'cacheTtlMinutes', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="max-upload">Max File Upload Size (MB)</Label>
                                        <Input
                                            id="max-upload"
                                            type="number"
                                            value={categoryConfig.maxFileUploadSize}
                                            onChange={(e) => handleConfigChange('system', 'maxFileUploadSize', parseInt(e.target.value))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="w-5 h-5" />
                                        System Operations
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="log-level">Log Level</Label>
                                        <Select
                                            value={categoryConfig.logLevel}
                                            onValueChange={(value) => handleConfigChange('system', 'logLevel', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="debug">Debug</SelectItem>
                                                <SelectItem value="info">Info</SelectItem>
                                                <SelectItem value="warn">Warning</SelectItem>
                                                <SelectItem value="error">Error</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="enable-metrics">Enable Metrics</Label>
                                        <input
                                            id="enable-metrics"
                                            type="checkbox"
                                            checked={categoryConfig.enableMetrics}
                                            onChange={(e) => handleConfigChange('system', 'enableMetrics', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="backup-enabled">Enable Backup</Label>
                                        <input
                                            id="backup-enabled"
                                            type="checkbox"
                                            checked={categoryConfig.backupEnabled}
                                            onChange={(e) => handleConfigChange('system', 'backupEnabled', e.target.checked)}
                                            className="rounded"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="session-secret">Session Secret</Label>
                                        <Input
                                            id="session-secret"
                                            type={showSecrets ? 'text' : 'password'}
                                            value={categoryConfig.sessionSecret}
                                            onChange={(e) => handleConfigChange('system', 'sessionSecret', e.target.value)}
                                            disabled
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );

            default:
                return <div>Select a configuration category</div>;
        }
    };

    // Get feature description
    const getFeatureDescription = (feature: string) => {
        const descriptions: Record<string, string> = {
            newDashboard: 'Enhanced dashboard with advanced analytics',
            advancedAnalytics: 'Advanced reporting and data insights',
            bulkPayments: 'Process multiple payments simultaneously',
            autoReminders: 'Automated payment and due date reminders',
            mobileApp: 'Mobile application access',
            apiAccess: 'REST API access for third-party integrations',
            webhooks: 'Real-time webhook notifications',
            customBranding: 'Custom logos and color schemes'
        };
        return descriptions[feature] || 'Feature configuration setting';
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-copay-navy flex items-center gap-2">
                            <Settings className="w-8 h-8 text-copay-blue" />
                            System Configuration
                        </h1>
                        <p className="text-copay-gray mt-1">
                            Manage system-wide settings, security policies, and feature configurations
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {unsavedChanges && (
                            <Button onClick={handleReset} variant="outline">
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Reset
                            </Button>
                        )}
                        <Button onClick={handleSave} disabled={loading || !unsavedChanges}>
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </Button>
                    </div>
                </div>

                {/* Unsaved Changes Warning */}
                {unsavedChanges && (
                    <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-4">
                            <div className="flex items-center gap-2 text-orange-800">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="font-medium">You have unsaved changes</span>
                            </div>
                            <p className="text-orange-700 text-sm mt-1">
                                Remember to save your configuration changes before leaving this page.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Configuration Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg">Configuration Categories</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {configCategories.map((category) => {
                                const Icon = category.icon;
                                const isActive = activeCategory === category.id;

                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => setActiveCategory(category.id)}
                                        className={`w-full text-left p-3 rounded-lg border transition-all ${isActive
                                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-md ${category.color}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium">{category.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {category.description}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-4">
                        {renderConfigSection()}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}