import React from "react";
import { cn } from "../utils/cn";

const Skeleton = ({ className = "", ...props }) => (
  <div
    className={cn("animate-pulse rounded-lg bg-[var(--muted)]", className)}
    {...props}
  />
);

export const SkeletonCard = () => (
  <div className="flex items-center justify-between gap-5 rounded-xl border border-[var(--record-border)] bg-[var(--bg-card)] p-5 shadow-[var(--record-shadow)]">
    <div className="flex flex-col gap-2">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-4 w-28" />
    </div>
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-14 rounded-lg" />
        <Skeleton className="h-8 w-14 rounded-lg" />
      </div>
    </div>
  </div>
);

export const SkeletonStats = () => (
  <div className="stats-grid mb-6 grid grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="stat-card flex flex-col gap-2 rounded-xl border border-[var(--record-border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-card)]">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-12" />
      </div>
    ))}
  </div>
);

export default Skeleton;
