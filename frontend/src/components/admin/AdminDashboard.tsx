"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import type { Ticket, Priority } from "../../types/index";
import { UrgencyFilters, type FilterState } from "./UrgencyFilters";
import { AdminQueue } from "./AdminQueue";
import { TicketResolutionWorkspace } from "./TicketResolutionWorkspace";
import { RefreshCw, X } from "lucide-react";

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
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [incomingAlert, setIncomingAlert] = useState<{
    ticketId: string;
    ticketNumber: string;
    subject: string;
    priority: string;
    authorName: string;
  } | null>(null);

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

  useEffect(() => {
    if (!lastSSEEvent) return;
    const { event, data } = lastSSEEvent;

    if (event === "TICKET_CREATED") {
      setIncomingAlert({
        ticketId: data.id || data.ticket?.id,
        ticketNumber: data.ticketNumber || data.ticket?.ticketNumber || "TICK",
        subject: data.subject || data.ticket?.subject || "New inquiry",
        priority: data.priority || data.ticket?.priority || "MEDIUM",
        authorName: data.author?.name || data.ticket?.author?.name || "Author",
      });
      loadTickets(true);
    } else if (event === "TICKET_UPDATED" || event === "NEW_MESSAGE") {
      loadTickets(true);
    }
  }, [lastSSEEvent, loadTickets]);

  const isTicketBreached = useCallback((ticket: Ticket): boolean => {
    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") return false;
    const createdTime = new Date(ticket.createdAt).getTime();
    const allowedMs = (SLA_HOURS_MAP[ticket.priority] || 48) * 60 * 60 * 1000;
    return Date.now() > createdTime + allowedMs;
  }, []);

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

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        if (filters.status !== "ALL" && t.status !== filters.status) return false;
        if (filters.category !== "ALL" && t.category !== filters.category) return false;
        if (filters.priority !== "ALL" && t.priority !== filters.priority) return false;
        if (filters.breachedOnly && !isTicketBreached(t)) return false;

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
    setSelectedTicket(ticket);
    if (onSelectTicket) {
      onSelectTicket(ticket);
    }
  };

  if (selectedTicket) {
    return (
      <TicketResolutionWorkspace
        ticket={selectedTicket}
        onBack={() => {
          setSelectedTicket(null);
          loadTickets(true);
        }}
        onTicketUpdated={(updated) => {
          setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          setSelectedTicket(updated);
        }}
        lastSSEEvent={lastSSEEvent}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {incomingAlert && (
        <div className="p-3 rounded-md bg-muted border border-border flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-foreground">
              New: {incomingAlert.ticketNumber} ({incomingAlert.priority})
            </span>
            <span className="text-muted-foreground ml-2">
              From {incomingAlert.authorName}: {incomingAlert.subject}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const target = tickets.find((t) => t.id === incomingAlert.ticketId);
                if (target) setSelectedTicket(target);
                setIncomingAlert(null);
              }}
              className="text-xs underline font-medium text-foreground"
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => setIncomingAlert(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Operations Queue
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {user?.email || "admin@bookleaf.com"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadTickets(true)}
          disabled={isRefreshing || isLoading}
          className="p-2 text-xs rounded-full border border-border bg-card hover:bg-secondary/40 text-foreground transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs hover:border-secondary/60 transition-all">
          <span className="text-xs font-medium text-muted-foreground">Active Queue</span>
          <p className="text-2xl font-bold text-foreground mt-2">{counts.total}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs hover:border-secondary/60 transition-all">
          <span className="text-xs font-medium text-muted-foreground">Critical (&lt;4h)</span>
          <p className="text-2xl font-bold text-destructive mt-2">{counts.critical}</p>
        </div>

        <div className="bg-secondary/25 dark:bg-secondary/15 border border-secondary/60 rounded-xl p-4 shadow-2xs transition-all">
          <span className="text-xs font-semibold text-secondary-foreground">Overdue Breached</span>
          <p className="text-2xl font-bold text-secondary-foreground mt-2">{counts.breached}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs hover:border-secondary/60 transition-all">
          <span className="text-xs font-medium text-muted-foreground">AI Triage</span>
          <p className="text-2xl font-bold text-foreground mt-2">100%</p>
        </div>
      </div>

      {/* Filters */}
      <UrgencyFilters
        filters={filters}
        onFilterChange={setFilters}
        counts={counts}
      />

      {/* Queue List */}
      <div>
        <div className="flex items-center justify-between mb-2.5 text-xs text-muted-foreground">
          <span>Tickets ({filteredTickets.length})</span>
          <span>Sort: {filters.sortBy}</span>
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
