"use client";

import React from "react";
import type { BookSummary } from "../../types/index";

interface RoyaltySummaryProps {
  summary: BookSummary | null;
  bankLinked?: boolean;
}

export const RoyaltySummary: React.FC<RoyaltySummaryProps> = ({ summary }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const totalCopies = summary?.totalCopiesSold ?? 0;
  const totalEarned = summary?.totalRoyaltyEarned ?? 0;
  const totalPaid = summary?.totalRoyaltyPaid ?? 0;
  const totalPending = summary?.totalRoyaltyPending ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Copies Sold */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-2xs hover:border-secondary/60 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Copies Sold</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">Volume</span>
        </div>
        <p className="text-2xl font-semibold text-foreground mt-2">
          {totalCopies.toLocaleString("en-IN")}
        </p>
      </div>

      {/* Total Royalties Earned */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-2xs hover:border-secondary/60 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Total Royalty</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 text-secondary-foreground font-medium">80/20 Net</span>
        </div>
        <p className="text-2xl font-semibold text-foreground mt-2">
          {formatCurrency(totalEarned)}
        </p>
      </div>

      {/* Royalty Paid */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-2xs hover:border-secondary/60 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Royalty Paid</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Disbursed</span>
        </div>
        <p className="text-2xl font-semibold text-foreground mt-2">
          {formatCurrency(totalPaid)}
        </p>
      </div>

      {/* Pending Royalty (Highlighted with warm secondary palette) */}
      <div className="bg-secondary/25 dark:bg-secondary/15 border border-secondary/60 rounded-xl p-4 shadow-2xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-secondary-foreground">Royalty Pending</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-bold shadow-2xs">
            Next Payout
          </span>
        </div>
        <p className="text-2xl font-bold text-secondary-foreground mt-2">
          {formatCurrency(totalPending)}
        </p>
      </div>
    </div>
  );
};
