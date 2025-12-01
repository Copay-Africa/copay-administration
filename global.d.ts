/**
 * Global type declarations for the Copay Admin application
 */

// Note: CSS Modules declarations removed as none are used in the project

// Environment Variables
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly NEXT_PUBLIC_API_URL: string;
    readonly NEXT_PUBLIC_APP_NAME: string;
    readonly NEXT_PUBLIC_APP_VERSION: string;
    readonly DATABASE_URL: string;
    readonly JWT_SECRET: string;
    readonly NEXTAUTH_SECRET: string;
    readonly NEXTAUTH_URL: string;
  }
}

// Extend Window object for global utilities
declare interface Window {
  gtag?: (...args: any[]) => void;
  dataLayer?: any[];
}

// Global utility types
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
type Nullable<T> = T | null;
type ValueOf<T> = T[keyof T];

// API Response types
interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  errors?: string[];
}

interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Common UI Component Props
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Error types
interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}

// Authentication types
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export {};