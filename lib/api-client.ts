/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosResponse } from "axios";
import Cookies from "js-cookie";
import type {
  AuthResponse,
  LoginCredentials,
  ApiResponse,
  PaginatedResponse,
  SuperAdmin,
  TenantFilters,
  CreateTenantRequest,
  UpdateTenantRequest,
  AccountRequestFilters,
  CreateAccountRequestData,
  ProcessAccountRequestData,
  UserFilters,
  CreateUserData,
  UpdateUserStatusData,
  ActivityFilters,
  NotificationFilters,
  ReminderFilters,
  CreateReminderData,
  ComplaintFilters,
  CreateComplaintData,
  UpdateComplaintStatusData,
  AnnouncementFilters,
  CreateAnnouncementData,
} from "@/types";

/**
 * API Client for Copay Super Admin Backend
 * Handles authentication, token management, and API requests
 */
class ApiClient {
  private instance: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors for authentication and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token to requests
    this.instance.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle token refresh and errors
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshed = await this.refreshToken();
            if (refreshed) {
              const token = this.getAccessToken();
              if (token && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            this.handleAuthenticationFailure();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get access token from cookies or localStorage
   */
  private getAccessToken(): string | undefined {
    // First try cookies
    let token = Cookies.get("copay_access_token");

    // If not found in cookies, try localStorage
    if (!token && typeof window !== "undefined") {
      const tokenData = this.getStoredTokenData();
      if (tokenData && tokenData.expiresAt > Date.now()) {
        token = tokenData.accessToken;

        Cookies.set("copay_access_token", token, {
          expires: new Date(tokenData.expiresAt),
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      }
    }

    return token;
  }

  /**
   * Get refresh token from cookies or localStorage
   */
  private getRefreshToken(): string | undefined {
    // First try cookies
    let token = Cookies.get("copay_refresh_token");

    // If not found in cookies, try localStorage
    if (!token && typeof window !== "undefined") {
      const tokenData = this.getStoredTokenData();
      if (tokenData && tokenData.refreshExpiresAt > Date.now()) {
        token = tokenData.refreshToken;
        // Restore to cookies if found in localStorage
        Cookies.set("copay_refresh_token", token, {
          expires: new Date(tokenData.refreshExpiresAt),
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      }
    }

    return token;
  }

  /**
   * Get stored token data from localStorage
   */
  private getStoredTokenData(): {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    refreshExpiresAt: number;
  } | null {
    if (typeof window === "undefined") return null;

    try {
      const tokenData = localStorage.getItem("copay_tokens");
      return tokenData ? JSON.parse(tokenData) : null;
    } catch (error) {
      console.error("Error parsing stored token data:", error);
      return null;
    }
  }

  /**
   * Store authentication tokens in secure cookies and localStorage
   */
  private setTokens(
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  ): void {
    const now = Date.now();
    const accessTokenExpiry = new Date(now + expiresIn * 1000);
    const refreshTokenExpiry = new Date(now + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store in cookies for server-side access
    Cookies.set("copay_access_token", accessToken, {
      expires: accessTokenExpiry,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    Cookies.set("copay_refresh_token", refreshToken, {
      expires: refreshTokenExpiry,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Also store in localStorage as backup and for faster access
    if (typeof window !== "undefined") {
      const tokenData = {
        accessToken,
        refreshToken,
        expiresAt: now + expiresIn * 1000,
        refreshExpiresAt: now + 7 * 24 * 60 * 60 * 1000,
      };
      localStorage.setItem("copay_tokens", JSON.stringify(tokenData));
    }
  }

  /**
   * Clear authentication tokens and user data
   */
  private clearTokens(): void {
    Cookies.remove("copay_access_token");
    Cookies.remove("copay_refresh_token");
    if (typeof window !== "undefined") {
      localStorage.removeItem("copay_user");
      localStorage.removeItem("copay_tokens");
    }
  }

  /**
   * Handle authentication failure - redirect to login
   */
  private handleAuthenticationFailure(): void {
    this.clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.log("No refresh token available");
      return false;
    }

    try {
      console.log("Attempting to refresh token...");
      const response = await axios.post(`${this.baseURL}/auth/refresh`, {
        refreshToken: refreshToken, // Use the same format as login
      });

      console.log("Token refresh response:", response.data);

      // Handle the actual API response format (same as login)
      const responseData = response.data;

      if (responseData.accessToken) {
        const expiresIn = responseData.expiresIn || 604800; // Default 7 days
        const newRefreshToken = responseData.refreshToken || refreshToken;

        this.setTokens(responseData.accessToken, newRefreshToken, expiresIn);
        console.log("Token refreshed successfully");
        return true;
      } else {
        console.error("Invalid refresh response format:", responseData);
        return false;
      }
    } catch (error: any) {
      console.error("Token refresh failed:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return false;
    }
  }

  // === Authentication Methods ===

  /**
   * Login with phone and PIN
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log("Making login request to:", `${this.baseURL}/auth/login`);
      console.log("Request payload:", { ...credentials, pin: "****" });

      const response = await this.instance.post("/auth/login", credentials);

      console.log("Login response status:", response.status);
      console.log("Login response data:", response.data);

      // Handle the actual API response format
      const responseData = response.data;

      // Check if response has the expected structure
      if (!responseData.accessToken || !responseData.user) {
        console.error("Invalid response structure:", responseData);
        throw new Error("Invalid login response format");
      }

      // Map the API response to our expected format
      const authData: AuthResponse = {
        access_token: responseData.accessToken,
        refresh_token: responseData.refreshToken || responseData.accessToken, // Fallback if no refresh token
        expires_in: responseData.expiresIn || 604800, // Default 7 days
        user: {
          id: responseData.user.id,
          phone: responseData.user.phone,
          email: responseData.user.email,
          firstName: responseData.user.firstName,
          lastName: responseData.user.lastName,
          role: responseData.user.role as "SUPER_ADMIN",
          permissions: [], // Will be filled by getCurrentUser if needed
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      console.log("Mapped auth data:", { ...authData, access_token: "****" });

      // Store tokens and user data
      this.setTokens(
        authData.access_token,
        authData.refresh_token || authData.access_token,
        authData.expires_in
      );
      localStorage.setItem("copay_user", JSON.stringify(authData.user));

      console.log("Tokens stored successfully");
      return authData;
    } catch (error: any) {
      console.error("Login error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      throw new Error(
        error.response?.data?.message || error.message || "Login failed"
      );
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.instance.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<SuperAdmin> {
    const response: AxiosResponse<ApiResponse<SuperAdmin>> =
      await this.instance.get("/auth/me");
    return response.data.data;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    // Check if token is expired
    const tokenData = this.getStoredTokenData();
    if (tokenData && tokenData.expiresAt <= Date.now()) {
      // Token is expired, check if refresh token is still valid
      if (tokenData.refreshExpiresAt <= Date.now()) {
        // Both tokens expired, clear everything
        this.clearTokens();
        return false;
      }
      // Access token expired but refresh token is still valid
      // The refresh will be handled by the interceptor
      return true;
    }

    return true;
  }

  /**
   * Get user data from localStorage
   */
  getStoredUser(): SuperAdmin | null {
    if (typeof window === "undefined") return null;

    try {
      const userData = localStorage.getItem("copay_user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing stored user data:", error);
      return null;
    }
  }

  /**
   * Public method to manually refresh tokens
   */
  async manualRefreshToken(): Promise<boolean> {
    return this.refreshToken();
  }

  /**
   * Get token expiration info
   */
  getTokenExpirationInfo(): {
    accessTokenExpiresAt: number | null;
    refreshTokenExpiresAt: number | null;
    isAccessTokenExpired: boolean;
    isRefreshTokenExpired: boolean;
  } {
    const tokenData = this.getStoredTokenData();
    if (!tokenData) {
      return {
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        isAccessTokenExpired: true,
        isRefreshTokenExpired: true,
      };
    }

    const now = Date.now();
    return {
      accessTokenExpiresAt: tokenData.expiresAt,
      refreshTokenExpiresAt: tokenData.refreshExpiresAt,
      isAccessTokenExpired: tokenData.expiresAt <= now,
      isRefreshTokenExpired: tokenData.refreshExpiresAt <= now,
    };
  }

  // === Generic API Methods ===

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.get(
      endpoint,
      { params }
    );
    return response.data.data;
  }

  /**
   * Generic GET request for paginated data
   */
  async getPaginated<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<PaginatedResponse<T>> {
    const response: AxiosResponse<PaginatedResponse<T>> =
      await this.instance.get(endpoint, { params });
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: Record<string, any>): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.post(
      endpoint,
      data
    );
    return response.data.data;
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, data?: Record<string, any>): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.put(
      endpoint,
      data
    );
    return response.data.data;
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(endpoint: string, data?: Record<string, any>): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.patch(
      endpoint,
      data
    );
    return response.data.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.instance.delete(
      endpoint
    );
    return response.data.data;
  }

  // === Specific API Methods ===

  /**
   * Organizations/Cooperatives API
   */
  organizations = {
    getAll: (filters?: any) => this.getPaginated("/cooperatives", filters),
    getById: (id: string) => this.get(`/cooperatives/${id}`),
    create: (data: any) => this.post("/cooperatives", data),
    update: (id: string, data: any) => this.put(`/cooperatives/${id}`, data),
    approve: (id: string) => this.post(`/cooperatives/${id}/approve`),
    suspend: (id: string) => this.post(`/cooperatives/${id}/suspend`),
    activate: (id: string) => this.post(`/cooperatives/${id}/activate`),
    delete: (id: string) => this.delete(`/cooperatives/${id}`),
    // Admin management for cooperatives
    createAdmin: (data: any) => this.post("/users", data),
    getAdmins: (cooperativeId: string) =>
      this.get(`/cooperatives/${cooperativeId}/admins`),
  };

  /**
   * Payment Types API (Public - No Auth Required)
   */
  paymentTypes = {
    // Public endpoints - no auth required
    getAll: (filters?: any) => this.getPaginated("/payment-types", filters),
    getActive: (cooperativeId: string) =>
      this.get(`/payment-types/active?cooperativeId=${cooperativeId}`),
    getById: (id: string, cooperativeId: string) =>
      this.get(`/payment-types/${id}?cooperativeId=${cooperativeId}`),

    // Authenticated endpoints for management
    create: (data: any) => this.post("/payment-types", data),
    update: (id: string, data: any) => this.put(`/payment-types/${id}`, data),
    delete: (id: string) => this.delete(`/payment-types/${id}`),
  };

  /**
   * Payments API
   */
  payments = {
    // General payment endpoints (SUPER_ADMIN)
    getAll: (filters?: any) => this.getPaginated("/payments", filters),
    getById: (id: string) => this.get(`/payments/${id}`),

    // Organization payment endpoints (ORGANIZATION_ADMIN + SUPER_ADMIN)
    getOrganizationPayments: (filters?: any) =>
      this.getPaginated("/payments/organization", filters),
    getOrganizationPaymentById: (id: string) =>
      this.get(`/payments/organization/${id}`),
    getOrganizationStats: (filters?: any) =>
      this.get("/payments/organization/stats", filters),
  };

  /**
   * Tenants API (Super Admin Only)
   * Complete tenant management across all cooperatives
   */
  tenants = {
    /**
     * Get all tenants across all cooperatives with advanced filtering
     * GET /api/v1/users/tenants
     */
    getAll: (filters?: TenantFilters) =>
      this.getPaginated("/users/tenants", filters),

    /**
     * Get tenant statistics dashboard data
     * GET /api/v1/users/tenants/stats
     */
    getStats: () => this.get("/users/tenants/stats"),

    /**
     * Create a new tenant and assign to a cooperative
     * POST /api/v1/users/tenants
     */
    create: (data: CreateTenantRequest) => this.post("/users/tenants", data),

    /**
     * Get detailed tenant information with payment stats and complaint history
     * GET /api/v1/users/tenants/:id
     */
    getById: (id: string) => this.get(`/users/tenants/${id}`),

    /**
     * Update tenant information, status, or migrate between cooperatives
     * PATCH /api/v1/users/tenants/:id
     */
    update: (id: string, data: UpdateTenantRequest) =>
      this.patch(`/users/tenants/${id}`, data),

    /**
     * Delete tenant (soft delete if has payment history, hard delete otherwise)
     * DELETE /api/v1/users/tenants/:id
     */
    remove: (id: string) => this.delete(`/users/tenants/${id}`),
  };

  /**
   * Account Requests API
   */
  accountRequests = {
    /**
     * Get all account requests with role-based filtering
     */
    getAll: (filters?: AccountRequestFilters) =>
      this.getPaginated("/account-requests", filters),

    /**
     * Get account requests for organization admin
     */
    getOrganizationRequests: (filters?: AccountRequestFilters) =>
      this.getPaginated("/organization/account-requests", filters),

    /**
     * Get all account requests for super admin
     */
    getAdminRequests: (filters?: AccountRequestFilters) =>
      this.getPaginated("/admin/account-requests", filters),

    /**
     * Get account request by ID
     */
    getById: (id: string) => this.get(`/account-requests/${id}`),

    /**
     * Create account request (public endpoint)
     */
    create: (cooperativeId: string, data: CreateAccountRequestData) =>
      this.post(`/account-requests/${cooperativeId}`, data),

    /**
     * Process account request (approve/reject)
     */
    process: (id: string, data: ProcessAccountRequestData) =>
      this.put(`/account-requests/${id}/process`, data),

    /**
     * Delete account request
     */
    remove: (id: string) => this.delete(`/account-requests/${id}`),

    /**
     * Get account request statistics
     */
    getStats: (cooperativeId?: string) =>
      this.get(
        "/account-requests/stats",
        cooperativeId ? { cooperativeId } : {}
      ),

    /**
     * Check availability (public endpoint)
     */
    checkAvailability: (
      cooperativeId: string,
      params: { phone?: string; roomNumber?: string }
    ) => this.get(`/account-requests/${cooperativeId}/availability`, params),
  };

  /**
   * Onboarding Requests API
   */
  onboardingRequests = {
    getAll: (filters?: any) =>
      this.getPaginated("/onboarding-requests", filters),
    getById: (id: string) => this.get(`/onboarding-requests/${id}`),
    approve: (id: string, notes?: string) =>
      this.post(`/onboarding-requests/${id}/approve`, { notes }),
    reject: (id: string, notes: string) =>
      this.post(`/onboarding-requests/${id}/reject`, { notes }),
  };

  /**
   * Users API
   */
  users = {
    /**
     * Get all users with filtering
     */
    getAll: (filters?: UserFilters) => this.getPaginated("/users", filters),

    /**
     * Get user by ID
     */
    getById: (id: string) => this.get(`/users/${id}`),

    /**
     * Create new user
     */
    create: (data: CreateUserData) => this.post("/users", data),

    /**
     * Update user status (activate/deactivate)
     */
    updateStatus: (id: string, data: UpdateUserStatusData) =>
      this.patch(`/users/${id}/status`, data),

    /**
     * Get user statistics
     */
    getStats: (cooperativeId?: string) =>
      this.get("/users/stats", cooperativeId ? { cooperativeId } : {}),

    /**
     * Delete user
     */
    remove: (id: string) => this.delete(`/users/${id}`),
  };

  /**
   * Activities API - Comprehensive audit logging and activity tracking
   */
  activities = {
    /**
     * Get all activities with role-based access control
     * TENANT: See only their own activities
     * ORGANIZATION_ADMIN: See activities within their cooperative
     * SUPER_ADMIN: See all activities across all cooperatives
     */
    getAll: (filters?: ActivityFilters) =>
      this.getPaginated("/activities", filters),

    /**
     * Get current user's activities
     */
    getMyActivities: () => this.getPaginated("/activities/me"),

    /**
     * Get security activities (Admin only)
     * Required Roles: SUPER_ADMIN, ORGANIZATION_ADMIN
     */
    getSecurityActivities: (filters?: ActivityFilters) =>
      this.getPaginated("/activities/security", filters),

    /**
     * Get security events (alias for getSecurityActivities)
     */
    getSecurityEvents: (filters?: ActivityFilters) =>
      this.getPaginated("/activities/security", filters),

    /**
     * Get activity statistics
     */
    getStats: (filters?: ActivityFilters) =>
      this.get("/activities/stats", filters),

    /**
     * Create activity log entry
     */
    create: (data: {
      type: string;
      description: string;
      entityType: string;
      entityId: string;
      metadata?: Record<string, unknown>;
      isSecurityEvent?: boolean;
    }) => this.post("/activities", data),
  };

  /**
   * Notifications API - In-app notification management
   */
  notifications = {
    /**
     * Get all notifications for current user
     */
    getAll: (filters?: NotificationFilters) =>
      this.getPaginated("/notifications", filters),

    /**
     * Get notification by ID
     */
    getById: (id: string) => this.get(`/notifications/${id}`),

    /**
     * Get in-app notifications
     */
    getInApp: (limit?: number) =>
      this.get("/notifications/in-app", limit ? { limit } : {}),

    /**
     * Mark notification as read
     */
    markAsRead: (id: string) => this.patch(`/notifications/${id}/read`),

    /**
     * Mark in-app notification as read
     */
    markInAppAsRead: (id: string) =>
      this.patch(`/notifications/in-app/${id}/read`),

    /**
     * Mark all notifications as read
     */
    markAllAsRead: () => this.patch("/notifications/mark-all-read"),
  };

  /**
   * Reminders API - Automated payment reminders with multi-channel notifications
   */
  reminders = {
    /**
     * Get all reminders
     */
    getAll: (filters?: ReminderFilters) =>
      this.getPaginated("/reminders", filters),

    /**
     * Get current user's reminders
     */
    getMyReminders: () => this.getPaginated("/reminders/me"),

    /**
     * Get due reminders
     */
    getDueReminders: () => this.getPaginated("/reminders/due"),

    /**
     * Get reminder by ID
     */
    getById: (id: string) => this.get(`/reminders/${id}`),

    /**
     * Create new reminder
     */
    create: (data: CreateReminderData) => this.post("/reminders", data),

    /**
     * Update reminder
     */
    update: (id: string, data: Partial<CreateReminderData>) =>
      this.put(`/reminders/${id}`, data),

    /**
     * Delete reminder
     */
    remove: (id: string) => this.delete(`/reminders/${id}`),

    /**
     * Delete reminder (alias for remove)
     */
    delete: (id: string) => this.delete(`/reminders/${id}`),

    /**
     * Update reminder status
     */
    updateStatus: (id: string, status: string) =>
      this.put(`/reminders/${id}`, { status }),

    /**
     * Send reminder immediately
     */
    send: (id: string) => this.post(`/reminders/${id}/send`),

    /**
     * Get reminder statistics
     */
    getStats: () => this.get("/reminders/stats"),
  };

  /**
   * Complaints API - Comprehensive complaint management
   */
  complaints = {
    /**
     * Get all complaints with role-based access
     * TENANT: See only their own complaints
     * ORGANIZATION_ADMIN: See all complaints within their cooperative
     * SUPER_ADMIN: See all complaints across all cooperatives
     */
    getAll: (filters?: ComplaintFilters) =>
      this.getPaginated("/complaints", filters),

    /**
     * Get my complaints (current user)
     */
    getMyComplaints: () => this.getPaginated("/complaints/my"),

    /**
     * Get organization complaints (Admin only)
     */
    getOrganizationComplaints: (filters?: ComplaintFilters) =>
      this.getPaginated("/complaints/organization", filters),

    /**
     * Get complaint by ID
     */
    getById: (id: string) => this.get(`/complaints/${id}`),

    /**
     * Create new complaint
     */
    create: (data: CreateComplaintData) => this.post("/complaints", data),

    /**
     * Update complaint status (Admin only)
     */
    updateStatus: (id: string, data: UpdateComplaintStatusData) =>
      this.patch(`/complaints/${id}/status`, data),

    /**
     * Get complaint statistics (Admin only)
     */
    getOrganizationStats: (filters?: { fromDate?: string; toDate?: string }) =>
      this.get("/complaints/organization/stats", filters),

    /**
     * Get overall complaint statistics
     */
    getStats: () => this.get("/complaints/stats"),
  };

  /**
   * Announcements API - Role-based announcement creation and delivery
   */
  announcements = {
    /**
     * Get all announcements (Admin only)
     */
    getAll: (filters?: AnnouncementFilters) =>
      this.getPaginated("/announcements", filters),

    /**
     * Get announcement by ID
     */
    getById: (id: string) => this.get(`/announcements/${id}`),

    /**
     * Create new announcement (Admin only)
     */
    create: (data: CreateAnnouncementData) => this.post("/announcements", data),

    /**
     * Update announcement (Admin only)
     */
    update: (id: string, data: Partial<CreateAnnouncementData>) =>
      this.put(`/announcements/${id}`, data),

    /**
     * Send announcement immediately (Admin only)
     */
    send: (id: string) => this.post(`/announcements/${id}/send`),

    /**
     * Delete announcement (Admin only)
     */
    remove: (id: string) => this.delete(`/announcements/${id}`),

    /**
     * Get announcement statistics (Admin only)
     */
    getStats: () => this.get("/announcements/stats"),
  };

  /**
   * Dashboard Analytics API
   */
  dashboard = {
    getStats: () => this.get("/dashboard/stats"),
    getChartData: (type: string, period?: string) =>
      this.get(`/dashboard/charts/${type}`, { period }),
  };

  /**
   * System Settings API
   */
  settings = {
    getAll: (category?: string) => this.get("/settings", { category }),
    update: (key: string, value: string) =>
      this.put(`/settings/${key}`, { value }),
  };
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;
