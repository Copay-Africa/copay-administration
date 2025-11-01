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
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { Payment, PaymentFilters } from '@/types';

/**
 * Payments Management Page
 * Monitor and track all payment transactions across the platform
 */

// Mock payment data
const mockPayments: Payment[] = [
  {
    id: 'PAY-001',
    organizationId: '1',
    organization: {
      id: '1',
      name: 'Kigali Workers Cooperative',
      registrationNumber: 'KWC-2023-001',
    } as any,
    amount: 50000,
    currency: 'RWF',
    status: 'PAID',
    paymentMethod: 'MOBILE_MONEY',
    transactionId: 'MTN-789456123',
    description: 'Monthly subscription - Premium Plan',
    dueDate: '2024-01-31T23:59:59Z',
    paidAt: '2024-01-30T14:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'PAY-002',
    organizationId: '2',
    organization: {
      id: '2',
      name: 'Nyagatare Farmers Union',
      registrationNumber: 'NFU-2023-002',
    } as any,
    amount: 25000,
    currency: 'RWF',
    status: 'PENDING',
    paymentMethod: 'MOBILE_MONEY',
    transactionId: 'TIG-456789012',
    description: 'Monthly subscription - Standard Plan',
    dueDate: '2024-02-01T23:59:59Z',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'PAY-003',
    organizationId: '3',
    organization: {
      id: '3',
      name: 'Ubuzima Health Cooperative',
      registrationNumber: 'UHC-2023-003',
    } as any,
    amount: 25000,
    currency: 'RWF',
    status: 'FAILED',
    paymentMethod: 'MOBILE_MONEY',
    transactionId: 'MTN-234567890',
    description: 'Monthly subscription - Standard Plan',
    dueDate: '2024-01-31T23:59:59Z',
    createdAt: '2024-01-01T00:00:00Z',
    failureReason: 'Insufficient funds',
  },
];

function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined,
  });

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setPayments(mockPayments);
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [filters]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">Paid</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'REFUNDED':
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidAmount = payments.filter(p => p.status === 'PAID').reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'PENDING').reduce((sum, payment) => sum + payment.amount, 0);

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-copay-gray">
                Total Payments
              </CardTitle>
              <DollarSign className="h-4 w-4 text-copay-gray" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-copay-navy">
                {formatCurrency(totalAmount)}
              </div>
              <p className="text-xs text-copay-gray">
                {formatNumber(payments.length)} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-copay-gray">
                Successful Payments
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-copay-navy">
                {formatCurrency(paidAmount)}
              </div>
              <p className="text-xs text-copay-gray">
                {payments.filter(p => p.status === 'PAID').length} paid
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
                {formatCurrency(pendingAmount)}
              </div>
              <p className="text-xs text-copay-gray">
                {payments.filter(p => p.status === 'PENDING').length} pending
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
                {payments.length > 0 
                  ? Math.round((payments.filter(p => p.status === 'PAID').length / payments.length) * 100)
                  : 0
                }%
              </div>
              <p className="text-xs text-copay-gray">
                Payment success rate
              </p>
            </CardContent>
          </Card>
        </div>

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
                setFilters(prev => ({ ...prev, status: status === 'all' ? undefined : status as any }))
              }>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Organization</TableHead>
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
                            {payment.id}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-copay-navy">
                              {payment.organization.name}
                            </div>
                            <div className="text-sm text-copay-gray">
                              {payment.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-copay-navy">
                            {formatCurrency(payment.amount)}
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
                              {payment.paymentMethod.replace('_', ' ')}
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
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {payments.length === 0 && (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-copay-gray mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-copay-navy mb-2">
                      No payments found
                    </h3>
                    <p className="text-copay-gray">
                      Payment transactions will appear here once organizations start making payments
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