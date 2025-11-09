'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Users,
  FileText,
  Megaphone,
  UserCheck,
  Menu,
  X,
  LogOut,
  Shield,
  ChevronDown,
  Activity,
  Bell,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

/**
 * Navigation items for the Super Admin dashboard
 */
const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Reports & data insights'
  },
  {
    name: 'Activities',
    href: '/activities',
    icon: Activity,
    description: 'Audit logs & security'
  },
  {
    name: 'Audit Trail',
    href: '/audit-trail',
    icon: Shield,
    description: 'Security & audit logging'
  },
  {
    name: 'Complaints',
    href: '/complaints',
    icon: MessageSquare,
    description: 'Issue management & resolution'
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: Bell,
    description: 'Message center & delivery tracking'
  },
  {
    name: 'Organizations',
    href: '/organizations',
    icon: Building2,
    description: 'Manage cooperatives'
  },
  {
    name: 'Payments',
    href: '/payments',
    icon: CreditCard,
    description: 'Payment monitoring'
  },
  {
    name: 'Tenants',
    href: '/tenants',
    icon: Users,
    description: 'Tenant management'
  },
  {
    name: 'Requests',
    href: '/requests',
    icon: FileText,
    description: 'Onboarding requests'
  },
  {
    name: 'Announcements',
    href: '/announcements',
    icon: Megaphone,
    description: 'System announcements'
  },
  {
    name: 'Users',
    href: '/users',
    icon: UserCheck,
    description: 'User management'
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Main Dashboard Layout Component
 * Premium fintech sidebar design with Copay branding
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isCurrentPath = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b bg-copay-navy">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center">
              <Shield className="h-5 w-5 text-copay-navy" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Copay</h1>
              <p className="text-xs text-copay-light-blue">Admin Portal</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isCurrentPath(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-copay-blue text-white shadow-md"
                    : "text-copay-gray hover:bg-gray-50 hover:text-copay-navy"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-white" : "text-copay-gray group-hover:text-copay-navy"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  <div className={cn(
                    "text-xs truncate",
                    isActive ? "text-white/80" : "text-copay-gray"
                  )}>
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <div className="border-t bg-gray-50 p-3">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg hover:bg-white transition-colors"
            >
              <div className="h-10 w-10 bg-copay-navy rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">
                  {user?.firstName?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-semibold text-copay-navy truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-copay-gray">Super Administrator</div>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-copay-gray transition-transform flex-shrink-0",
                userMenuOpen && "rotate-180"
              )} />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border rounded-lg shadow-xl py-1 z-10">
                <div className="px-3 py-2 border-b">
                  <div className="text-sm font-medium text-copay-navy">
                    {user?.email || user?.phone}
                  </div>
                  <div className="text-xs text-copay-gray">Online</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Top header */}
        <header className="bg-white border-b shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-copay-navy capitalize truncate">
                  {pathname === '/dashboard' ? 'Dashboard' : pathname.split('/')[1]}
                </h2>
                <p className="text-sm text-copay-gray hidden sm:block">
                  Welcome back, {user?.firstName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Time display - hidden on small screens */}
              <div className="text-sm text-copay-gray hidden md:block" suppressHydrationWarning>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>

              {/* User avatar for mobile */}
              <div className="lg:hidden">
                <div className="h-8 w-8 bg-copay-navy rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}