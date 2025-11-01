// Type definitions for the Co-Pay Super Admin system

/**
 * Authentication related types
 */
export interface LoginCredentials {
  phone: string;
  pin: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: SuperAdmin;
  expires_in: number;
}

export interface SuperAdmin {
  id: string;
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN";
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

/**
 * Organization (Cooperative) related types
 */
export interface Organization {
  id: string;
  name: string;
  code: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  status: OrganizationStatus;
  memberCount?: number;
  totalRevenue?: number;
  monthlyActiveUsers?: number;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
  onboardingStatus?: OnboardingStatus;
}

export interface OrganizationSettings {
  currency: string;
  timezone: string;
  paymentDueDay: number;
  reminderDays: number[];
}

export interface CreateOrganizationRequest {
  name: string;
  code: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  settings: OrganizationSettings;
}

export interface OrganizationAdmin {
  phone: string;
  pin: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ORGANIZATION_ADMIN";
  cooperativeId: string;
}

export type OrganizationStatus = "ACTIVE" | "SUSPENDED" | "PENDING_APPROVAL" | "REJECTED";
export type OnboardingStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export interface Address {
  street: string;
  city: string;
  district: string;
  province: string;
  country: string;
  postalCode?: string;
}

/**
 * Subscription and Payment related types
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: "MONTHLY" | "QUARTERLY" | "YEARLY";
  features: string[];
  maxMembers: number;
}

export interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  description: string;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  paymentType: PaymentType;
  sender: PaymentSender;
  cooperative: PaymentCooperative;
  latestTransaction?: PaymentTransaction;
  transactions?: PaymentTransaction[];
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentType {
  id: string;
  name: string;
  description: string;
  amount?: number;
  amountType?: "FIXED" | "VARIABLE";
}

export interface PaymentSender {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

export interface PaymentCooperative {
  id: string;
  name: string;
  code: string;
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  gatewayTransactionId?: string;
  gatewayReference?: string;
  gatewayResponse?: Record<string, unknown>;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  failureReason?: string;
  webhookReceived?: boolean;
  webhookReceivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStats {
  summary: {
    totalPayments: number;
    totalAmount: number;
    averageAmount: number;
  };
  statusBreakdown: Array<{
    status: PaymentStatus;
    count: number;
    totalAmount: number;
  }>;
  methodBreakdown: Array<{
    method: PaymentMethod;
    count: number;
    totalAmount: number;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: PaymentStatus;
    paymentType: string;
    sender: string;
    senderPhone: string;
    createdAt: string;
  }>;
}

export type PaymentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "TIMEOUT";
export type TransactionStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "TIMEOUT";
export type PaymentMethod = 
  | "MOBILE_MONEY_MTN" 
  | "MOBILE_MONEY_AIRTEL" 
  | "BANK_BK" 
  | "BANK_TRANSFER" 
  | "CREDIT_CARD";

/**
 * Tenant related types
 */
export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  status: TenantStatus;
  cooperativeId: string;
  cooperative?: {
    id: string;
    name: string;
    code: string;
    location?: string;
  };
  paymentStats?: {
    totalPayments: number;
    totalAmount: number;
    averageAmount: number;
    lastPaymentDate?: string;
  };
  complaintCount?: number;
  recentPayments?: Array<{
    id: string;
    amount: number;
    status: PaymentStatus;
    createdAt: string;
  }>;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantStats {
  total: number;
  active: number;
  inactive: number;
  byCooperative: Array<{
    cooperativeId: string;
    cooperativeName: string;
    count: number;
  }>;
  recentRegistrations: number;
}

export interface CreateTenantRequest {
  phone: string;
  pin: string;
  firstName: string;
  lastName: string;
  email?: string;
  cooperativeId: string;
  notes?: string;
}

export interface UpdateTenantRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  status?: TenantStatus;
  cooperativeId?: string;
  pin?: string;
}

export type TenantStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

/**
 * Onboarding Request types
 */
export interface OnboardingRequest {
  id: string;
  organizationName: string;
  contactPerson: string;
  phone: string;
  email: string;
  businessType: string;
  memberCount: number;
  requestedPlan: string;
  status: OnboardingStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  documents: Document[];
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

/**
 * Announcement types
 */
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  targetAudience: "ALL" | "SPECIFIC_ORGS";
  targetOrganizationIds?: string[];
  publishedAt?: string;
  expiresAt?: string;
  status: "DRAFT" | "PUBLISHED" | "EXPIRED";
  createdBy: string;
  createdAt: string;
  viewCount: number;
}

export type AnnouncementType = "MAINTENANCE" | "FEATURE_UPDATE" | "POLICY_CHANGE" | "GENERAL";

/**
 * User Management types
 */
export interface SystemUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
  lastLoginAt?: string;
  createdAt: string;
  permissions: Permission[];
}

export type UserRole = "SUPER_ADMIN" | "ORGANIZATION_ADMIN" | "TENANT";

/**
 * Analytics and Dashboard types
 */
export interface DashboardStats {
  totalOrganizations: number;
  activeOrganizations: number;
  pendingRequests: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  monthlyActiveUsers: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

/**
 * System Settings types
 */
export interface SystemSettings {
  id: string;
  category: SettingsCategory;
  key: string;
  value: string;
  description: string;
  dataType: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
  isPublic: boolean;
  updatedBy: string;
  updatedAt: string;
}

export type SettingsCategory = "GENERAL" | "PAYMENT" | "SECURITY" | "NOTIFICATIONS" | "INTEGRATION";

/**
 * API Response types
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

/**
 * Filter and Search types
 */
export interface BaseFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  search?: string;
}

export interface OrganizationFilters extends BaseFilters {
  status?: OrganizationStatus;
  subscriptionPlan?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface PaymentFilters extends BaseFilters {
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  senderId?: string;
  paymentTypeId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface PaymentStatsFilters {
  fromDate?: string;
  toDate?: string;
}

export interface TenantFilters extends BaseFilters {
  status?: TenantStatus;
  cooperativeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Account Request related types
 */
export type AccountRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AccountRequest {
  id: string;
  fullName: string;
  phone: string;
  roomNumber: string;
  status: AccountRequestStatus;
  cooperativeId: string;
  cooperative?: {
    id: string;
    name: string;
    code: string;
  };
  notes?: string;
  rejectionReason?: string;
  processedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequestData {
  fullName: string;
  phone: string;
  roomNumber: string;
}

export interface ProcessAccountRequestData {
  action: 'APPROVE' | 'REJECT';
  notes?: string;
  rejectionReason?: string;
}

export interface AccountRequestFilters extends BaseFilters {
  status?: AccountRequestStatus;
  cooperativeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AccountRequestStats {
  total: number;
  byStatus: Array<{
    status: AccountRequestStatus;
    count: number;
  }>;
  recentRequests: AccountRequest[];
}

export interface AvailabilityCheck {
  phone?: boolean;
  roomNumber?: boolean;
}

/**
 * User Management related types
 */
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  cooperativeId?: string;
  cooperative?: {
    id: string;
    name: string;
    code: string;
  };
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  phone: string;
  pin: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: UserRole;
  cooperativeId?: string;
}

export interface UpdateUserStatusData {
  isActive: boolean;
}

export interface UserFilters extends BaseFilters {
  role?: UserRole;
  status?: UserStatus;
  cooperativeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UserStats {
  total: number;
  byRole: Array<{
    role: UserRole;
    count: number;
  }>;
  byStatus: Array<{
    status: UserStatus;
    count: number;
  }>;
  recentUsers: User[];
}