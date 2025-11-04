// Type definitions for the Copay Super Admin system

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
 * Announcement types (Enhanced for API)
 */
export interface Announcement {
  id: string;
  title: string;
  message: string;
  targetType: AnnouncementTargetType;
  targetCooperativeIds?: string[];
  targetUserIds?: string[];
  notificationTypes: NotificationType[];
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  scheduledFor?: string;
  sentAt?: string;
  expiresAt?: string;
  estimatedRecipientsCount?: number;
  actualRecipientsCount?: number;
  deliveryStats?: {
    [key in NotificationType]?: {
      sent: number;
      delivered: number;
      failed: number;
    };
  };
  createdBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  cooperative?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
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

/**
 * Activity Management types
 */
export type ActivityType = 
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET'
  | 'PAYMENT_CREATED' | 'PAYMENT_COMPLETED' | 'PAYMENT_FAILED'
  | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED'
  | 'ORGANIZATION_CREATED' | 'ORGANIZATION_UPDATED' | 'ORGANIZATION_APPROVED'
  | 'TENANT_CREATED' | 'TENANT_UPDATED' | 'TENANT_DELETED'
  | 'ACCOUNT_REQUEST_CREATED' | 'ACCOUNT_REQUEST_PROCESSED'
  | 'COMPLAINT_CREATED' | 'COMPLAINT_UPDATED' | 'COMPLAINT_RESOLVED'
  | 'REMINDER_CREATED' | 'REMINDER_SENT' | 'REMINDER_FAILED'
  | 'ANNOUNCEMENT_CREATED' | 'ANNOUNCEMENT_SENT'
  | 'SUSPICIOUS_LOGIN' | 'MULTIPLE_FAILED_LOGINS' | 'UNAUTHORIZED_ACCESS'
  | 'ACCOUNT_LOCKED' | 'PASSWORD_RESET_REQUESTED' | 'PASSWORD_CHANGED'
  | 'SYSTEM_BACKUP' | 'SYSTEM_MAINTENANCE' | 'DATA_EXPORT';

export type EntityType = 'USER' | 'PAYMENT' | 'COOPERATIVE' | 'REMINDER' | 'SYSTEM' | 'COMPLAINT' | 'ANNOUNCEMENT';

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  entityType: EntityType;
  entityId: string;
  userId: string;
  cooperativeId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  isSecurityEvent: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: UserRole;
  };
  cooperative?: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
}

export interface ActivityFilters extends BaseFilters {
  type?: ActivityType;
  entityType?: EntityType;
  entityId?: string;
  userId?: string;
  cooperativeId?: string;
  fromDate?: string;
  toDate?: string;
  isSecurityEvent?: boolean;
}

export interface ActivityStats {
  total: number;
  byType: {
    type: ActivityType;
    count: number;
  }[];
  byEntityType: {
    entityType: EntityType;
    count: number;
  }[];
  securityEvents: number;
  last24Hours: number;
  last7Days: number;
}

/**
 * Notification Management types
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'PAYMENT_DUE' | 'PAYMENT_OVERDUE' | 'PAYMENT_RECEIVED' | 'ACCOUNT_UPDATE' | 'SYSTEM_ALERT' | 'ANNOUNCEMENT';
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  reminder?: {
    id: string;
    title: string;
    type: string;
  };
  payment?: {
    id: string;
    amount: number;
    status: string;
  };
}

export interface NotificationFilters extends BaseFilters {
  read?: boolean;
  type?: string;
}

/**
 * Reminder Management types
 */
export type ReminderType = 'PAYMENT_DUE' | 'PAYMENT_OVERDUE' | 'CUSTOM';
export type ReminderStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type NotificationType = 'SMS' | 'EMAIL' | 'IN_APP' | 'PUSH_NOTIFICATION';
export type RecurringPattern = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  type: ReminderType;
  status: ReminderStatus;
  userId: string;
  paymentTypeId?: string;
  reminderDate: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  notificationTypes: NotificationType[];
  advanceNoticeDays?: number;
  customAmount?: number;
  notes?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  paymentType?: {
    id: string;
    name: string;
    description: string;
    amount: number;
  };
  cooperative?: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderData {
  title: string;
  description?: string;
  type: ReminderType;
  paymentTypeId?: string;
  reminderDate: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  notificationTypes: NotificationType[];
  advanceNoticeDays?: number;
  customAmount?: number;
  notes?: string;
}

export interface ReminderFilters extends BaseFilters {
  type?: ReminderType;
  status?: ReminderStatus;
  paymentTypeId?: string;
  fromDate?: string;
  toDate?: string;
  isRecurring?: boolean;
  isDue?: boolean;
}

export interface ReminderStats {
  total: number;
  active: number;
  paused: number;
  completed: number;
  byType: {
    type: ReminderType;
    count: number;
  }[];
  dueToday: number;
  overdue: number;
  recurring: number;
}

/**
 * Complaint Management types
 */
export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Complaint {
  id: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  resolution?: string;
  resolvedAt?: string;
  attachments?: {
    filename: string;
    url: string;
    size: number;
    contentType: string;
  }[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  cooperative: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplaintData {
  cooperativeId?: string;
  title: string;
  description: string;
  priority?: ComplaintPriority;
  attachments?: {
    filename: string;
    url: string;
    size: number;
    contentType: string;
  }[];
}

export interface UpdateComplaintStatusData {
  status: ComplaintStatus;
  resolution?: string;
}

export interface ComplaintFilters extends BaseFilters {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  userId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ComplaintStats {
  total: number;
  byStatus: {
    status: ComplaintStatus;
    count: number;
  }[];
  byPriority: {
    priority: ComplaintPriority;
    count: number;
  }[];
  recentComplaints: Complaint[];
}

/**
 * Announcement Management types
 */
export type AnnouncementStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELLED';
export type AnnouncementPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type AnnouncementTargetType = 'ALL_TENANTS' | 'ALL_ORGANIZATION_ADMINS' | 'SPECIFIC_COOPERATIVE' | 'SPECIFIC_USERS';

export interface CreateAnnouncementData {
  title: string;
  message: string;
  targetType: AnnouncementTargetType;
  targetCooperativeIds?: string[];
  targetUserIds?: string[];
  notificationTypes: NotificationType[];
  priority?: AnnouncementPriority;
  scheduledFor?: string;
  expiresAt?: string;
}

export interface AnnouncementFilters extends BaseFilters {
  status?: AnnouncementStatus;
  priority?: AnnouncementPriority;
  targetType?: AnnouncementTargetType;
}

export interface AnnouncementStats {
  totalAnnouncements: number;
  statusBreakdown: {
    [key in AnnouncementStatus]: number;
  };
  priorityBreakdown: {
    [key in AnnouncementPriority]: number;
  };
  totalRecipientsReached: number;
  last30Days: {
    announcementsSent: number;
    recipientsReached: number;
  };
}