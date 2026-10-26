"use client";

import React, { useState, useEffect } from "react";
import type { Priority, TicketStatus } from "../../types/index";

interface SLAIndicatorProps {
  createdAt: string;
  priority: Priority;
  status: TicketStatus;
  compact?: boolean;
}

const SLA_HOURS_MAP: Record<Priority, number> = {
  CRITICAL: 4,
  HIGH: 12,
  MEDIUM: 24,
  LOW: 48,
};

export const SLAIndicator: React.FC<SLAIndicatorProps> = ({
  createdAt,
  priority,
  status,
  compact = false,
}) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status === "RESOLVED" || status === "CLOSED") {
    return (
      <span className="text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded bg-muted border border-border">
        SLA Met
      </span>
    );
  }

  const createdTime = new Date(createdAt).getTime();
  const allowedMs = (SLA_HOURS_MAP[priority] || 48) * 60 * 60 * 1000;
  const deadline = createdTime + allowedMs;
  const remainingMs = deadline - now;
  const isOverdue = remainingMs < 0;

  const absRemaining = Math.abs(remainingMs);
  const hours = Math.floor(absRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((absRemaining % (1000 * 60 * 60)) / (1000 * 60));

  if (isOverdue) {
    return (
      <span
        className={`font-semibold rounded border border-destructive/40 bg-destructive/10 text-destructive ${
          compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"
        }`}
      >
        Overdue +{hours}h {minutes}m
      </span>
    );
  }

  const isWarning = remainingMs < allowedMs * 0.25 || remainingMs < 60 * 60 * 1000;

  if (isWarning) {
    return (
      <span
        className={`font-medium rounded border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 ${
          compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"
        }`}
      >
        {hours > 0 ? `${hours}h ` : ""}{minutes}m left
      </span>
    );
  }

  return (
    <span
      className={`font-medium rounded border border-border bg-muted text-muted-foreground ${
        compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"
      }`}
    >
      {hours > 0 ? `${hours}h ` : ""}{minutes}m left ({SLA_HOURS_MAP[priority]}h SLA)
    </span>
  );
};
