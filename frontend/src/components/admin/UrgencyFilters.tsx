"use client";

import React from "react";
import { Search } from "lucide-react";

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
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      {/* Search & Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              update({
                priority: filters.priority === "CRITICAL" ? "ALL" : "CRITICAL",
                breachedOnly: false,
              })
            }
            className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
              filters.priority === "CRITICAL"
                ? "bg-destructive text-destructive-foreground border-destructive"
                : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Critical ({counts.critical})
          </button>

          <button
            type="button"
            onClick={() =>
              update({
                breachedOnly: !filters.breachedOnly,
                priority: "ALL",
              })
            }
            className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
              filters.breachedOnly
                ? "bg-amber-600 text-white border-amber-600"
                : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Overdue ({counts.breached})
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Select Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border text-xs">
        <select
          value={filters.status}
          onChange={(e) => update({ status: e.target.value })}
          className="bg-card text-foreground border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => update({ priority: e.target.value })}
          className="bg-card text-foreground border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        >
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical (&lt;4h)</option>
          <option value="HIGH">High (&lt;12h)</option>
          <option value="MEDIUM">Medium (&lt;24h)</option>
          <option value="LOW">Low (&lt;48h)</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => update({ category: e.target.value })}
          className="bg-card text-foreground border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        >
          <option value="ALL">All Categories</option>
          <option value="ROYALTY_PAYMENTS">Royalty Payments</option>
          <option value="PRINTING_QUALITY">Printing Quality</option>
          <option value="DISTRIBUTION_AVAILABILITY">Distribution & Platforms</option>
          <option value="ISBN_METADATA">ISBN & Metadata</option>
          <option value="PRODUCTION_UPDATES">Production Updates</option>
          <option value="GENERAL_INQUIRY">General Inquiry</option>
        </select>

        <div className="ml-auto flex items-center gap-1.5 text-muted-foreground">
          <span>Sort:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => update({ sortBy: e.target.value as any })}
            className="bg-card text-foreground border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value="urgent">Urgency First</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
    </div>
  );
};
