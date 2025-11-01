/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';


export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    phone: '',
    pin: '',
  });
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (error) setError('');
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Format as Rwanda phone number
    if (digits.startsWith('250')) {
      return `+${digits}`;
    } else if (digits.startsWith('07') || digits.startsWith('78') || digits.startsWith('79')) {
      return `+250${digits}`;
    } else if (digits.length > 0) {
      return `+250${digits}`;
    }

    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      phone: formatted,
    }));

    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }

    if (!formData.pin.trim()) {
      setError('PIN is required');
      return false;
    }

    if (formData.pin.length !== 4) {
      setError('PIN must be 4 digits');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      console.log('Attempting login with:', { phone: formData.phone, pin: '****' });

      await login({
        phone: formData.phone,
        pin: formData.pin,
      });

      console.log('Login successful, redirecting to dashboard...');
      // Navigation is handled by the login function
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-copay-light-blue to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-copay-navy rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-copay-navy">Co-Pay Admin</h1>
          <p className="text-copay-gray mt-2">Super Administrator Portal</p>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-copay-navy">Sign In</CardTitle>
            <CardDescription>
              Enter your administrator credentials to access the dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone Number Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-copay-navy font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+250788000001"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="h-12"
                  disabled={isLoading}
                  autoComplete="tel"
                />
              </div>

              {/* PIN Field */}
              <div className="space-y-2">
                <Label htmlFor="pin" className="text-copay-navy font-medium">
                  PIN
                </Label>
                <div className="relative">
                  <Input
                    id="pin"
                    name="pin"
                    type={showPin ? 'text' : 'password'}
                    placeholder="Enter your 4-digit PIN"
                    value={formData.pin}
                    onChange={handleInputChange}
                    className="h-12 pr-12"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-copay-gray hover:text-copay-navy transition-colors"
                    onClick={() => setShowPin(!showPin)}
                    disabled={isLoading}
                  >
                    {showPin ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isLoading || !formData.phone.trim() || !formData.pin.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center text-sm text-copay-gray">
          <p>This is a secure administrator portal.</p>
          <p>Only authorized super administrators can access this system.</p>
        </div>
      </div>
    </div>
  );
}