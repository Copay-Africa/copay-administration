'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import SecurityDashboard from '@/components/security/security-dashboard';

export default function SecurityAnalyticsPage() {
    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <SecurityDashboard />
            </div>
        </DashboardLayout>
    );
}