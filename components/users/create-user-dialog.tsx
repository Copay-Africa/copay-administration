'use client';

import { useState, useEffect } from 'react';
import { 
  Plus,
  User,
  Phone,
  Mail,
  Shield,
  Building2,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import type { CreateUserData, UserRole, Organization } from '@/types';

interface CreateUserDialogProps {
  children: React.ReactNode;
  onUserCreated?: () => void;
}

/**
 * Create User Dialog Component
 * Allow Super Admins to create new users with role and cooperative assignment
 */

export function CreateUserDialog({ children, onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [formData, setFormData] = useState<CreateUserData>({
    phone: '',
    email: '',
    firstName: '',
    lastName: '',
    pin: '',
    role: 'TENANT',
    cooperativeId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load organizations when dialog opens
  useEffect(() => {
    if (open) {
      fetchOrganizations();
    }
  }, [open]);

  const fetchOrganizations = async () => {
    setLoadingOrganizations(true);
    try {
      const response = await apiClient.organizations.getAll();
      const orgsData = Array.isArray(response) 
        ? response 
        : (response.data || response);
      setOrganizations(orgsData as Organization[]);
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
      setOrganizations([]);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]{10,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // PIN validation
    if (!formData.pin.trim()) {
      newErrors.pin = 'PIN is required';
    } else if (!/^\d{4,6}$/.test(formData.pin.trim())) {
      newErrors.pin = 'PIN must be 4-6 digits';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    // Cooperative validation for non-super admins
    if (formData.role !== 'SUPER_ADMIN' && !formData.cooperativeId) {
      newErrors.cooperativeId = 'Cooperative is required for this role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Prepare user data
      const userData: CreateUserData = {
        phone: formData.phone.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        pin: formData.pin.trim(),
        role: formData.role,
        email: (formData.email && formData.email.trim()) || undefined,
        cooperativeId: formData.role === 'SUPER_ADMIN' ? undefined : formData.cooperativeId
      };

      await apiClient.users.create(userData);
      
      // Reset form and close dialog
      setFormData({
        phone: '',
        email: '',
        firstName: '',
        lastName: '',
        pin: '',
        role: 'TENANT',
        cooperativeId: ''
      });
      setErrors({});
      setOpen(false);
      
      // Notify parent component
      if (onUserCreated) {
        onUserCreated();
      }
      
      alert('User created successfully!');
    } catch (err) {
      console.error('Failed to create user:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 
                          (err as Error)?.message || 
                          'Failed to create user. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const generateRandomPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    handleInputChange('pin', pin);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Create a new user account with role assignment and cooperative access.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-copay-navy border-b pb-2">
              Personal Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  className={errors.firstName ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  className={errors.lastName ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-copay-navy border-b pb-2">
              Contact Information
            </h3>
            
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="e.g., +254700000000"
                className={errors.phone ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address (Optional)
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="user@example.com"
                className={errors.email ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Security Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-copay-navy border-b pb-2">
              Security Information
            </h3>
            
            <div>
              <Label htmlFor="pin">
                PIN Code <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    value={formData.pin}
                    onChange={(e) => handleInputChange('pin', e.target.value)}
                    placeholder="4-6 digit PIN"
                    className={errors.pin ? 'border-red-500' : ''}
                    disabled={loading}
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomPin}
                  disabled={loading}
                  className="whitespace-nowrap"
                >
                  Generate
                </Button>
              </div>
              {errors.pin && (
                <p className="text-sm text-red-500 mt-1">{errors.pin}</p>
              )}
              <p className="text-xs text-copay-gray mt-1">
                PIN will be used for user authentication and transactions
              </p>
            </div>
          </div>

          {/* Role & Organization */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-copay-navy border-b pb-2">
              Role & Organization
            </h3>
            
            <div>
              <Label htmlFor="role" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                User Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value as UserRole)}
                disabled={loading}
              >
                <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TENANT">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Tenant
                    </div>
                  </SelectItem>
                  <SelectItem value="ORGANIZATION_ADMIN">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organization Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="SUPER_ADMIN">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Super Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500 mt-1">{errors.role}</p>
              )}
            </div>

            {formData.role !== 'SUPER_ADMIN' && (
              <div>
                <Label htmlFor="cooperativeId" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Cooperative <span className="text-red-500">*</span>
                </Label>
                {loadingOrganizations ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading cooperatives...
                  </div>
                ) : (
                  <Select
                    value={formData.cooperativeId}
                    onValueChange={(value) => handleInputChange('cooperativeId', value)}
                    disabled={loading}
                  >
                    <SelectTrigger className={errors.cooperativeId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select cooperative" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{org.name}</span>
                            <span className="text-sm text-copay-gray">{org.code}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.cooperativeId && (
                  <p className="text-sm text-red-500 mt-1">{errors.cooperativeId}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating User...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}