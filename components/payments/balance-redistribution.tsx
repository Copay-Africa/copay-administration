"use client"

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import type {
    PendingRedistribution,
    PendingRedistributionsResponse,
    BalanceRedistributionResult,
    BatchRedistributionResult,
} from "@/types";
import {
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Users,
    DollarSign,
    Calculator,
    Download,
    Calendar,
    Building2,
    Trash2,
    Plus,
} from "lucide-react";

interface BalanceRedistributionProps {
    onRefresh?: () => void;
}

export function BalanceRedistribution({ onRefresh }: BalanceRedistributionProps) {
    const [pendingPayments, setPendingPayments] = useState<PendingRedistribution[]>([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filters, setFilters] = useState({
        cooperativeId: '',
        limit: 50,
        offset: 0,
        fromDate: '',
        toDate: '',
    });
    const [summary, setSummary] = useState<PendingRedistributionsResponse['summary'] | null>(null);

    React.useEffect(() => {
        loadPendingRedistributions();
    }, [filters.cooperativeId, filters.fromDate, filters.toDate]);

    const loadPendingRedistributions = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.balanceRedistribution.getPendingRedistributions(filters);
            const data = response as PendingRedistributionsResponse;
            setPendingPayments(data.data);
            setSummary(data.summary);
        } catch (err: any) {
            console.error('Failed to load pending redistributions:', err);
            setError(err?.message || 'Failed to load pending redistributions');
            setPendingPayments([]);
            setSummary(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSingleRedistribute = async (paymentId: string) => {
        if (!confirm('Redistribute balance for this payment? This action cannot be undone.')) {
            return;
        }

        setProcessing(true);
        setError('');
        setSuccess('');

        try {
            const result = await apiClient.balanceRedistribution.redistributePayment(paymentId);
            const redistribution = result as BalanceRedistributionResult;
            
            setSuccess(`Payment ${paymentId} redistributed successfully! Base amount: ${formatCurrency(redistribution.baseAmount)}, Platform fee: ${formatCurrency(redistribution.platformFee)}`);
            
            // Refresh data
            await loadPendingRedistributions();
            onRefresh?.();
        } catch (err: any) {
            console.error('Failed to redistribute payment:', err);
            setError(err?.message || 'Failed to redistribute payment');
        } finally {
            setProcessing(false);
        }
    };

    const handleBatchRedistribute = async () => {
        if (selectedPayments.length === 0) {
            setError('Please select at least one payment to redistribute');
            return;
        }

        if (!confirm(`Redistribute balance for ${selectedPayments.length} selected payments? This action cannot be undone.`)) {
            return;
        }

        setProcessing(true);
        setError('');
        setSuccess('');

        try {
            const result = await apiClient.balanceRedistribution.batchRedistribute({
                paymentIds: selectedPayments
            });
            const batchResult = result as BatchRedistributionResult;
            
            setSuccess(`Batch redistribution completed! ${batchResult.successCount}/${batchResult.processedCount} payments processed successfully. Total base amount: ${formatCurrency(batchResult.totalBaseAmount)}, Total platform fees: ${formatCurrency(batchResult.totalPlatformFees)}`);
            setSelectedPayments([]);
            
            // Refresh data
            await loadPendingRedistributions();
            onRefresh?.();
        } catch (err: any) {
            console.error('Failed to process batch redistribution:', err);
            setError(err?.message || 'Failed to process batch redistribution');
        } finally {
            setProcessing(false);
        }
    };

    const togglePaymentSelection = (paymentId: string) => {
        setSelectedPayments(prev => 
            prev.includes(paymentId)
                ? prev.filter(id => id !== paymentId)
                : [...prev, paymentId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedPayments.length === pendingPayments.length) {
            setSelectedPayments([]);
        } else {
            setSelectedPayments(pendingPayments.map(p => p.id));
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getEstimatedBaseAmount = (amount: number) => {
        return amount - 500; // Standard platform fee of 500 RWF
    };

    const getDateRangeOptions = () => {
        const now = new Date();
        return [
            { 
                value: '',
                label: 'All time'
            },
            {
                value: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
                label: 'Last month'
            },
            {
                value: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0],
                label: 'Last 3 months'
            },
            {
                value: new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0],
                label: 'Last 6 months'
            }
        ];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <span>Balance Redistribution Management</span>
                    </CardTitle>
                    <CardDescription>
                        Manage legacy payments and manual balance corrections for cooperative distributions
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="cooperative">Cooperative (Optional)</Label>
                            <Input
                                id="cooperative"
                                placeholder="Cooperative ID"
                                value={filters.cooperativeId}
                                onChange={(e) => setFilters(prev => ({ ...prev, cooperativeId: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="fromDate">From Date</Label>
                            <Input
                                id="fromDate"
                                type="date"
                                value={filters.fromDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="toDate">To Date</Label>
                            <Input
                                id="toDate"
                                type="date"
                                value={filters.toDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <Button variant="outline" onClick={loadPendingRedistributions} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>

                        {selectedPayments.length > 0 && (
                            <Button onClick={handleBatchRedistribute} disabled={processing}>
                                <Calculator className="h-4 w-4 mr-2" />
                                {processing ? 'Processing...' : `Redistribute ${selectedPayments.length} Selected`}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Status Messages */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2 text-red-800">
                            <XCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {success && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2 text-green-800">
                            <CheckCircle className="h-4 w-4" />
                            <span>{success}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Summary */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">
                                {formatCurrency(summary.totalPendingAmount)}
                            </div>
                            <p className="text-xs text-copay-gray">
                                {summary.affectedPayments} payments
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Est. Platform Fees</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(summary.estimatedPlatformFees)}
                            </div>
                            <p className="text-xs text-copay-gray">
                                To be collected
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Est. Base Amount</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-copay-blue">
                                {formatCurrency(summary.estimatedBaseAmount)}
                            </div>
                            <p className="text-xs text-copay-gray">
                                To cooperatives
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Selected</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-copay-navy">
                                {selectedPayments.length}
                            </div>
                            <p className="text-xs text-copay-gray">
                                Payments selected
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Pending Redistributions Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Pending Redistributions</CardTitle>
                            <CardDescription>
                                Legacy payments that need balance redistribution
                            </CardDescription>
                        </div>
                        {pendingPayments.length > 0 && (
                            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                                {selectedPayments.length === pendingPayments.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin text-copay-blue" />
                            <span className="ml-2 text-copay-gray">Loading pending redistributions...</span>
                        </div>
                    ) : pendingPayments.length === 0 ? (
                        <div className="text-center py-8 text-copay-gray">
                            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                            <p>No pending redistributions found</p>
                            <p className="text-sm mt-2">All payments are up to date with balance calculations.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingPayments.map((payment) => (
                                <div key={payment.id} className="border border-copay-light-gray rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedPayments.includes(payment.id)}
                                                onChange={() => togglePaymentSelection(payment.id)}
                                                className="h-4 w-4 text-copay-blue focus:ring-copay-blue border-copay-light-gray rounded"
                                            />
                                            <div>
                                                <h3 className="font-semibold text-copay-navy">Payment #{payment.id.slice(-8)}</h3>
                                                <p className="text-sm text-copay-gray">{payment.paymentType.name}</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-amber-100 text-amber-800">
                                            Needs Redistribution
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                                        <div>
                                            <p className="text-copay-gray">Total Amount</p>
                                            <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-copay-gray">Est. Base Amount</p>
                                            <p className="font-semibold text-copay-blue">{formatCurrency(getEstimatedBaseAmount(payment.amount))}</p>
                                        </div>
                                        <div>
                                            <p className="text-copay-gray">Sender</p>
                                            <p className="font-semibold">{payment.sender.firstName} {payment.sender.lastName}</p>
                                        </div>
                                        <div>
                                            <p className="text-copay-gray">Cooperative</p>
                                            <p className="font-semibold">{payment.cooperative.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-copay-light-gray">
                                        <div>
                                            <p className="text-xs text-amber-600 font-medium">{payment.reason}</p>
                                            <p className="text-xs text-copay-gray">
                                                Paid: {new Date(payment.paidAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSingleRedistribute(payment.id)}
                                            disabled={processing}
                                        >
                                            <Calculator className="h-4 w-4 mr-2" />
                                            Redistribute
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default BalanceRedistribution;