import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional class handling with tailwind-merge for proper class deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency values with error handling
 */
export function formatCurrency(amount: number, currency = 'RWF'): string {
  try {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if Intl is not supported
    return `${currency} ${formatNumber(amount)}`;
  }
}

/**
 * Format numbers with thousands separators
 */
export function formatNumber(num: number): string {
  try {
    return new Intl.NumberFormat('en-US').format(num);
  } catch {
    // Fallback formatting
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

/**
 * Utility function to truncate text safely
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Format dates consistently across the app
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return formatDate(dateObj);
    }
  } catch {
    return 'Unknown time';
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Rwanda format)
 */
export function isValidRwandanPhone(phone: string): boolean {
  // Rwanda phone format: +250XXXXXXXXX or 07XXXXXXXX
  const phoneRegex = /^(\+250|0)?7[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('250')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('07') && cleaned.length === 10) {
    return `+250${cleaned.slice(1)}`;
  }
  
  return phone;
}

/**
 * Get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred';
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Environment utilities
 */
export const env = {
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  get apiUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  },
  
  get appName(): string {
    return process.env.NEXT_PUBLIC_APP_NAME || 'Copay Admin';
  },
  
  get isDebugEnabled(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true';
  }
};

/**
 * Local storage utilities with error handling
 */
export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      if (typeof window === 'undefined') return fallback;
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },
  
  set(key: string, value: unknown): boolean {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove(key: string): boolean {
    try {
      if (typeof window === 'undefined') return false;
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};