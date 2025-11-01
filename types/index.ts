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
  organizationId: string;
  organization: Organization;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId: string;
  description: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  failureReason?: string;
}

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
export type PaymentMethod = "MOBILE_MONEY" | "BANK_TRANSFER" | "CREDIT_CARD";

/**
 * Tenant related types
 */
export interface Tenant {
  id: string;
  organizationId: string;
  organization: Organization;
  memberCount: number;
  storageUsed: number; // in MB
  apiCallsThisMonth: number;
  subscriptionStatus: "ACTIVE" | "SUSPENDED" | "CANCELLED";
  lastActivityAt: string;
  createdAt: string;
}

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

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "SUPPORT" | "AUDITOR";

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
  organizationId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}