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
      <div className="bg-card border border-border rounded-lg p-4">
        <span className="text-xs font-medium text-muted-foreground">Copies Sold</span>
        <p className="text-2xl font-semibold text-foreground mt-2">
          {totalCopies.toLocaleString("en-IN")}
        </p>
      </div>

      {/* Total Royalties Earned */}
      <div className="bg-card border border-border rounded-lg p-4">
        <span className="text-xs font-medium text-muted-foreground">Total Royalty</span>
        <p className="text-2xl font-semibold text-foreground mt-2">
          {formatCurrency(totalEarned)}
        </p>
      </div>

      {/* Royalty Paid */}
      <div className="bg-card border border-border rounded-lg p-4">
        <span className="text-xs font-medium text-muted-foreground">Royalty Paid</span>
        <p className="text-2xl font-semibold text-foreground mt-2">
          {formatCurrency(totalPaid)}
        </p>
      </div>

      {/* Pending Royalty */}
      <div className="bg-card border border-border rounded-lg p-4">
        <span className="text-xs font-medium text-muted-foreground">Royalty Pending</span>
        <p className="text-2xl font-semibold text-foreground mt-2">
          {formatCurrency(totalPending)}
        </p>
      </div>
    </div>
  );
};
