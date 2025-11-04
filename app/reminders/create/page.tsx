'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { withAuth } from '@/context/auth-context';

/**
 * Create Reminder Page
 * Form for creating automated payment reminders
 */

interface ReminderFormData {
  title: string;
  description: string;
  type: ReminderType;
  paymentTypeId: string;
  reminderDate: string;
  reminderTime: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  notificationTypes: NotificationType[];
  advanceNoticeDays: number;
  customAmount?: number;
  notes?: string;
  cooperativeId?: string;
}

function CreateReminderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    description: '',
    type: 'PAYMENT_DUE',
    paymentTypeId: '',
    reminderDate: '',
    reminderTime: '09:00',
    isRecurring: false,
    notificationTypes: ['IN_APP'],
    advanceNoticeDays: 3,
    notes: '',
  });

  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [cooperatives, setCooperatives] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    setLoading(true);
    try {
      const [paymentTypesResponse, cooperativesResponse] = await Promise.all([
        apiClient.paymentTypes.getAll(),
        apiClient.organizations.getAll({ limit: 100 })
      ]);

      setPaymentTypes((paymentTypesResponse.data || paymentTypesResponse) as PaymentType[]);
      setCooperatives((cooperativesResponse.data || cooperativesResponse) as Organization[]);
    } catch (err) {
      console.error('Failed to fetch form data:', err);
      setError('Failed to load form data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ReminderFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleNotificationTypeChange = (type: NotificationType, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      notificationTypes: checked 
        ? [...prev.notificationTypes, type]
        : prev.notificationTypes.filter(t => t !== type)
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.paymentTypeId && formData.type !== 'CUSTOM') {
      setError('Payment type is required for payment reminders');
      return false;
    }
    if (!formData.reminderDate) {
      setError('Reminder date is required');
      return false;
    }
    if (formData.notificationTypes.length === 0) {
      setError('At least one notification type must be selected');
      return false;
    }
    if (formData.advanceNoticeDays < 0 || formData.advanceNoticeDays > 30) {
      setError('Advance notice days must be between 0 and 30');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');

    try {
      // Combine date and time
      const reminderDateTime = new Date(`${formData.reminderDate}T${formData.reminderTime}`).toISOString();

      const reminderData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        paymentTypeId: formData.paymentTypeId || undefined,
        reminderDate: reminderDateTime,
        isRecurring: formData.isRecurring,
        recurringPattern: formData.isRecurring ? formData.recurringPattern : undefined,
        notificationTypes: formData.notificationTypes,
        advanceNoticeDays: formData.advanceNoticeDays,
        customAmount: formData.customAmount || undefined,
        notes: formData.notes?.trim() || undefined,
        cooperativeId: formData.cooperativeId || undefined,
      };

      await apiClient.reminders.create(reminderData);
      
      setSuccess('Reminder created successfully!');
      
      // Redirect after success
      setTimeout(() => {
        router.push('/reminders');
      }, 2000);

    } catch (err) {
      console.error('Failed to create reminder:', err);
      const errorMessage = (err as Error)?.message || 'Failed to create reminder. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/reminders">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reminders
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-copay-navy">Create Reminder</h1>
              <p className="text-copay-gray">
                Set up automated payment reminders and notifications
              </p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center space-x-2 py-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-700">{success}</span>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center space-x-2 py-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Set up the basic details for your reminder
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Reminder Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Monthly Rent Payment"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Reminder Type *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => handleInputChange('type', value as ReminderType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAYMENT_DUE">Payment Due</SelectItem>
                      <SelectItem value="PAYMENT_OVERDUE">Payment Overdue</SelectItem>
                      <SelectItem value="CUSTOM">Custom Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what this reminder is for..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {formData.type !== 'CUSTOM' && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentType">Payment Type *</Label>
                    <Select 
                      value={formData.paymentTypeId} 
                      onValueChange={(value) => handleInputChange('paymentTypeId', value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} - {type.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="cooperative">Target Cooperative</Label>
                  <Select 
                    value={formData.cooperativeId || 'all'} 
                    onValueChange={(value) => handleInputChange('cooperativeId', value === 'all' ? undefined : value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cooperative" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cooperatives</SelectItem>
                      {cooperatives.map((coop) => (
                        <SelectItem key={coop.id} value={coop.id}>
                          {coop.name} ({coop.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduling
              </CardTitle>
              <CardDescription>
                Configure when and how often the reminder should be sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="reminderDate">Reminder Date *</Label>
                  <Input
                    id="reminderDate"
                    type="date"
                    value={formData.reminderDate}
                    onChange={(e) => handleInputChange('reminderDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminderTime">Reminder Time *</Label>
                  <Input
                    id="reminderTime"
                    type="time"
                    value={formData.reminderTime}
                    onChange={(e) => handleInputChange('reminderTime', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advanceNoticeDays">Advance Notice (Days)</Label>
                  <Input
                    id="advanceNoticeDays"
                    type="number"
                    min="0"
                    max="30"
                    value={formData.advanceNoticeDays}
                    onChange={(e) => handleInputChange('advanceNoticeDays', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isRecurring">Make this a recurring reminder</Label>
                </div>

                {formData.isRecurring && (
                  <div className="space-y-2">
                    <Label htmlFor="recurringPattern">Recurring Pattern</Label>
                    <Select 
                      value={formData.recurringPattern || 'MONTHLY'} 
                      onValueChange={(value) => handleInputChange('recurringPattern', value as RecurringPattern)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Choose how users will be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Notification Types *</Label>
                <div className="grid gap-2 md:grid-cols-4 mt-2">
                  {(['SMS', 'EMAIL', 'IN_APP', 'PUSH'] as NotificationType[]).map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`notification-${type}`}
                        checked={formData.notificationTypes.includes(type)}
                        onChange={(e) => handleNotificationTypeChange(type, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`notification-${type}`} className="text-sm">
                        {type.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customAmount">Custom Amount (Optional)</Label>
                <Input
                  id="customAmount"
                  type="number"
                  min="0"
                  placeholder="Enter amount in RWF"
                  value={formData.customAmount || ''}
                  onChange={(e) => handleInputChange('customAmount', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional information or instructions..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/reminders">Cancel</Link>
            </Button>
            <Button 
              type="submit" 
              disabled={submitting || loading}
              className="min-w-32"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Reminder
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(CreateReminderPage);