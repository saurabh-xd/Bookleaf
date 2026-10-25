"use client";

import React from "react";
import type { TicketStatus, Priority, TicketCategory } from "../../types/index";
import {
  Filter,
  Search,
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";

export interface FilterState {
  status: string;
  category: string;
  priority: string;
  search: string;
  sortBy: "urgent" | "newest" | "oldest";
  breachedOnly: boolean;
}

interface UrgencyFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  counts: {
    total: number;
    critical: number;
    high: number;
    breached: number;
  };
}

export const UrgencyFilters: React.FC<UrgencyFiltersProps> = ({
  filters,
  onFilterChange,
  counts,
}) => {
  const update = (partial: Partial<FilterState>) => {
    onFilterChange({ ...filters, ...partial });
  };

  const resetFilters = () => {
    onFilterChange({
      status: "ALL",
      category: "ALL",
      priority: "ALL",
      search: "",
      sortBy: "urgent",
      breachedOnly: false,
    });
  };

  const hasActiveFilters =
    filters.status !== "ALL" ||
    filters.category !== "ALL" ||
    filters.priority !== "ALL" ||
    filters.search !== "" ||
    filters.breachedOnly;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800/80 space-y-4">
      {/* Search & Urgency Quick Preset Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket #, subject, or author name..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Quick Triage Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Critical Only Preset */}
          <button
            type="button"
            onClick={() =>
              update({
                priority: filters.priority === "CRITICAL" ? "ALL" : "CRITICAL",
                breachedOnly: false,
              })
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filters.priority === "CRITICAL"
                ? "bg-rose-950/80 text-rose-300 border-rose-600 shadow-sm"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-rose-400" />
            <span>Critical Only</span>
            <span className="px-1.5 py-0.2 rounded-md bg-rose-900/60 text-rose-200 text-[10px]">
              {counts.critical}
            </span>
          </button>

          {/* Overdue / SLA Breached Preset */}
          <button
            type="button"
            onClick={() =>
              update({
                breachedOnly: !filters.breachedOnly,
                priority: "ALL",
              })
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filters.breachedOnly
                ? "bg-amber-950/80 text-amber-300 border-amber-500 shadow-sm"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>SLA At Risk / Breached</span>
            <span className="px-1.5 py-0.2 rounded-md bg-amber-900/60 text-amber-200 text-[10px]">
              {counts.breached}
            </span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Filters Row */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/80 text-xs">
        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Status:</span>
          <select
            value={filters.status}
            onChange={(e) => update({ status: e.target.value })}
            className="bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Priority Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Priority:</span>
          <select
            value={filters.priority}
            onChange={(e) => update({ priority: e.target.value })}
            className="bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical (&lt;4h)</option>
            <option value="HIGH">High (&lt;12h)</option>
            <option value="MEDIUM">Medium (&lt;24h)</option>
            <option value="LOW">Low (&lt;48h)</option>
          </select>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Category:</span>
          <select
            value={filters.category}
            onChange={(e) => update({ category: e.target.value })}
            className="bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="ROYALTY_PAYMENTS">Royalty Payments</option>
            <option value="PRINTING_QUALITY">Printing Quality</option>
            <option value="DISTRIBUTION_AVAILABILITY">Distribution & Platforms</option>
            <option value="ISBN_METADATA">ISBN & Metadata</option>
            <option value="PRODUCTION_UPDATES">Production Updates</option>
            <option value="GENERAL_INQUIRY">General Inquiry</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-slate-400 font-medium">Sort Order:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => update({ sortBy: e.target.value as any })}
            className="bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="urgent">Urgency First (Critical &gt; Low)</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
    </div>
  );
};
