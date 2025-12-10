import { cn } from "@/lib/utils"

interface PageLoaderProps {
  className?: string
  message?: string
}

export function PageLoader({ className, message = "Loading..." }: PageLoaderProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[400px] w-full animate-fade-in",
      className
    )}>
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-muted animate-pulse" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary animate-spin" />
      </div>
      <p className="mt-4 text-muted-foreground animate-pulse-subtle">{message}</p>
    </div>
  )
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-6 animate-pulse space-y-4",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-muted rounded shimmer" />
        <div className="h-8 w-8 bg-muted rounded-full shimmer" />
      </div>
      <div className="h-8 w-32 bg-muted rounded shimmer" />
      <div className="h-3 w-20 bg-muted rounded shimmer" />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-20 bg-muted rounded shimmer" />
        <div className="h-10 w-10 bg-muted rounded-lg shimmer" />
      </div>
      <div className="h-8 w-24 bg-muted rounded mb-2 shimmer" />
      <div className="h-3 w-16 bg-muted rounded shimmer" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden animate-pulse">
      <div className="bg-muted/50 p-4 border-b">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 flex-1 bg-muted rounded shimmer" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex gap-4" style={{ animationDelay: `${i * 100}ms` }}>
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-4 flex-1 bg-muted rounded shimmer" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: items }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="h-10 w-10 bg-muted rounded-full shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted rounded shimmer" />
            <div className="h-3 w-1/2 bg-muted rounded shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded shimmer" />
          <div className="h-4 w-64 bg-muted rounded shimmer" />
        </div>
        <div className="h-10 w-32 bg-muted rounded shimmer" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableSkeleton rows={4} />
        <div className="space-y-4">
          <CardSkeleton />
          <ListSkeleton items={3} />
        </div>
      </div>
    </div>
  )
}
