'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { withAuth } from '@/context/auth-context';

function CreateReminderPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push('/reminders');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-copay-gray">
              Super administrators cannot create new reminders. This functionality is restricted to maintain system integrity.
            </p>
            <p className="text-sm text-copay-gray">
              You can view and manage existing reminders from the reminders overview page.
            </p>
            <div className="flex justify-center space-x-4 pt-4">
              <Button onClick={() => router.push('/reminders')}>
                Go to Reminders
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
            </div>
            <p className="text-xs text-copay-gray">
              You will be redirected automatically in a few seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(CreateReminderPage);