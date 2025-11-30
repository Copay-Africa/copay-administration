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
            <div className="space-y-6 p-1 sm:p-0"> {/* Add subtle padding on mobile */}
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Balance Redistribution</h1>
                        <p className="text-sm sm:text-base text-muted-foreground mt-1">
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