// API configuration and utilities for Framtt Superadmin
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/api";

interface ApiError {
  success: false;
  message: string;
  error?: string;
  details?: any;
}

interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadTokenFromStorage();
  }

  private loadTokenFromStorage() {
    this.token = localStorage.getItem("auth_token");
  }

  private saveTokenToStorage(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  private removeTokenFromStorage() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }
      // response is ok
      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // Authentication methods
  async login(
    email: string,
    password: string
  ): Promise<
    ApiResponse<{
      accessToken: string;
      user: any;
      refreshToken?: string;
    }>
  > {
    const response = await this.request<{
      accessToken: string;
      user: any;
      refreshToken?: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.success) {
      this.saveTokenToStorage(response.data.accessToken);
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request("/auth/logout", {
      method: "POST",
    });

    this.removeTokenFromStorage();
    return response;
  }

  async getMe(): Promise<ApiResponse<any>> {
    return this.request("/auth/me");
  }

  async refreshToken(): Promise<
    ApiResponse<{
      accessToken: string;
      user: any;
    }>
  > {
    const response = await this.request<{
      accessToken: string;
      user: any;
    }>("/auth/refresh");

    if (response.success) {
      this.saveTokenToStorage(response.data.accessToken);
    }

    return response;
  }

  // Impersonation methods
  async startImpersonation(
    targetUserId: string,
    reason?: string
  ): Promise<
    ApiResponse<{
      impersonationToken: string;
      sessionId: string;
      targetUser: any;
      expiresAt: string;
    }>
  > {
    const response = await this.request<{
      impersonationToken: string;
      sessionId: string;
      targetUser: any;
      expiresAt: string;
    }>("/auth/impersonate/start", {
      method: "POST",
      body: JSON.stringify({ targetUserId, reason }),
    });

    if (response.success) {
      // Save impersonation token
      this.saveTokenToStorage(response.data.impersonationToken);
    }

    return response;
  }

  async stopImpersonation(sessionId: string): Promise<ApiResponse> {
    const response = await this.request("/auth/impersonate/stop", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });

    // After stopping impersonation, we need to refresh or get a new regular token
    // This would typically be handled by redirecting to login or refreshing the session
    return response;
  }

  async getActiveImpersonations(): Promise<
    ApiResponse<{
      sessions: any[];
      count: number;
    }>
  > {
    return this.request("/auth/impersonate/active");
  }

  async getImpersonationHistory(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    targetUserId?: string;
  }): Promise<
    ApiResponse<{
      logs: any[];
      total: number;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/auth/impersonate/history${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return this.request(endpoint);
  }

  // User management methods
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/users${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return this.request(endpoint);
  }

  async getUser(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/users/${userId}`);
  }

  async createUser(userData: {
    email: string;
    password: string;
    fullName: string;
    role: string;
    department?: string;
    phone?: string;
  }): Promise<ApiResponse<any>> {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async updateUser(
    userId: string,
    userData: Partial<{
      fullName: string;
      email: string;
      role: string;
      department: string;
      phone: string;
      status: string;
    }>
  ): Promise<ApiResponse<any>> {
    return this.request(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return this.request(`/users/${userId}`, {
      method: "DELETE",
    });
  }

  // Account management methods
  async getAccounts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    subscriptionPlan?: string;
  }): Promise<
    ApiResponse<{
      accounts: any[];
      total: number;
      page: number;
      totalPages: number;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/accounts${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return this.request(endpoint);
  }

  // Dashboard methods
  async getDashboardMetrics(): Promise<ApiResponse<any>> {
    return this.request("/dashboard/metrics");
  }

  async getDashboardSummary(): Promise<ApiResponse<any>> {
    return this.request("/dashboard/summary");
  }

  async getDashboardQuickActions(): Promise<ApiResponse<any>> {
    return this.request("/dashboard/quick-actions");
  }

  async generateReport(
    reportType = "monthly",
    format = "pdf"
  ): Promise<ApiResponse<any>> {
    return this.request("/dashboard/generate-report", {
      method: "POST",
      body: JSON.stringify({ reportType, format }),
    });
  }

  // Notification methods
  async getNotifications(): Promise<ApiResponse<any>> {
    return this.request("/notifications");
  }

  async getNotificationSettings(): Promise<ApiResponse<any>> {
    return this.request("/user/notification-settings");
  }

  async updateNotificationSettings(settings: any): Promise<ApiResponse<any>> {
    return this.request("/user/notification-settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  // User Preference methods
  async getUserPreferences(): Promise<ApiResponse<any>> {
    return this.request("/user/preferences");
  }

  async updateUserPreferences(preferences: any): Promise<ApiResponse<any>> {
    return this.request("/user/preferences", {
      method: "PUT",
      body: JSON.stringify({ preferences }),
    });
  }

  // Account Health methods
  async getAccountHealthOverview(): Promise<ApiResponse<any>> {
    return this.request("/account-health/overview");
  }

  async getAccountHealthScores(params?: {
    riskLevel?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const endpoint = `/account-health/scores${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return this.request(endpoint);
  }

  async getAccountHealthAlerts(params?: {
    status?: string;
    severity?: string;
    clientId?: string | number;
    alertType?: string;
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const endpoint = `/account-health/alerts${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return this.request(endpoint);
  }

  async acknowledgeAccountHealthAlert(
    alertId: number | string,
    acknowledgedBy?: string
  ): Promise<ApiResponse<any>> {
    return this.request(`/account-health/alerts/${alertId}/acknowledge`, {
      method: "POST",
      body: JSON.stringify({ acknowledgedBy }),
    });
  }

  async resolveAccountHealthAlert(
    alertId: number | string,
    resolvedBy?: string
  ): Promise<ApiResponse<any>> {
    return this.request(`/account-health/alerts/${alertId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ resolvedBy }),
    });
  }

  async refreshAccountHealthScores(): Promise<ApiResponse<any>> {
    return this.request("/account-health/refresh-scores", {
      method: "POST",
    });
  }

  // Audit methods
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<
    ApiResponse<{
      logs: any[];
      total: number;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/audit/logs${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return this.request(endpoint);
  }

  async getImpersonationLogs(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<
    ApiResponse<{
      logs: any[];
      total: number;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/audit/impersonation${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return this.request(endpoint);
  }

  // Invite Management methods
  async sendInvitation(inviteData: {
    email: string;
    role: string;
    accountId?: string;
    companyName?: string;
    fullName?: string;
    phone?: string;
    expiresIn?: number;
    sendEmail?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request("/invites", {
      method: "POST",
      body: JSON.stringify(inviteData),
    });
  }

  async resendInvitation(
    inviteId: number,
    expiresIn: number = 48
  ): Promise<ApiResponse<any>> {
    return this.request(`/invites/${inviteId}/resend`, {
      method: "POST",
      body: JSON.stringify({ expiresIn }),
    });
  }

  async cancelInvitation(inviteId: number): Promise<ApiResponse<any>> {
    return this.request(`/invites/${inviteId}`, {
      method: "DELETE",
    });
  }

  async getInviteStats(): Promise<ApiResponse<any>> {
    return this.request("/invites/stats");
  }

  async getAvailableAccounts(): Promise<ApiResponse<any[]>> {
    return this.request("/invites/available-accounts");
  }

  async getInviteHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/invites${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return this.request(endpoint);
  }

  // Client Management methods
  async getClients(params?: {
    page?: number;
    limit?: number;
    search?: string;
    planType?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/clients${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return this.request(endpoint);
  }

  async addClient(clientData: {
    companyName: string;
    email: string;
    phone?: string;
    planType: string;
    billingAddress?: string;
  }): Promise<ApiResponse<any>> {
    return this.request("/clients", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
  }

  async exportClientData(
    format: "csv" | "excel" = "csv"
  ): Promise<ApiResponse<any>> {
    return this.request(`/clients/export?format=${format}`);
  }

  async getClientStats(): Promise<ApiResponse<any>> {
    return this.request("/clients/stats");
  }

  // Payments and Billing methods
  async getRevenueData(timeframe?: string): Promise<ApiResponse<any>> {
    const params = timeframe ? `?timeframe=${timeframe}` : "";
    return this.request(`/billing/revenue${params}`);
  }

  async getSubscriptionData(): Promise<ApiResponse<any>> {
    return this.request("/billing/subscriptions");
  }

  async getTransactions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, String(value));
      });
    }
    const query = queryParams.toString();
    return this.request(`/billing/transactions${query ? `?${query}` : ""}`);
  }

  async getUpcomingRenewals(): Promise<ApiResponse<any>> {
    return this.request("/billing/renewals");
  }

  async getFailedPayments(): Promise<ApiResponse<any>> {
    return this.request("/billing/failed-payments");
  }

  async retryPayment(transactionId: string): Promise<ApiResponse<any>> {
    return this.request(`/billing/retry-payment/${transactionId}`, {
      method: "POST",
    });
  }

  async generateBillingReport(timeframe: string): Promise<ApiResponse<any>> {
    return this.request("/billing/generate-report", {
      method: "POST",
      body: JSON.stringify({ timeframe }),
    });
  }

  async downloadInvoice(transactionId: string): Promise<ApiResponse<any>> {
    return this.request(`/billing/invoice/${transactionId}/download`);
  }

  // System Monitoring methods
  async getSystemMetrics(timeframe?: string): Promise<ApiResponse<any>> {
    const params = timeframe ? `?timeframe=${timeframe}` : "";
    return this.request(`/monitoring/system-metrics${params}`);
  }

  async getApiEndpointStatus(): Promise<ApiResponse<any>> {
    return this.request("/monitoring/api-endpoints");
  }

  async getErrorLogs(params?: {
    page?: number;
    limit?: number;
    level?: string;
    service?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, String(value));
      });
    }
    const query = queryParams.toString();
    return this.request(`/monitoring/error-logs${query ? `?${query}` : ""}`);
  }

  async getSystemHealth(): Promise<ApiResponse<any>> {
    return this.request("/monitoring/system-health");
  }

  async refreshSystemData(): Promise<ApiResponse<any>> {
    return this.request("/monitoring/refresh", {
      method: "POST",
    });
  }

  // Snippet Manager methods
  async getIntegrationSnippets(params?: {
    page?: number;
    limit?: number;
    platform?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, String(value));
      });
    }
    const query = queryParams.toString();
    return this.request(`/snippets${query ? `?${query}` : ""}`);
  }

  async generateSnippet(clientData: {
    clientCode: string;
    platform: string;
    features: string[];
    companyName?: string;
  }): Promise<ApiResponse<any>> {
    return this.request("/snippets/generate", {
      method: "POST",
      body: JSON.stringify(clientData),
    });
  }

  async updateSnippet(
    snippetId: string,
    updateData: any
  ): Promise<ApiResponse<any>> {
    return this.request(`/snippets/${snippetId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    });
  }

  async deleteSnippet(snippetId: string): Promise<ApiResponse<any>> {
    return this.request(`/snippets/${snippetId}`, {
      method: "DELETE",
    });
  }

  async getSnippetStats(): Promise<ApiResponse<any>> {
    return this.request("/snippets/stats");
  }

  // Admin Settings methods
  async getAdminSettings(): Promise<ApiResponse<any>> {
    return this.request("/admin/settings");
  }

  async updateAdminSettings(settings: any): Promise<ApiResponse<any>> {
    return this.request("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  async getSystemStats(): Promise<ApiResponse<any>> {
    return this.request("/admin/system-stats");
  }

  // Utility methods
  setToken(token: string) {
    this.saveTokenToStorage(token);
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.removeTokenFromStorage();
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types for use in components
export type { ApiResponse, ApiError, ApiSuccess };
