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
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

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
    name: 'Organizations',
    href: '/organizations',
    icon: Building2,
    description: 'Manage cooperatives'
  },
  {
    name: 'Payments',
    href: '/payments',
    icon: CreditCard,
    description: 'Payment monitoring & distributions',
    submenu: [
      {
        name: 'Payment Overview',
        href: '/payments',
        description: 'View all payments'
      },
      {
        name: 'Distributions',
        href: '/payments/distributions',
        description: 'Manage monthly distributions'
      }
    ]
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
    <div className="min-h-screen bg-background flex theme-transition">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 sm:w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col theme-transition",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border bg-primary theme-transition">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary-foreground rounded-md flex items-center justify-center theme-transition">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary-foreground font-heading">Copay</h1>
              <p className="text-xs text-primary-foreground/70 font-body">Admin Portal</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10 theme-transition"
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
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const [isSubmenuOpen, setIsSubmenuOpen] = useState(isActive || pathname.startsWith(item.href));

            if (hasSubmenu) {
              return (
                <div key={item.href} className="space-y-1">
                  <button
                    onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-4 sm:py-3 rounded-lg text-sm font-medium transition-all duration-200 group w-full",
                      isActive
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground theme-transition"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground"
                    )} />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className={cn(
                        "text-xs truncate",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        {item.description}
                      </div>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isSubmenuOpen ? "rotate-180" : "",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                  </button>
                  
                  {isSubmenuOpen && (
                    <div className="ml-6 space-y-1 border-l-2 border-border pl-3">
                      {item.submenu.map((subItem) => {
                        const isSubActive = isCurrentPath(subItem.href);
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                            isSubActive
                              ? "bg-primary/10 text-primary border-l-2 border-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground theme-transition"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{subItem.name}</div>
                              <div className={cn(
                                "text-xs truncate",
                                isSubActive ? "text-primary/80" : "text-muted-foreground"
                              )}>
                                {subItem.description}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center space-x-3 px-3 py-4 sm:py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground theme-transition"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  <div className={cn(
                    "text-xs truncate",
                    isActive ? "text-primary/80" : "text-muted-foreground"
                  )}>
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <div className="border-t border-border bg-muted/30 p-3 theme-transition">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors theme-transition"
            >
              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground text-sm font-bold">
                  {user?.firstName?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-muted-foreground">Super Administrator</div>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0",
                userMenuOpen && "rotate-180"
              )} />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg py-1 z-10 theme-transition">
                <div className="px-3 py-2 border-b border-border">
                  <div className="text-sm font-medium text-foreground">
                    {user?.email || user?.phone}
                  </div>
                  <div className="text-xs text-muted-foreground">Online</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-destructive/10 hover:text-destructive transition-colors theme-transition"
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
        <header className="bg-background border-b border-border sticky top-0 z-30 theme-transition">
          <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-foreground capitalize truncate">
                  {pathname === '/dashboard' ? 'Dashboard' : pathname.split('/')[1]}
                </h2>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Welcome back, {user?.firstName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Time display - hidden on small screens */}
              <div className="text-sm text-muted-foreground hidden md:block" suppressHydrationWarning>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User avatar for mobile */}
              <div className="lg:hidden">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-medium">
                    {user?.firstName?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 bg-background overflow-y-auto theme-transition">
          {children}
        </main>
      </div>
    </div>
  );
}