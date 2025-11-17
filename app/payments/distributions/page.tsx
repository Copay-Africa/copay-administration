/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api-client";
import type {
    MonthlyDistributionReport,
    PaymentDistributionSummary,
} from "@/types";
import {
    Calculator,
    DollarSign,
    TrendingUp,
    Download,
    Eye,
    RefreshCw,
    Calendar,
    Building2,
    AlertCircle
} from "lucide-react";
import { BalanceRedistribution } from "@/components/payments/balance-redistribution";

export default function PaymentDistributionsPage() {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const [monthlyReport, setMonthlyReport] = useState<MonthlyDistributionReport | null>(null);
    const [distributions, setDistributions] = useState<PaymentDistributionSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('distributions');

    // Load monthly report for selected month
    React.useEffect(() => {
        loadMonthlyReport();
    }, [currentMonth]);

    const loadMonthlyReport = async () => {
        setLoading(true);
        setError('');
        try {
            const [reportResponse, distributionsResponse] = await Promise.all([
                apiClient.paymentDistribution.getMonthlyReport(currentMonth),
                apiClient.paymentDistribution.getMonthlyDistributions({
                    month: currentMonth,
                    limit: 100
                })
            ]);

            setMonthlyReport(reportResponse as MonthlyDistributionReport);
            const distributionsData = distributionsResponse as any;
            setDistributions(distributionsData.data || []);
        } catch (err: any) {
            console.error('Failed to load monthly report:', err);
            setError(err?.message || 'Failed to load distribution data');
            setMonthlyReport(null);
            setDistributions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateDistribution = async () => {
        setCalculating(true);
        setError('');
        try {
            const result = await apiClient.paymentDistribution.calculateDistribution(currentMonth);
            console.log('Calculation result:', result);

            // Refresh the data after calculation
            await loadMonthlyReport();

            alert('Distribution calculated successfully! Check the updated amounts.');
        } catch (err: any) {
            console.error('Failed to calculate distribution:', err);
            setError(err?.message || 'Failed to calculate distribution');
        } finally {
            setCalculating(false);
        }
    };

    const handleProcessDistribution = async () => {
        if (!confirm(`Process distribution for ${currentMonth}? This action cannot be undone.`)) {
            return;
        }

        setProcessing(true);
        setError('');
        try {
            const result = await apiClient.paymentDistribution.processDistribution(currentMonth);
            console.log('Processing result:', result);

            // Refresh the data after processing
            await loadMonthlyReport();

            alert('Distribution processed successfully!');
        } catch (err: any) {
            console.error('Failed to process distribution:', err);
            setError(err?.message || 'Failed to process distribution');
        } finally {
            setProcessing(false);
        }
    };

    const handleExportReport = async () => {
        setExporting(true);
        try {
            const blob = await apiClient.paymentDistribution.exportDistribution(currentMonth);

            // Create download link
            const url = window.URL.createObjectURL(blob as Blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `distribution-report-${currentMonth}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            console.error('Failed to export report:', err);
            setError(err?.message || 'Failed to export report');
        } finally {
            setExporting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: PaymentDistributionSummary['status']) => {
        const variants = {
            PENDING: 'secondary',
            PROCESSED: 'default',
            DISTRIBUTED: 'default'
        } as const;

        const colors = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            PROCESSED: 'bg-blue-100 text-blue-800',
            DISTRIBUTED: 'bg-green-100 text-green-800'
        };

        return (
            <Badge className={colors[status]}>
                {status}
            </Badge>
        );
    };

    // Generate month options for the last 12 months
    const getMonthOptions = () => {
        const options = [];
        const now = new Date();

        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            options.push({ value, label });
        }

        return options;
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-copay-navy">Payment Distribution Management</h1>
                    <p className="text-copay-gray mt-2">
                        Manage monthly payment distributions to cooperatives
                    </p>
                </div>

                <div className="flex items-center space-x-4">
                    <Select value={currentMonth} onValueChange={setCurrentMonth}>
                        <SelectTrigger className="w-48">
                            <Calendar className="h-4 w-4" />
                            <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                            {getMonthOptions().map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        onClick={loadMonthlyReport}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2 text-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-lg border border-copay-light-gray">
                <div className="border-b border-copay-light-gray px-6">
                    <nav className="flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('distributions')}
                            className={`${activeTab === 'distributions'
                                ? 'border-copay-blue text-copay-blue'
                                : 'border-transparent text-copay-gray hover:text-copay-navy hover:border-copay-light-gray'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2`}
                        >
                            <TrendingUp className="h-4 w-4" />
                            <span>Monthly Distributions</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('redistribution')}
                            className={`${activeTab === 'redistribution'
                                ? 'border-copay-blue text-copay-blue'
                                : 'border-transparent text-copay-gray hover:text-copay-navy hover:border-copay-light-gray'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2`}
                        >
                            <AlertCircle className="h-4 w-4" />
                            <span>Balance Redistribution</span>
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'distributions' && (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                                        <DollarSign className="h-4 w-4 text-copay-blue" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-copay-navy">
                                            {monthlyReport ? formatCurrency(monthlyReport.totalCollected) : '---'}
                                        </div>
                                        <p className="text-xs text-copay-gray">
                                            From all payments this month
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">CoPay Fees</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">
                                            {monthlyReport ? formatCurrency(monthlyReport.totalFees) : '---'}
                                        </div>
                                        <p className="text-xs text-copay-gray">
                                            Transaction fees earned
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">To Distribute</CardTitle>
                                        <Building2 className="h-4 w-4 text-copay-blue" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-copay-blue">
                                            {monthlyReport ? formatCurrency(monthlyReport.totalDistributable) : '---'}
                                        </div>
                                        <p className="text-xs text-copay-gray">
                                            Amount for cooperatives
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Cooperatives</CardTitle>
                                        <Building2 className="h-4 w-4 text-copay-navy" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-copay-navy">
                                            {monthlyReport?.summary?.totalCooperatives || distributions.length || 0}
                                        </div>
                                        <p className="text-xs text-copay-gray">
                                            With payments this month
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Action Buttons */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Distribution Actions</CardTitle>
                                    <CardDescription>
                                        Calculate and process payment distributions for {new Date(`${currentMonth}-01`).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-4">
                                    <Button
                                        onClick={handleCalculateDistribution}
                                        disabled={calculating || loading}
                                        variant="outline"
                                    >
                                        <Calculator className="h-4 w-4 mr-2" />
                                        {calculating ? 'Calculating...' : 'Calculate Distribution'}
                                    </Button>

                                    <Button
                                        onClick={handleProcessDistribution}
                                        disabled={processing || loading || !distributions.length}
                                    >
                                        <TrendingUp className="h-4 w-4 mr-2" />
                                        {processing ? 'Processing...' : 'Process Distribution'}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={handleExportReport}
                                        disabled={exporting || loading || !distributions.length}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        {exporting ? 'Exporting...' : 'Export Report'}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Cooperative Distribution Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Cooperative Distributions</CardTitle>
                                    <CardDescription>
                                        Breakdown of amounts to be distributed to each cooperative
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <RefreshCw className="h-6 w-6 animate-spin text-copay-blue" />
                                            <span className="ml-2 text-copay-gray">Loading distribution data...</span>
                                        </div>
                                    ) : distributions.length === 0 ? (
                                        <div className="text-center py-8 text-copay-gray">
                                            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No distribution data found for {new Date(`${currentMonth}-01`).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                                            <p className="text-sm mt-2">Try calculating the distribution first.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {distributions.map((distribution) => (
                                                <div key={distribution.cooperativeId} className="border border-copay-light-gray rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <h3 className="font-semibold text-copay-navy">{distribution.cooperativeName}</h3>
                                                            <p className="text-sm text-copay-gray">Code: {distribution.cooperativeCode}</p>
                                                        </div>
                                                        {getStatusBadge(distribution.status)}
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-copay-gray">Base Amount</p>
                                                            <p className="font-semibold text-copay-blue">{formatCurrency(distribution.totalBaseAmount)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-copay-gray">Fees Collected</p>
                                                            <p className="font-semibold text-green-600">{formatCurrency(distribution.totalFees)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-copay-gray">Completed Payments</p>
                                                            <p className="font-semibold">{distribution.completedPaymentsCount}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-copay-gray">Pending Payments</p>
                                                            <p className="font-semibold text-amber-600">{distribution.pendingPaymentsCount}</p>
                                                        </div>
                                                    </div>

                                                    {distribution.lastDistributedAt && (
                                                        <div className="mt-3 pt-3 border-t border-copay-light-gray">
                                                            <p className="text-xs text-copay-gray">
                                                                Last distributed: {new Date(distribution.lastDistributedAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'redistribution' && (
                        <BalanceRedistribution onRefresh={loadMonthlyReport} />
                    )}
                </div>
            </div>
        </div>
    );
}