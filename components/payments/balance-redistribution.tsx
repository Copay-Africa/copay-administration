/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api-client";
import type {
    CooperativeBalance,
    CooperativeBalancesResponse,
} from "@/types";
import {
    RefreshCw,
    AlertTriangle,
    TrendingUp,
    Wallet,
    DollarSign,
    Users,
    Calendar,
} from "lucide-react";

interface BalanceRedistributionProps {
    onRefresh?: () => void;
}

export function BalanceRedistribution({ onRefresh }: BalanceRedistributionProps) {
    // Helper function to get current month in YYYY-MM format
    const getCurrentMonth = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    };

    const [cooperativeBalances, setCooperativeBalances] = useState<CooperativeBalance[]>([]);
    const [summary, setSummary] = useState<CooperativeBalancesResponse['summary'] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());

    const loadCooperativeBalances = useCallback(async (month?: string) => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.balanceRedistribution.getCooperativeBalances(month || selectedMonth);
            console.log('Cooperative balances response for month:', month || selectedMonth, response);
            
            // Check if response has the expected structure
            if (response && typeof response === 'object') {
                // Handle different possible response formats
                if (response.cooperatives && Array.isArray(response.cooperatives)) {
                    setCooperativeBalances(response.cooperatives);
                    setSummary(response.summary || null);
                } else if (Array.isArray(response)) {
                    // If response is directly an array of cooperatives
                    setCooperativeBalances(response);
                    setSummary(null);
                } else {
                    console.warn('Unexpected response format:', response);
                    setCooperativeBalances([]);
                    setSummary(null);
                    setError('Unexpected response format from server');
                }
            } else {
                console.warn('Invalid response:', response);
                setCooperativeBalances([]);
                setSummary(null);
                setError('Invalid response from server');
            }
        } catch (err: any) {
            console.error('Failed to load cooperative balances:', err);
            console.error('Error details:', {
                message: err?.message,
                response: err?.response?.data,
                status: err?.response?.status
            });
            setError(err?.response?.data?.message || err?.message || 'Failed to load cooperative balances');
            setCooperativeBalances([]);
            setSummary(null);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);    useEffect(() => {
        loadCooperativeBalances();
    }, [loadCooperativeBalances]);

    const handleRefresh = () => {
        loadCooperativeBalances(selectedMonth);
        onRefresh?.();
    };

    const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newMonth = event.target.value;
        setSelectedMonth(newMonth);
        if (newMonth) {
            loadCooperativeBalances(newMonth);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(dateString));
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge variant="default">Active</Badge>;
            case 'INACTIVE':
                return <Badge variant="secondary">Inactive</Badge>;
            case 'SUSPENDED':
                return <Badge variant="destructive">Suspended</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-3 sm:p-6">
                            <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-primary" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total Cooperatives
                                    </p>
                                    <p className="text-xl sm:text-2xl font-bold text-foreground">{summary.totalCooperatives}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-3 sm:p-6">
                            <div className="flex items-center space-x-2">
                                <Wallet className="h-4 w-4 text-primary" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total Balance
                                    </p>
                                    <p className="text-xl sm:text-2xl font-bold text-foreground">{formatCurrency(summary.totalBalance)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-3 sm:p-6">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total Revenue
                                    </p>
                                    <p className="text-xl sm:text-2xl font-bold text-foreground">{formatCurrency(summary.totalRevenue)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-3 sm:p-6">
                            <div className="flex items-center space-x-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Total Fees (Platform)
                                    </p>
                                    <p className="text-xl sm:text-2xl font-bold text-foreground">{formatCurrency(summary.totalFees)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div>
                            <CardTitle className="text-foreground text-base sm:text-lg">Cooperative Balances</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                View all cooperative balance information and payment statistics for {selectedMonth}
                            </CardDescription>
                        </div>
                        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <Label htmlFor="month-filter" className="text-sm font-medium">
                                    Month:
                                </Label>
                                <Input
                                    id="month-filter"
                                    type="month"
                                    value={selectedMonth}
                                    onChange={handleMonthChange}
                                    className="w-full sm:w-40"
                                />
                            </div>
                            <Button 
                                onClick={handleRefresh}
                                disabled={loading}
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>                <CardContent>
                    {error && (
                        <div className="mb-4 p-4 border border-destructive/20 bg-destructive/5 rounded-lg flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <span className="text-destructive">{error}</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                            <span>Loading cooperative balances...</span>
                        </div>
                    ) : (
                        <div className="table-mobile-scroll mobile-tap-highlight">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs sm:text-sm">Cooperative</TableHead>
                                        <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Code</TableHead>
                                        <TableHead className="text-xs sm:text-sm hidden md:table-cell">Status</TableHead>
                                        <TableHead className="text-xs sm:text-sm text-right">Balance</TableHead>
                                        <TableHead className="text-xs sm:text-sm text-right hidden lg:table-cell">Received</TableHead>
                                        <TableHead className="text-xs sm:text-sm text-right hidden lg:table-cell">Withdrawn</TableHead>
                                        <TableHead className="text-xs sm:text-sm text-right hidden xl:table-cell">Pending</TableHead>
                                        <TableHead className="text-xs sm:text-sm text-right hidden lg:table-cell">Payments</TableHead>
                                        <TableHead className="text-xs sm:text-sm text-right">Revenue</TableHead>
                                        <TableHead className="text-xs sm:text-sm text-right hidden lg:table-cell">Fees</TableHead>
                                        <TableHead className="text-xs sm:text-sm text-right hidden xl:table-cell">Avg Payment</TableHead>
                                        <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Last Payment</TableHead>
                                        <TableHead className="text-xs sm:text-sm sm:hidden">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cooperativeBalances.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                                                No cooperative balances found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        cooperativeBalances.map((item) => (
                                            <TableRow key={item.cooperative.id}>
                                                <TableCell className="font-medium p-2 sm:p-4">
                                                    <div>
                                                        <div className="font-medium text-xs sm:text-sm text-foreground">{item.cooperative.name}</div>
                                                        <div className="text-xs text-muted-foreground sm:hidden">
                                                            Code: {item.cooperative.code} • {getStatusBadge(item.cooperative.status)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground sm:hidden mt-1">
                                                            Payments: {item.stats.totalPayments.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell p-2 sm:p-4">
                                                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                        {item.cooperative.code}
                                                    </code>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell p-2 sm:p-4">
                                                    {getStatusBadge(item.cooperative.status)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-numeric p-2 sm:p-4">
                                                    <div className="text-xs sm:text-sm font-semibold text-foreground">
                                                        {formatCurrency(item.balance.currentBalance)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground sm:hidden">
                                                        Rcvd: {formatCurrency(item.balance.totalReceived)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono hidden lg:table-cell p-2 sm:p-4 text-xs sm:text-sm">
                                                    {formatCurrency(item.balance.totalReceived)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono hidden lg:table-cell p-2 sm:p-4 text-xs sm:text-sm">
                                                    {formatCurrency(item.balance.totalWithdrawn)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono hidden xl:table-cell p-2 sm:p-4 text-xs sm:text-sm">
                                                    {formatCurrency(item.balance.pendingBalance)}
                                                </TableCell>
                                                <TableCell className="text-right hidden lg:table-cell p-2 sm:p-4 text-xs sm:text-sm">
                                                    {item.stats.totalPayments.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-mono p-2 sm:p-4">
                                                    <div className="text-xs sm:text-sm font-semibold text-foreground">
                                                        {formatCurrency(item.stats.totalRevenue)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-secondary-foreground hidden lg:table-cell p-2 sm:p-4 text-xs sm:text-sm">
                                                    {formatCurrency(item.stats.totalFees)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono hidden xl:table-cell p-2 sm:p-4 text-xs sm:text-sm">
                                                    {formatCurrency(item.stats.averagePaymentAmount)}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm text-muted-foreground hidden lg:table-cell p-2 sm:p-4">
                                                    {formatDate(item.balance.lastPaymentAt)}
                                                </TableCell>
                                                <TableCell className="sm:hidden p-2">
                                                    <Button size="sm" variant="outline" className="text-xs">
                                                        Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}