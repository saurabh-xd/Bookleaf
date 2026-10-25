"use client";

import React from "react";
import type { BookSummary } from "../../types/index";
import {
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Info,
  Sparkles,
} from "lucide-react";

interface RoyaltySummaryProps {
  summary: BookSummary | null;
  bankLinked?: boolean;
}

export const RoyaltySummary: React.FC<RoyaltySummaryProps> = ({
  summary,
  bankLinked = true,
}) => {
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
    <div className="space-y-4">
      {/* Top Banner Notice: Policy & Linked Account */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">
              BookLeaf 80/20 Net Profit Royalty Plan
            </p>
            <p className="text-[11px] text-slate-400">
              Calculated quarterly. Disbursed within 45 days of quarter end (₹1,000 minimum threshold).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {bankLinked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/60">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Direct Bank Deposit Verified</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-800/60">
              <Info className="h-3.5 w-3.5 text-amber-400" />
              <span>Bank Details Needed</span>
            </span>
          )}
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Copies Sold */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Copies Sold</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {totalCopies.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Across all live sales platforms</span>
          </p>
        </div>

        {/* Total Royalties Earned */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Earned</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatCurrency(totalEarned)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Lifetime net profit share (80%)
          </p>
        </div>

        {/* Royalty Paid */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Royalty Disbursed</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {formatCurrency(totalPaid)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Successfully credited to account
          </p>
        </div>

        {/* Pending Royalty Balance */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-slate-900/80 to-amber-950/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-amber-300">Current Pending</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-extrabold text-amber-200 tracking-tight">
            {formatCurrency(totalPending)}
          </p>
          <p className="text-[11px] text-amber-400/80 mt-1">
            {totalPending >= 1000
              ? "Queued for next quarterly cycle"
              : "Rolls over until ₹1,000 threshold"}
          </p>
        </div>
      </div>
    </div>
  );
};
