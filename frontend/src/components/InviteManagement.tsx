import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { apiClient, type ApiResponse } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Send, Copy, Trash2, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, Plus } from "lucide-react";
import { toast } from "sonner";

interface Account {
  id: number;
  name: string;
  company_name: string;
}

interface Invitation {
  id: number;
  email: string;
  role: string;
  accountId?: number;
  accountName?: string;
  accountCompanyName?: string;
  companyName?: string;
  fullName?: string;
  phone?: string;
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  inviterName?: string;
  inviterEmail?: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string;
  usedByName?: string;
  token?: string; // Add token property for invite link
}

interface InviteStats {
  total_invites: number;
  pending_invites: number;
  completed_invites: number;
  expired_invites: number;
  cancelled_invites: number;
}

interface InviteFormData {
  email: string;
  role: string;
  accountId: string;
  companyName: string;
  fullName: string;
  phone: string;
  expiresIn: number;
}

const InviteManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');

  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    role: '',
    accountId: '',
    companyName: '',
    fullName: '',
    phone: '',
    expiresIn: 48
  });

  const [formErrors, setFormErrors] = useState<Partial<InviteFormData>>({});

  // Get available roles based on current user role
  const getAvailableRoles = () => {
    if (!userProfile) return [];
    
    switch (userProfile.role) {
      case 'superadmin':
        return [
          { value: 'admin', label: 'Admin' },
          { value: 'csm', label: 'CSM' },
          { value: 'user', label: 'User' }
        ];
      case 'admin':
        return [
          { value: 'csm', label: 'CSM' },
          { value: 'user', label: 'User' }
        ];
      case 'csm':
        return [
          { value: 'user', label: 'User' }
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadInvitations(),
        loadAccounts(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const response = await apiClient.getInviteHistory();
      
      if (response.success) {
        setInvitations(response.data?.invitations || []);
      } else {
        console.error('Failed to load invitations:', response.message);
        setError(response.message || 'Failed to load invitations');
        setInvitations([]);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
      setError('Failed to load invitations');
      setInvitations([]);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await apiClient.getAvailableAccounts();
      
      if (response.success) {
        setAccounts(response.data || []);
      } else {
        console.error('Failed to load accounts:', response.message);
        setError(response.message || 'Failed to load accounts');
        setAccounts([]);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Failed to load accounts');
      setAccounts([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.getInviteStats();
      
      if (response.success) {
        setStats(response.data || {
          total_invites: 0,
          pending_invites: 0,
          completed_invites: 0,
          expired_invites: 0,
          cancelled_invites: 0
        });
      } else {
        console.error('Failed to load stats:', response.message);
        // Fallback to calculating from invitations
        const response2 = await apiClient.getInviteHistory({ limit: 1000 });
        if (response2.success) {
          const invites = response2.data?.invitations || [];
          const stats = {
            total_invites: invites.length,
            pending_invites: invites.filter((inv: any) => inv.status === 'pending').length,
            completed_invites: invites.filter((inv: any) => inv.status === 'used').length,
            expired_invites: invites.filter((inv: any) => inv.status === 'expired').length,
            cancelled_invites: invites.filter((inv: any) => inv.status === 'cancelled').length,
          };
          setStats(stats);
        } else {
          setStats(null);
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<InviteFormData> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    if (formData.role === 'user' && !formData.accountId) {
      errors.accountId = 'Account is required for user role';
    }

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await apiClient.sendInvitation({
        email: formData.email.trim(),
        role: formData.role,
        accountId: formData.accountId || undefined,
        companyName: formData.companyName.trim() || undefined,
        fullName: formData.fullName.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        expiresIn: formData.expiresIn,
        sendEmail: false // For now, let's not send emails and just get the URL
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to send invitation');
      }

      toast.success(`Invitation sent successfully to ${formData.email}`);
      
      // Show the onboarding URL if available
      if (response.data?.onboardingUrl) {
        toast.success(`Invitation URL: ${response.data.onboardingUrl}`, {
          duration: 10000,
        });
      }

      // Reset form and close dialog
      setFormData({
        email: '',
        role: '',
        accountId: '',
        companyName: '',
        fullName: '',
        phone: '',
        expiresIn: 48
      });
      setFormErrors({});
      setShowInviteDialog(false);

      // Reload data
      loadData();
    } catch (error: any) {
      setError(error.message || 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvite = async (inviteId: number) => {
    try {
      const response = await apiClient.resendInvitation(inviteId);
      
      if (response.success) {
        toast.success("Invitation resent successfully");
        // Show the new onboarding URL if available
        if (response.data?.onboardingUrl) {
          toast.success(`New invitation URL: ${response.data.onboardingUrl}`, {
            duration: 10000,
          });
        }
        loadData();
      } else {
        throw new Error(response.message || 'Failed to resend invitation');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend invitation');
    }
  };

  const handleCancelInvite = async (inviteId: number) => {
    try {
      const response = await apiClient.cancelInvitation(inviteId);
      
      if (response.success) {
        toast.success("Invitation cancelled successfully");
        loadData();
      } else {
        throw new Error(response.message || 'Failed to cancel invitation');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel invitation');
    }
  };

  const copyInviteLink = async (invitation: Invitation) => {
    // For now, we'll need to extract the token from the invite data
    // Since the backend creates tokens but we might not have them in the list response,
    // we'll show a placeholder for now
    const url = `${window.location.origin}/onboarding?token=${invitation.token || 'TOKEN_PLACEHOLDER'}`;
    try {
      await navigator.clipboard.writeText(url);
      if (invitation.token) {
        toast.success("Invitation link copied to clipboard");
      } else {
        toast.warning("Invitation link template copied. The actual token needs to be retrieved from the backend.");
      }
    } catch (error) {
      toast.error("Failed to copy link to clipboard");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'used':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-gray-600 border-gray-600"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredInvitations = invitations.filter(invite => {
    if (filter === 'all') return true;
    return invite.status === filter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading invitations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invite Management</h1>
          <p className="text-muted-foreground">Send secure invitations and manage user onboarding</p>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Send Invitation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Invitation</DialogTitle>
              <DialogDescription>
                Send a secure invitation link to invite new users to the platform
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  className={formErrors.email ? 'border-destructive' : ''}
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger className={formErrors.role ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.role && (
                  <p className="text-sm text-destructive">{formErrors.role}</p>
                )}
              </div>

              {(formData.role === 'user' || formData.role === 'csm') && (
                <div className="space-y-2">
                  <Label htmlFor="accountId">
                    Account {formData.role === 'user' ? '*' : '(Optional)'}
                  </Label>
                  <Select value={formData.accountId} onValueChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}>
                    <SelectTrigger className={formErrors.accountId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name} ({account.company_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.accountId && (
                    <p className="text-sm text-destructive">{formErrors.accountId}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="John Doe"
                  className={formErrors.fullName ? 'border-destructive' : ''}
                />
                {formErrors.fullName && (
                  <p className="text-sm text-destructive">{formErrors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  className={formErrors.phone ? 'border-destructive' : ''}
                />
                {formErrors.phone && (
                  <p className="text-sm text-destructive">{formErrors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="ACME Corp"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresIn">Expires In (hours)</Label>
                <Select 
                  value={formData.expiresIn.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, expiresIn: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                    <SelectItem value="72">72 hours</SelectItem>
                    <SelectItem value="168">1 week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowInviteDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total_invites}</div>
              <p className="text-sm text-muted-foreground">Total Invites</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_invites}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.completed_invites}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.expired_invites}</div>
              <p className="text-sm text-muted-foreground">Expired</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.cancelled_invites}</div>
              <p className="text-sm text-muted-foreground">Cancelled</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Invitations</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="used">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
          <CardDescription>
            Manage sent invitations and track their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvitations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No invitations found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invite.email}</div>
                        {invite.fullName && (
                          <div className="text-sm text-muted-foreground">{invite.fullName}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{invite.role.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      {invite.accountName ? (
                        <div>
                          <div className="font-medium">{invite.accountName}</div>
                          <div className="text-sm text-muted-foreground">{invite.accountCompanyName}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(invite.status)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{formatDate(invite.createdAt)}</div>
                        <div className="text-xs text-muted-foreground">by {invite.inviterName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm ${isExpired(invite.expiresAt) && invite.status === 'pending' ? 'text-red-600' : ''}`}>
                        {formatDate(invite.expiresAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {invite.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyInviteLink(invite)}
                              title="Copy invitation link"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendInvite(invite.id)}
                              title="Resend invitation"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelInvite(invite.id)}
                              title="Cancel invitation"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {invite.status === 'used' && invite.usedAt && (
                          <div className="text-xs text-muted-foreground">
                            Completed {formatDate(invite.usedAt)}
                            {invite.usedByName && <div>by {invite.usedByName}</div>}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteManagement;
