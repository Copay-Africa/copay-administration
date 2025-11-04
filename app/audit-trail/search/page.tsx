'use client';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { AuditSearch } from '@/components/audit/audit-search';

export default function AuditSearchPage() {
    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <AuditSearch />
            </div>
        </DashboardLayout>
    );
}