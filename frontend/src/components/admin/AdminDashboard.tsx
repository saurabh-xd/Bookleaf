"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import type { Ticket, TicketStatus, Priority, TicketCategory } from "../../types/index";
import { UrgencyFilters, type FilterState } from "./UrgencyFilters";
import { AdminQueue } from "./AdminQueue";
import {
  ShieldAlert,
  Inbox,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Users,
  RefreshCw,
  Bell,
  X,
  Clock,
  ArrowRight,
} from "lucide-react";

interface AdminDashboardProps {
  lastSSEEvent?: any;
  onSelectTicket?: (ticket: Ticket) => void;
}

const SLA_HOURS_MAP: Record<Priority, number> = {
  CRITICAL: 4,
  HIGH: 12,
  MEDIUM: 24,
  LOW: 48,
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lastSSEEvent,
  onSelectTicket,
}) => {
  const { user, switchDemoUser } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [incomingAlert, setIncomingAlert] = useState<{
    ticketId: string;
    ticketNumber: string;
    subject: string;
    priority: string;
    authorName: string;
  } | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    status: "ALL",
    category: "ALL",
    priority: "ALL",
    search: "",
    sortBy: "urgent",
    breachedOnly: false,
  });

  const loadTickets = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await api.tickets.list({
        sortBy: filters.sortBy,
      });
      if (res.success && res.data) {
        setTickets(res.data);
      }
    } catch (err) {
      console.error("Failed to load admin queue:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters.sortBy]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Reactive SSE Event Handler
  useEffect(() => {
    if (!lastSSEEvent) return;

    const { type, data } = lastSSEEvent;

    if (type === "TICKET_CREATED") {
      // Flash incoming ticket notification banner
      setIncomingAlert({
        ticketId: data.id || data.ticket?.id,
        ticketNumber: data.ticketNumber || data.ticket?.ticketNumber || "TICK-NEW",
        subject: data.subject || data.ticket?.subject || "New Author Inquiry",
        priority: data.priority || data.ticket?.priority || "MEDIUM",
        authorName: data.author?.name || data.ticket?.author?.name || "Author",
      });
      // Refresh tickets list
      loadTickets(true);
    } else if (type === "TICKET_UPDATED" || type === "NEW_MESSAGE") {
      loadTickets(true);
    }
  }, [lastSSEEvent, loadTickets]);

  // Check if a ticket has breached SLA
  const isTicketBreached = useCallback((ticket: Ticket): boolean => {
    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") return false;
    const createdTime = new Date(ticket.createdAt).getTime();
    const allowedMs = (SLA_HOURS_MAP[ticket.priority] || 48) * 60 * 60 * 1000;
    return Date.now() > createdTime + allowedMs;
  }, []);

  // Compute Queue Counts
  const counts = useMemo(() => {
    let critical = 0;
    let high = 0;
    let breached = 0;

    tickets.forEach((t) => {
      if (t.status !== "RESOLVED" && t.status !== "CLOSED") {
        if (t.priority === "CRITICAL") critical += 1;
        if (t.priority === "HIGH") high += 1;
        if (isTicketBreached(t)) breached += 1;
      }
    });

    return {
      total: tickets.length,
      critical,
      high,
      breached,
    };
  }, [tickets, isTicketBreached]);

  // Filter & Sort tickets
  const filteredTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        // Status filter
        if (filters.status !== "ALL" && t.status !== filters.status) return false;

        // Category filter
        if (filters.category !== "ALL" && t.category !== filters.category) return false;

        // Priority filter
        if (filters.priority !== "ALL" && t.priority !== filters.priority) return false;

        // Breached only preset
        if (filters.breachedOnly && !isTicketBreached(t)) return false;

        // Search query
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchesTicketNum = t.ticketNumber.toLowerCase().includes(q);
          const matchesSubject = t.subject.toLowerCase().includes(q);
          const matchesAuthor = t.author?.name.toLowerCase().includes(q);
          const matchesBook = t.book?.title.toLowerCase().includes(q);
          if (!matchesTicketNum && !matchesSubject && !matchesAuthor && !matchesBook) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "urgent") {
          const priorityWeights: Record<Priority, number> = {
            CRITICAL: 4,
            HIGH: 3,
            MEDIUM: 2,
            LOW: 1,
          };
          const weightDiff = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
          if (weightDiff !== 0) return weightDiff;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (filters.sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
      });
  }, [tickets, filters, isTicketBreached]);

  const handleTicketClick = (ticket: Ticket) => {
    if (onSelectTicket) {
      onSelectTicket(ticket);
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-Time Incoming Ticket Alert Banner */}
      {incomingAlert && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-900/30 to-amber-950/40 border border-amber-500/40 shadow-xl backdrop-blur-xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 animate-bounce">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-200 flex items-center gap-2">
                <span>New Incoming Ticket: {incomingAlert.ticketNumber}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800">
                  {incomingAlert.priority} Urgency
                </span>
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                From <strong className="text-white">{incomingAlert.authorName}</strong>: &quot;{incomingAlert.subject}&quot;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const target = tickets.find((t) => t.id === incomingAlert.ticketId);
                if (target && onSelectTicket) onSelectTicket(target);
                setIncomingAlert(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors"
            >
              View Ticket
            </button>
            <button
              type="button"
              onClick={() => setIncomingAlert(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Admin Dashboard Operations Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-[#0f172a]/70 to-[#0b0f19] backdrop-blur-2xl shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg flex-shrink-0">
              <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center text-amber-300 font-heading font-extrabold text-xl">
                OP
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Operations Triage Board
                </h1>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold inline-flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-amber-400" />
                  Operations Admin
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {user?.email || "admin@bookleaf.com"}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Prioritized support queue powered by Vercel AI SDK auto-classification, SLA timers, and pgvector knowledge retrieval.
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => loadTickets(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-slate-400 ${isRefreshing ? "animate-spin text-amber-400" : ""}`}
              />
              <span>{isRefreshing ? "Refreshing..." : "Refresh Queue"}</span>
            </button>

            <button
              type="button"
              onClick={() => switchDemoUser("AUTHOR")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              <Users className="h-4 w-4 text-teal-400" />
              <span>Switch to Author Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Metrics Cards (4 Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Queue */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Active Queue</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <Inbox className="h-4 w-4" />
            </div>
          </div>
          <p className="font-heading text-3xl font-extrabold text-white tracking-tight">
            {counts.total}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Pending author inquiries</p>
        </div>

        {/* Critical Urgency (<4h SLA) */}
        <div className="glass-card rounded-2xl p-5 border border-rose-900/40 bg-gradient-to-br from-slate-900 to-rose-950/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-rose-300">Critical (&lt;4h SLA)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <p className="font-heading text-3xl font-extrabold text-rose-200 tracking-tight">
            {counts.critical}
          </p>
          <p className="text-[11px] text-rose-300/80 mt-1">Print flaws & urgent legal issues</p>
        </div>

        {/* SLA At Risk / Breached */}
        <div className="glass-card rounded-2xl p-5 border border-amber-900/40 bg-gradient-to-br from-slate-900 to-amber-950/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-amber-300">SLA At Risk / Breached</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="font-heading text-3xl font-extrabold text-amber-200 tracking-tight">
            {counts.breached}
          </p>
          <p className="text-[11px] text-amber-300/80 mt-1">Requires immediate intervention</p>
        </div>

        {/* AI Auto-Triage Rate */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">AI Triage Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="font-heading text-3xl font-extrabold text-emerald-300 tracking-tight">
            100%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Vercel AI SDK + pgvector drafts</p>
        </div>
      </div>

      {/* Urgency Filters Bar */}
      <UrgencyFilters
        filters={filters}
        onFilterChange={setFilters}
        counts={counts}
      />

      {/* Admin Queue Table / Card List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
            <span>Triage Queue</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredTickets.length} {filteredTickets.length === 1 ? "Ticket" : "Tickets"}
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            Sorted by: <strong className="text-amber-400">{filters.sortBy === "urgent" ? "Urgency First" : filters.sortBy}</strong>
          </span>
        </div>

        <AdminQueue
          tickets={filteredTickets}
          isLoading={isLoading}
          onSelectTicket={handleTicketClick}
        />
      </div>
    </div>
  );
};
