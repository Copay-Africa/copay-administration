/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
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
  ComplaintFilters,
  CreateComplaintData,
  UpdateComplaintStatusData,
  AnnouncementFilters,
  CreateAnnouncementData,
  CooperativeCategory,
  CooperativeCategoryFilters,
  CooperativeCategoryStats,
  CooperativeBalanceAnalysis,
  CooperativeBalancesResponse,
  BalanceRedistributionResult,
  BatchRedistributionRequest,
  BatchRedistributionResult,
  PendingRedistributionsResponse,
  PendingRedistributionFilters,
  ActivityAnalytics,
  RevenueAnalytics,
  UserAnalytics,
  TimePeriod,
  AnalyticsActivityType,
} from "@/types";

// Extend axios types for our custom metadata
declare module "axios" {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
      requestId: string;
    };
    _retry?: boolean;
    _retryCount?: number;
  }
}
/**
 * Enhanced API Client for Copay Super Admin Backend
 * Features:
 * - Automatic token refresh
 * - Request retry with exponential backoff
 * - Comprehensive error handling
 * - Request/Response interceptors
 * - Network status monitoring
 * - Request cancellation support
 */

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryOn: number[];
}

interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retry: RetryConfig;
  enableFallbacks: boolean;
}

class ApiClient {
  private instance: AxiosInstance;
  private config: ApiClientConfig;
  private requestCancellationMap = new Map<string, AbortController>();

  constructor() {
    this.config = {
      baseURL:
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1",
      timeout: 30000,
      retry: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        retryOn: [408, 429, 500, 502, 503, 504], // Timeout, Rate limit, Server errors
      },
      enableFallbacks: process.env.NODE_ENV === "development",
    };

    this.instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
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
    // Request interceptor - add auth token and handle request tracking
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request metadata for monitoring
        config.metadata = {
          startTime: Date.now(),
          requestId: this.generateRequestId(),
        };

        return config;
      },
      (error) => {
        console.error("Request setup failed:", error);
        return Promise.reject(this.normalizeError(error));
      }
    );

    // Response interceptor - handle token refresh, errors, and retry logic
    this.instance.interceptors.response.use(
      (response) => {
        // Log successful request in development
        if (
          process.env.NODE_ENV === "development" &&
          response.config.metadata
        ) {
          const duration = Date.now() - response.config.metadata.startTime;
          console.log(
            `✅ ${response.config.method?.toUpperCase()} ${
              response.config.url
            } - ${duration}ms`
          );
        }
        return response;
      },
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
            return Promise.reject(this.normalizeError(refreshError));
          }
        }

        // Handle retry logic for retryable errors
        if (this.shouldRetry(error) && !originalRequest._retryCount) {
          return this.retryRequest(originalRequest, error);
        }

        // Log error in development
        if (process.env.NODE_ENV === "development") {
          console.error(
            `❌ ${originalRequest.method?.toUpperCase()} ${
              originalRequest.url
            }`,
            error.response?.data || error.message
          );
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if request should be retried based on error type and config
   */
  private shouldRetry(error: AxiosError): boolean {
    const { retry } = this.config;

    // Don't retry if it's a request cancellation
    if (axios.isCancel(error)) {
      return false;
    }

    // Don't retry client errors (4xx except specific ones)
    if (
      error.response?.status &&
      error.response.status >= 400 &&
      error.response.status < 500
    ) {
      return retry.retryOn.includes(error.response.status);
    }

    // Retry network errors and specified status codes
    return !error.response || retry.retryOn.includes(error.response.status);
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest(
    originalRequest: any,
    error: AxiosError
  ): Promise<any> {
    const { retry } = this.config;
    const retryCount = originalRequest._retryCount || 0;

    if (retryCount >= retry.maxRetries) {
      return Promise.reject(this.normalizeError(error));
    }

    // Calculate delay with exponential backoff and jitter
    const baseDelay = retry.baseDelay;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    const delay = Math.min(exponentialDelay + jitter, retry.maxDelay);

    console.log(
      `🔄 Retrying request (${retryCount + 1}/${
        retry.maxRetries
      }) after ${delay}ms`
    );

    originalRequest._retryCount = retryCount + 1;

    await this.sleep(delay);
    return this.instance(originalRequest);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Normalize different types of errors into a consistent format
   */
  private normalizeError(error: any): Error {
    if (axios.isCancel(error)) {
      return new Error("Request was cancelled");
    }

    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "An unexpected error occurred";

      const normalizedError = new Error(message);
      (normalizedError as any).status = error.response?.status;
      (normalizedError as any).code = error.code;
      return normalizedError;
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(String(error));
  }

  /**
   * Check if error indicates an unimplemented endpoint
   */
  private isEndpointNotImplemented(error: any): boolean {
    return (
      error.response?.status === 404 &&
      (error.response?.data?.message?.includes("endpoint") ||
        error.response?.data?.message?.includes("route") ||
        error.config?.url?.includes("/payments/distribution") ||
        error.config?.url?.includes("/balances/redistribute"))
    );
  }

  /**
   * Create user-friendly error for unimplemented endpoints
   */
  private createFallbackError(endpoint: string): Error {
    return new Error(
      `The ${endpoint} endpoint is not yet implemented on the backend. ` +
        `This feature is currently under development. Please contact your administrator for updates.`
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
      const response = await axios.post(`${this.config.baseURL}/auth/refresh`, {
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
      console.log(
        "Making login request to:",
        `${this.config.baseURL}/auth/login`
      );
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
    const response: AxiosResponse<any> = await this.instance.get(
      endpoint,
      { params }
    );
    
    // Handle different API response formats
    if (response.data && typeof response.data === 'object') {
      // Standard format: { data: T }
      if ('data' in response.data && response.data.data !== undefined) {
        return response.data.data;
      }
      // Direct data format: T
      return response.data;
    }
    
    // Fallback
    return response.data;
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
   * Cooperative Categories API
   */
  cooperativeCategories = {
    getAll: (filters?: CooperativeCategoryFilters) =>
      this.getPaginated<CooperativeCategory>(
        "/cooperative-categories",
        filters
      ),
    getById: (id: string) =>
      this.get<CooperativeCategory>(`/cooperative-categories/${id}`),
    create: (data: Partial<CooperativeCategory>) =>
      this.post<CooperativeCategory>("/cooperative-categories", data),
    update: (id: string, data: Partial<CooperativeCategory>) =>
      this.patch<CooperativeCategory>(`/cooperative-categories/${id}`, data),
    reorder: (data: Array<{ id: string; sortOrder: number }>) =>
      this.patch<{ message: string }>("/cooperative-categories/reorder", data),
    delete: (id: string) =>
      this.delete<{ message: string }>(`/cooperative-categories/${id}`),
    getStats: () =>
      this.get<CooperativeCategoryStats>("/cooperative-categories/stats"),
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
    getAnalytics: (filters?: { fromDate?: string; toDate?: string }) =>
      this.get("/analytics/payments", filters),
    getRevenueAnalytics: (filters?: { period?: string; cooperativeId?: string }) =>
      this.get("/analytics/revenue", filters),
  };

  /**
   * Balance Redistribution & Cooperative Analysis API (Admin Only)
   * 
   * Comprehensive balance distribution analysis helps administrators understand and track 
   * how payment amounts are distributed between cooperatives and platform fees.
   * 
   * Required Roles: ORGANIZATION_ADMIN, SUPER_ADMIN
   */
  balanceRedistribution = {
    /**
     * Get all cooperative balances
     * API: GET /api/v1/balances/cooperatives?month=YYYY-MM
     * 
     * Fetches all cooperatives with their balance information and statistics
     * @param month - Optional month filter in YYYY-MM format (defaults to current month)
     */
    getCooperativeBalances: async (month?: string): Promise<CooperativeBalancesResponse> => {
      const params = month ? { month } : {};
      const response: AxiosResponse<CooperativeBalancesResponse> = await this.instance.get('/balances/cooperatives', { params });
      return response.data;
    },

    /**
     * Get comprehensive balance analysis for a specific cooperative.
     * API: GET /api/v1/balances/analysis/cooperative/:cooperativeId
     * 
     * Fetches ALL completed payments for that cooperative and calculates:
     * - Total Paid Amount (what tenants actually paid)
     * - Cooperative Revenue (baseAmount = amount - 500 RWF fee)  
     * - Platform Fees (500 RWF per payment)
     * - Payment Type Breakdown
     * - Monthly Trends
     */
    getCooperativeAnalysis: async (cooperativeId: string) => {
      return await this.get<CooperativeBalanceAnalysis>(`/balances/analysis/cooperative/${cooperativeId}`);
    },

    /**
     * Redistribute balance for a specific payment
     * POST /balances/redistribute/payment/:id
     * 
     * Shows exactly how much goes to the cooperative (baseAmount) and how much 
     * remains as platform fee (500 RWF)
     */
    redistributePayment: async (
      paymentId: string
    ): Promise<BalanceRedistributionResult> => {
      return await this.post(`/balances/redistribute/payment/${paymentId}`, {});
    },

    /**
     * Process multiple payments for balance redistribution
     * POST /balances/redistribute/batch
     * 
     * View and redistribute balance allocation for multiple payments in a single batch operation
     */
    batchRedistribute: async (
      data: BatchRedistributionRequest
    ): Promise<BatchRedistributionResult> => {
      return await this.post("/balances/redistribute/batch", data);
    },

    /**
     * Get payments that need balance redistribution
     * GET /balances/redistribute/pending
     * 
     * Query payments that need proper balance distribution to cooperatives.
     * Useful for identifying legacy payments where balance allocation hasn't been calculated.
     */
    getPendingRedistributions: async (
      filters?: PendingRedistributionFilters
    ): Promise<PendingRedistributionsResponse> => {
      return await this.get("/balances/redistribute/pending", filters);
    },
  };

  /**
   * Tenants API 
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
     * Get user analytics
     */
    getAnalytics: (filters?: { fromDate?: string; toDate?: string }) =>
      this.get("/analytics/users", filters),

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
   * Analytics API
   */
  analytics = {
    getDashboard: async (period?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year' | 'custom') => {
      // Analytics endpoint returns data directly, not wrapped in data property
      const response: AxiosResponse = await this.instance.get(
        "/analytics/dashboard", 
        period ? { params: { period } } : {}
      );
      return response.data; // Return data directly, not response.data.data
    },
    getSummary: async (period?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year' | 'custom', cooperativeId?: string) => {
      // Analytics summary endpoint returns data directly
      const params: any = {};
      if (period) params.period = period;
      if (cooperativeId) params.cooperativeId = cooperativeId;
      
      const response: AxiosResponse = await this.instance.get(
        "/analytics/summary",
        Object.keys(params).length > 0 ? { params } : {}
      );
      return response.data;
    },
    getActivities: async (period?: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR', activityType?: string) => {
      try {
        const params: any = {};
        if (period) params.period = period;
        if (activityType) params.activityType = activityType;
        
        const response: AxiosResponse = await this.instance.get(
          "/analytics/activities",
          Object.keys(params).length > 0 ? { params } : {}
        );
        return response.data;
      } catch (error) {
        // Log the error but don't throw - endpoint might not exist yet
        console.warn('Analytics activities endpoint not available:', error);
        return null;
      }
    },
    getRevenue: async (period?: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR', cooperativeId?: string) => {
      try {
        const params: any = {};
        if (period) params.period = period;
        if (cooperativeId) params.cooperativeId = cooperativeId;
        
        const response: AxiosResponse = await this.instance.get(
          "/analytics/revenue",
          Object.keys(params).length > 0 ? { params } : {}
        );
        return response.data;
      } catch (error) {
        // Log the error but don't throw - endpoint might not exist yet
        console.warn('Analytics revenue endpoint not available:', error);
        return null;
      }
    },
    getUsers: async (period?: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR', cooperativeId?: string) => {
      try {
        const params: any = {};
        if (period) params.period = period;
        if (cooperativeId) params.cooperativeId = cooperativeId;
        
        const response: AxiosResponse = await this.instance.get(
          "/analytics/users",
          Object.keys(params).length > 0 ? { params } : {}
        );
        return response.data;
      } catch (error) {
        // Log the error but don't throw - endpoint might not exist yet
        console.warn('Analytics users endpoint not available:', error);
        return null;
      }
    },
    exportData: async (type: 'payments' | 'users' | 'revenue', period?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_year' | 'custom', cooperativeId?: string) => {
      const params: any = { type };
      if (period) params.period = period;
      if (cooperativeId) params.cooperativeId = cooperativeId;
      
      const response: AxiosResponse = await this.instance.get(
        "/analytics/export",
        { params, responseType: 'blob' }
      );
      return response.data;
    },
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
