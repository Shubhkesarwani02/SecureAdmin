import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Shield, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface InviteData {
  id: number;
  email: string;
  role: string;
  accountId?: number;
  accountName?: string;
  accountCompanyName?: string;
  companyName?: string;
  fullName?: string;
  phone?: string;
  inviterName?: string;
  inviterEmail?: string;
  expiresAt: string;
  createdAt: string;
}

interface FormData {
  fullName: string;
  password: string;
  confirmPassword: string;
  phone: string;
  companyName: string;
  acceptTerms: boolean;
}

interface ValidationErrors {
  fullName?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  companyName?: string;
  acceptTerms?: string;
}

const OnboardingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    password: '',
    confirmPassword: '',
    phone: '',
    companyName: '',
    acceptTerms: false
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Validate invitation token on component mount
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. Please check your email for the correct link.');
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  // Update form data when invite data is loaded
  useEffect(() => {
    if (inviteData) {
      setFormData(prev => ({
        ...prev,
        fullName: inviteData.fullName || '',
        phone: inviteData.phone || '',
        companyName: inviteData.companyName || inviteData.accountCompanyName || ''
      }));
    }
  }, [inviteData]);

  // Update password strength indicators
  useEffect(() => {
    const password = formData.password;
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  }, [formData.password]);

  const validateToken = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invites/validate/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid invitation token');
      }

      setInviteData(data.data.invite);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!Object.values(passwordStrength).every(Boolean)) {
      errors.password = 'Password must meet all strength requirements';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Company name validation (for client-level users)
    if (inviteData?.role === 'user' && inviteData?.accountId && !formData.companyName.trim()) {
      errors.companyName = 'Company name is required';
    }

    // Terms acceptance validation
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms of service';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/invites/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim() || null,
          companyName: formData.companyName.trim() || null,
          acceptTerms: formData.acceptTerms
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete onboarding');
      }

      // Success - redirect to login with success message
      navigate('/login', { 
        state: { 
          message: 'Account created successfully! Please sign in with your credentials.',
          email: inviteData?.email 
        } 
      });
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const getPasswordStrengthColor = (isValid: boolean) => {
    return isValid ? 'text-green-600' : 'text-gray-400';
  };

  const getPasswordStrengthIcon = (isValid: boolean) => {
    return isValid ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Validating invitation...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full"
              variant="outline"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-lg">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Framtt Admin</h1>
              <p className="text-muted-foreground">Complete Your Account Setup</p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Welcome to Framtt!</CardTitle>
            <CardDescription>
              You've been invited by <strong>{inviteData?.inviterName}</strong> ({inviteData?.inviterEmail}) 
              to join as a <strong>{inviteData?.role.toUpperCase()}</strong>
              {inviteData?.accountName && (
                <span> for <strong>{inviteData.accountName}</strong></span>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteData?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">This email cannot be changed</p>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className={validationErrors.fullName ? 'border-destructive' : ''}
                />
                {validationErrors.fullName && (
                  <p className="text-sm text-destructive">{validationErrors.fullName}</p>
                )}
              </div>

              {/* Phone (optional) */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className={validationErrors.phone ? 'border-destructive' : ''}
                />
                {validationErrors.phone && (
                  <p className="text-sm text-destructive">{validationErrors.phone}</p>
                )}
              </div>

              {/* Company Name (for client-level users) */}
              {inviteData?.role === 'user' && inviteData?.accountId && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Enter your company name"
                    className={validationErrors.companyName ? 'border-destructive' : ''}
                  />
                  {validationErrors.companyName && (
                    <p className="text-sm text-destructive">{validationErrors.companyName}</p>
                  )}
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Create a strong password"
                    className={validationErrors.password ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                {/* Password strength indicators */}
                {formData.password && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-1 ${getPasswordStrengthColor(passwordStrength.length)}`}>
                      {getPasswordStrengthIcon(passwordStrength.length)}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-1 ${getPasswordStrengthColor(passwordStrength.uppercase)}`}>
                      {getPasswordStrengthIcon(passwordStrength.uppercase)}
                      Uppercase letter
                    </div>
                    <div className={`flex items-center gap-1 ${getPasswordStrengthColor(passwordStrength.lowercase)}`}>
                      {getPasswordStrengthIcon(passwordStrength.lowercase)}
                      Lowercase letter
                    </div>
                    <div className={`flex items-center gap-1 ${getPasswordStrengthColor(passwordStrength.number)}`}>
                      {getPasswordStrengthIcon(passwordStrength.number)}
                      Number
                    </div>
                    <div className={`flex items-center gap-1 ${getPasswordStrengthColor(passwordStrength.special)}`}>
                      {getPasswordStrengthIcon(passwordStrength.special)}
                      Special character
                    </div>
                  </div>
                )}

                {validationErrors.password && (
                  <p className="text-sm text-destructive">{validationErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    className={validationErrors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                    className={validationErrors.acceptTerms ? 'border-destructive' : ''}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="acceptTerms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the Terms of Service and Privacy Policy *
                    </label>
                    <p className="text-xs text-muted-foreground">
                      By creating an account, you agree to our terms and conditions.
                    </p>
                  </div>
                </div>
                {validationErrors.acceptTerms && (
                  <p className="text-sm text-destructive">{validationErrors.acceptTerms}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground border-t pt-6">
              <p>Need help? Contact your administrator at {inviteData?.inviterEmail}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingPage;
