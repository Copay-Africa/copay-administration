'use client';

import { useState, useEffect } from 'react';
import { 
  Search,
  Filter,
  Download,
  CreditCard,
  DollarSign,
  TrendingUp,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { formatNumber } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { Payment, PaymentFilters, PaymentStats } from '@/types';

/**
 * Payments Management Page
 * Monitor and track organization payment transactions
 */

function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    limit: 20,
    search: '',
    status: undefined,
  });

  useEffect(() => {
    const fetchPaymentsAndStats = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch payments and stats in parallel
        const [paymentsResponse, statsResponse] = await Promise.all([
          apiClient.payments.getOrganizationPayments(filters),
          apiClient.payments.getOrganizationStats()
        ]);

        setPayments((paymentsResponse.data as Payment[]) || []);
        setStats(statsResponse as PaymentStats);
      } catch (err) {
        console.error('Failed to fetch payments:', err);
        setError('Failed to load payments. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentsAndStats();
  }, [filters]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'TIMEOUT':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'PROCESSING':
        return <Badge variant="secondary">Processing</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'TIMEOUT':
        return <Badge variant="outline">Timeout</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'MOBILE_MONEY_MTN':
        return 'MTN MoMo';
      case 'MOBILE_MONEY_AIRTEL':
        return 'Airtel Money';
      case 'BANK_BK':
        return 'Bank of Kigali';
      case 'BANK_TRANSFER':
        return 'Bank Transfer';
      case 'CREDIT_CARD':
        return 'Credit Card';
      default:
        return method.replace(/_/g, ' ');
    }
  };

  // Calculate statistics from API stats or fallback to local calculation
  const totalAmount = stats?.summary.totalAmount || payments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedAmount = stats?.statusBreakdown.find(s => s.status === 'COMPLETED')?.totalAmount || 
    payments.filter(p => p.status === 'COMPLETED').reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = stats?.statusBreakdown.find(s => s.status === 'PENDING')?.totalAmount || 
    payments.filter(p => p.status === 'PENDING').reduce((sum, payment) => sum + payment.amount, 0);
  const totalPayments = stats?.summary.totalPayments || payments.length;
  const completedPayments = stats?.statusBreakdown.find(s => s.status === 'COMPLETED')?.count || 
    payments.filter(p => p.status === 'COMPLETED').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-copay-navy">Payments</h1>
            <p className="text-copay-gray">
              Monitor subscription payments and transaction history
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Payment Statistics */}
        {error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-copay-navy mb-2">Failed to load payments</h3>
              <p className="text-copay-gray mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-copay-gray">
                  Total Amount
                </CardTitle>
                <DollarSign className="h-4 w-4 text-copay-gray" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-copay-navy">
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                  ) : (
                    `RWF ${formatNumber(totalAmount)}`
                  )}
                </div>
                <p className="text-xs text-copay-gray">
                  {loading ? (
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16 mt-1"></div>
                  ) : (
                    `${formatNumber(totalPayments)} transactions`
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-copay-gray">
                  Completed Payments
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-copay-navy">
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                  ) : (
                    `RWF ${formatNumber(completedAmount)}`
                  )}
                </div>
                <p className="text-xs text-copay-gray">
                  {loading ? (
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16 mt-1"></div>
                  ) : (
                    `${formatNumber(completedPayments)} completed`
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-copay-gray">
                  Pending Payments
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-copay-navy">
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
                  ) : (
                    `RWF ${formatNumber(pendingAmount)}`
                  )}
                </div>
                <p className="text-xs text-copay-gray">
                  {loading ? (
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-16 mt-1"></div>
                  ) : (
                    `${formatNumber(stats?.statusBreakdown.find(s => s.status === 'PENDING')?.count || 0)} pending`
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-copay-gray">
                  Success Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-copay-navy">
                  {loading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                  ) : (
                    `${totalPayments > 0 ? Math.round((completedPayments / totalPayments) * 100) : 0}%`
                  )}
                </div>
                <p className="text-xs text-copay-gray">
                  Payment success rate
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-copay-navy">Payment Transactions</CardTitle>
            <CardDescription>
              All payment transactions across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-copay-gray" />
                <Input
                  placeholder="Search payments..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <Select value={filters.status || 'all'} onValueChange={(status) => 
                setFilters(prev => ({ ...prev, status: status === 'all' ? undefined : status as typeof filters.status }))
              }>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="TIMEOUT">Timeout</SelectItem>
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
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {payment.paymentReference}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-copay-navy">
                              {payment.sender.firstName} {payment.sender.lastName}
                            </div>
                            <div className="text-sm text-copay-gray">
                              {payment.sender.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-copay-navy">
                              {payment.paymentType.name}
                            </div>
                            <div className="text-sm text-copay-gray">
                              {payment.cooperative.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-copay-navy">
                            RWF {formatNumber(payment.amount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(payment.status)}
                            {getStatusBadge(payment.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 text-copay-gray mr-2" />
                            <span className="text-sm">
                              {getPaymentMethodName(payment.paymentMethod)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-copay-gray">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/payments/${payment.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {!loading && payments.length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-copay-gray mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-copay-navy mb-2">
                      No payments found
                    </h3>
                    <p className="text-copay-gray">
                      {filters.search || filters.status 
                        ? 'No payments match your current filters. Try adjusting your search criteria.'
                        : 'Payment transactions will appear here once members start making payments to their cooperatives.'
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

export default withAuth(PaymentsPage);