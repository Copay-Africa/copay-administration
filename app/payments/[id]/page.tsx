'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    CreditCard,
    User,
    Building2,
    Phone,
    Mail,
    Hash,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Loader2,
    Copy,
    Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from '@/context/auth-context';
import { formatNumber } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { Payment } from '@/types';

/**
 * Payment Details Page
 * View detailed information about a specific payment transaction
 */

function PaymentDetailsPage() {
    const params = useParams();
    const [payment, setPayment] = useState<Payment | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const paymentId = params?.id as string;

    useEffect(() => {
        const fetchPayment = async () => {
            if (!paymentId) {
                setError('No payment ID provided');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');
            try {
                console.log('Fetching payment with ID:', paymentId);
                const response = await apiClient.payments.getOrganizationPaymentById(paymentId);

                if (response && typeof response === 'object') {
                    const paymentData = response as Payment;
                    if (paymentData.id) {
                        setPayment(paymentData);
                        console.log('Successfully loaded payment:', paymentData.paymentReference);
                    } else {
                        setError('Invalid payment data received');
                    }
                } else {
                    setError('Payment not found');
                }
            } catch (err) {
                console.error('Failed to fetch payment:', err);
                setError('Failed to load payment details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchPayment();
    }, [paymentId]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'FAILED':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'PENDING':
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case 'PROCESSING':
                return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
            case 'TIMEOUT':
                return <AlertCircle className="h-5 w-5 text-orange-500" />;
            default:
                return <Clock className="h-5 w-5 text-gray-500" />;
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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast notification here
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-copay-navy" />
                        <p className="text-copay-gray">Loading payment details...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !payment) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" asChild>
                            <Link href="/payments">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Payments
                            </Link>
                        </Button>
                    </div>

                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                            <h3 className="text-lg font-medium text-copay-navy mb-2">
                                Payment Not Found
                            </h3>
                            <p className="text-copay-gray mb-4">
                                {error || 'The payment you are looking for does not exist or has been removed.'}
                            </p>
                            <Button asChild>
                                <Link href="/payments">Return to Payments</Link>
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
                            <div className="flex items-center space-x-3">
                                <h1 className="text-2xl font-bold text-copay-navy">
                                    Payment Details
                                </h1>
                                {getStatusBadge(payment.status)}
                            </div>
                            <p className="text-copay-gray">
                                Reference: {payment.paymentReference}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment Overview */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Payment Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <CreditCard className="h-5 w-5" />
                                <span>Payment Information</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-copay-gray">Amount</span>
                                <span className="text-2xl font-bold text-copay-navy">
                                    RWF {formatNumber(payment.amount)}
                                </span>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-copay-gray">Payment Type</span>
                                    <span className="text-sm font-medium">{payment.paymentType.name}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-sm text-copay-gray">Payment Method</span>
                                    <span className="text-sm font-medium">{getPaymentMethodName(payment.paymentMethod)}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-sm text-copay-gray">Status</span>
                                    <div className="flex items-center space-x-2">
                                        {getStatusIcon(payment.status)}
                                        <span className="text-sm font-medium">{payment.status}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-copay-gray">Reference</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-mono">{payment.paymentReference}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(payment.paymentReference)}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-sm text-copay-gray">Created</span>
                                    <span className="text-sm">{new Date(payment.createdAt).toLocaleString()}</span>
                                </div>

                                {payment.paidAt && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-copay-gray">Paid At</span>
                                        <span className="text-sm">{new Date(payment.paidAt).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sender Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <User className="h-5 w-5" />
                                <span>Sender Information</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-copay-gray">Full Name</label>
                                <p className="text-copay-navy font-medium">
                                    {payment.sender.firstName} {payment.sender.lastName}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-copay-gray">Phone Number</label>
                                <div className="flex items-center space-x-2">
                                    <Phone className="h-4 w-4 text-copay-gray" />
                                    <p className="text-copay-navy">{payment.sender.phone}</p>
                                </div>
                            </div>

                            {payment.sender.email && (
                                <div>
                                    <label className="text-sm font-medium text-copay-gray">Email</label>
                                    <div className="flex items-center space-x-2">
                                        <Mail className="h-4 w-4 text-copay-gray" />
                                        <p className="text-copay-navy">{payment.sender.email}</p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-copay-gray">Cooperative</label>
                                <div className="flex items-center space-x-2">
                                    <Building2 className="h-4 w-4 text-copay-gray" />
                                    <div>
                                        <p className="text-copay-navy font-medium">{payment.cooperative.name}</p>
                                        <p className="text-sm text-copay-gray">{payment.cooperative.code}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transaction History */}
                {payment.transactions && payment.transactions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Activity className="h-5 w-5" />
                                <span>Transaction History</span>
                            </CardTitle>
                            <CardDescription>
                                Detailed transaction processing history for this payment
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {payment.transactions.map((transaction) => (
                                    <div key={transaction.id} className="border-l-2 border-gray-200 pl-4 pb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(transaction.status)}
                                                <span className="font-medium">{transaction.status}</span>
                                                {getStatusBadge(transaction.status)}
                                            </div>
                                            <span className="text-sm text-copay-gray">
                                                {new Date(transaction.createdAt).toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-copay-gray">Amount:</span>
                                                <span className="ml-2 font-medium">RWF {formatNumber(transaction.amount)}</span>
                                            </div>
                                            <div>
                                                <span className="text-copay-gray">Method:</span>
                                                <span className="ml-2">{getPaymentMethodName(transaction.paymentMethod)}</span>
                                            </div>
                                            {transaction.gatewayTransactionId && (
                                                <div className="col-span-2">
                                                    <span className="text-copay-gray">Gateway ID:</span>
                                                    <span className="ml-2 font-mono text-sm">{transaction.gatewayTransactionId}</span>
                                                </div>
                                            )}
                                            {transaction.failureReason && (
                                                <div className="col-span-2 text-red-600">
                                                    <span className="text-copay-gray">Failure Reason:</span>
                                                    <span className="ml-2">{transaction.failureReason}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Payment Type Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Hash className="h-5 w-5" />
                            <span>Payment Type Details</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-copay-gray">Type Name</label>
                            <p className="text-copay-navy font-medium">{payment.paymentType.name}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-copay-gray">Description</label>
                            <p className="text-copay-navy">{payment.paymentType.description}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-copay-gray">Payment Description</label>
                            <p className="text-copay-navy">{payment.description}</p>
                        </div>

                        {payment.paymentType.amount && (
                            <div>
                                <label className="text-sm font-medium text-copay-gray">Expected Amount</label>
                                <p className="text-copay-navy">
                                    RWF {formatNumber(payment.paymentType.amount)}
                                    {payment.paymentType.amountType && (
                                        <span className="text-sm text-copay-gray ml-2">
                                            ({payment.paymentType.amountType})
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

export default withAuth(PaymentDetailsPage);