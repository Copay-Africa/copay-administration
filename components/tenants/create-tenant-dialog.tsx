'use client';

import { useState, useEffect } from 'react';
import { 
  UserPlus,
  Building2,
  Phone,
  User,
  Lock,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import type { CreateTenantRequest } from '@/types';

/**
 * Create Tenant Dialog Component
 * Super Admin modal for creating new tenant accounts
 */

interface Cooperative {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface CreateTenantDialogProps {
  onTenantCreated?: () => void;
  children: React.ReactNode;
}

export function CreateTenantDialog({ onTenantCreated, children }: CreateTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooperativesLoading, setCooperativesLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  
  const [formData, setFormData] = useState<CreateTenantRequest>({
    phone: '',
    pin: '',
    firstName: '',
    lastName: '',
    email: '',
    cooperativeId: '',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Reset form data
      setFormData({
        phone: '',
        pin: '',
        firstName: '',
        lastName: '',
        email: '',
        cooperativeId: '',
        notes: ''
      });
      setFormErrors({});
      setError('');
      setSuccess('');
      
      // Fetch cooperatives
      fetchCooperatives();
    }
  }, [open]);

  // Fetch available cooperatives using the cooperatives API endpoint
  const fetchCooperatives = async () => {
    setCooperativesLoading(true);
    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
      const response = await fetch(`${baseURL}/cooperatives?page=1&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch cooperatives');
      }
      const data = await response.json();
      const cooperativesData = Array.isArray(data) ? data : data.data || [];
      setCooperatives(cooperativesData.filter((coop: Cooperative) => coop.status === 'ACTIVE'));
    } catch (err) {
      console.error('Failed to fetch cooperatives:', err);
      setError('Failed to load cooperatives. Please try again.');
    } finally {
      setCooperativesLoading(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s+/g, ''))) {
      errors.phone = 'Please enter a valid phone number (e.g., +250788123456)';
    }

    // PIN validation
    if (!formData.pin) {
      errors.pin = 'PIN is required';
    } else if (formData.pin.length < 4) {
      errors.pin = 'PIN must be at least 4 digits';
    } else if (!/^\d+$/.test(formData.pin)) {
      errors.pin = 'PIN must contain only numbers';
    }

    // Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Cooperative validation
    if (!formData.cooperativeId) {
      errors.cooperativeId = 'Please select a cooperative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Clean phone number (remove spaces and ensure proper format)
      const cleanedFormData = {
        ...formData,
        phone: formData.phone.replace(/\s+/g, ''),
        email: formData.email?.trim() || undefined,
        notes: formData.notes?.trim() || undefined
      };

      await apiClient.tenants.create(cleanedFormData);
      
      setSuccess('Tenant created successfully!');
      
      // Close dialog and refresh tenant list after short delay
      setTimeout(() => {
        setOpen(false);
        if (onTenantCreated) {
          onTenantCreated();
        }
      }, 1500);

    } catch (err: unknown) {
      console.error('Failed to create tenant:', err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create tenant. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof CreateTenantRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New Tenant
          </DialogTitle>
          <DialogDescription>
            Add a new tenant account to a cooperative
          </DialogDescription>
        </DialogHeader>

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Create Tenant Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-copay-navy flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={formErrors.firstName ? 'border-red-300' : ''}
                  disabled={loading}
                />
                {formErrors.firstName && (
                  <p className="text-sm text-red-600">{formErrors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={formErrors.lastName ? 'border-red-300' : ''}
                  disabled={loading}
                />
                {formErrors.lastName && (
                  <p className="text-sm text-red-600">{formErrors.lastName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-copay-navy flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+250788123456"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={formErrors.phone ? 'border-red-300' : ''}
                  disabled={loading}
                />
                {formErrors.phone && (
                  <p className="text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-gray-500">(optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={formErrors.email ? 'border-red-300' : ''}
                  disabled={loading}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-copay-navy flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="pin">
                PIN <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter 4-6 digit PIN"
                value={formData.pin}
                onChange={(e) => handleInputChange('pin', e.target.value)}
                className={formErrors.pin ? 'border-red-300' : ''}
                maxLength={6}
                disabled={loading}
              />
              {formErrors.pin && (
                <p className="text-sm text-red-600">{formErrors.pin}</p>
              )}
              <p className="text-sm text-gray-500">
                PIN will be used for tenant authentication
              </p>
            </div>
          </div>

          {/* Cooperative Assignment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-copay-navy flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Cooperative Assignment
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="cooperativeId">
                Cooperative <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.cooperativeId}
                onValueChange={(value) => handleInputChange('cooperativeId', value)}
                disabled={loading || cooperativesLoading}
              >
                <SelectTrigger className={formErrors.cooperativeId ? 'border-red-300' : ''}>
                  <SelectValue placeholder="Select a cooperative" />
                </SelectTrigger>
                <SelectContent>
                  {cooperatives.map((coop) => (
                    <SelectItem key={coop.id} value={coop.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{coop.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({coop.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.cooperativeId && (
                <p className="text-sm text-red-600">{formErrors.cooperativeId}</p>
              )}
              {cooperativesLoading && (
                <p className="text-sm text-gray-500">Loading cooperatives...</p>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-copay-navy flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Additional Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes <span className="text-gray-500">(optional)</span>
              </Label>
              <Input
                id="notes"
                type="text"
                placeholder="e.g., Apartment 301, Building A"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                disabled={loading}
              />
              <p className="text-sm text-gray-500">
                Any additional notes about the tenant
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || cooperativesLoading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Tenant
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}