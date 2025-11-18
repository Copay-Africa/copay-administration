"use client"

import * as React from "react";
import DashboardLayout from '@/components/layout/dashboard-layout';
import { withAuth } from "@/context/auth-context";
import { BalanceRedistribution } from "@/components/payments/balance-redistribution";

function PaymentDistributionsPage() {
    const loadMonthlyReport = async () => {
        // This function is kept for compatibility with BalanceRedistribution component
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-copay-navy">Balance Redistribution</h1>
                        <p className="text-copay-gray mt-1">
                            Manage payment balance redistribution between cooperatives
                        </p>
                    </div>
                </div>

                {/* Balance Redistribution Content */}
                <BalanceRedistribution onRefresh={loadMonthlyReport} />
            </div>
        </DashboardLayout>
    );
}

export default withAuth(PaymentDistributionsPage);