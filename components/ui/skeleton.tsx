import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Base Skeleton Component
 * Provides a shimmer loading effect for content placeholders
 */
function Skeleton({ className, ...props }: SkeletonProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

/**
 * Card Skeleton
 * Loading placeholder for card components
 */
function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
    </div>
  );
}

/**
 * Table Skeleton
 * Loading placeholder for table rows
 */
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      ))}
    </div>
  );
}

/**
 * Stats Card Skeleton
 * Loading placeholder for dashboard stats cards
 */
function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-[100px]" />
        <Skeleton className="h-3 w-[80px]" />
      </div>
    </div>
  );
}

/**
 * Page Skeleton
 * Loading placeholder for entire page layouts
 */
function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      
      {/* Main Content */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-[150px]" />
        <div className="grid gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

export { Skeleton, CardSkeleton, TableSkeleton, StatsCardSkeleton, PageSkeleton };