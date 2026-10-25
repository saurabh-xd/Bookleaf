"use client";

import React, { useState, useEffect } from "react";
import type { Priority, TicketStatus } from "../../types/index";
import { Clock, AlertTriangle, Flame, CheckCircle, ShieldAlert } from "lucide-react";

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
    // Tick every 30 seconds for live countdown
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status === "RESOLVED" || status === "CLOSED") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
        <CheckCircle className="h-3 w-3" />
        <span>SLA Met</span>
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
        className={`inline-flex items-center gap-1.5 font-bold rounded-md border animate-pulse ${
          compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-1"
        } bg-rose-950/80 text-rose-300 border-rose-600 shadow-sm shadow-rose-900/50`}
        title={`SLA Breached! Target resolution was within ${SLA_HOURS_MAP[priority]} hours`}
      >
        <Flame className="h-3.5 w-3.5 text-rose-400" />
        <span>
          OVERDUE +{hours}h {minutes}m
        </span>
      </span>
    );
  }

  // Warning threshold: less than 25% time left or less than 1 hour left
  const isWarning = remainingMs < allowedMs * 0.25 || remainingMs < 60 * 60 * 1000;

  if (isWarning) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-md border ${
          compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-1"
        } bg-amber-950/60 text-amber-300 border-amber-600/60`}
      >
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        <span>
          {hours > 0 ? `${hours}h ` : ""}
          {minutes}m remaining
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${
        compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2.5 py-1"
      } bg-slate-900/80 text-slate-300 border-slate-700/60`}
    >
      <Clock className="h-3 w-3 text-slate-400" />
      <span>
        {hours > 0 ? `${hours}h ` : ""}
        {minutes}m left ({SLA_HOURS_MAP[priority]}h SLA)
      </span>
    </span>
  );
};
