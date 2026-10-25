"use client";

import React from "react";
import type { Ticket, TicketStatus, Priority } from "../../types/index";
import { SLAIndicator } from "./SLAIndicator";
import {
  Sparkles,
  BookOpen,
  User,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  Inbox,
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";

interface AdminQueueProps {
  tickets: Ticket[];
  isLoading: boolean;
  onSelectTicket: (ticket: Ticket) => void;
}

export const AdminQueue: React.FC<AdminQueueProps> = ({
  tickets,
  isLoading,
  onSelectTicket,
}) => {
  const formatCategory = (cat: string) => {
    return cat
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
            Open
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/60">
            In Progress
          </span>
        );
      case "RESOLVED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
            Resolved
          </span>
        );
      case "CLOSED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Closed
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-900/60 border border-slate-800/60" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Inbox className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-slate-200">No tickets in this queue</p>
        <p className="text-xs text-slate-400 mt-1">
          All inquiries matching the selected filters have been resolved or triaged.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => {
        const messageCount = ticket.messages?.length ?? 1;
        const confidence = ticket.aiConfidenceScore ? Math.round(ticket.aiConfidenceScore * 100) : 92;

        return (
          <div
            key={ticket.id}
            onClick={() => onSelectTicket(ticket)}
            className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800/80 hover:border-amber-500/40 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Column: Urgency, SLA, Ticket ID, Author */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-800/40">
                    {ticket.ticketNumber}
                  </span>

                  {/* SLA Indicator */}
                  <SLAIndicator
                    createdAt={ticket.createdAt}
                    priority={ticket.priority}
                    status={ticket.status}
                    compact
                  />

                  {/* Status Badge */}
                  {getStatusBadge(ticket.status)}

                  {/* AI Triage Confidence Badge */}
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-800/40">
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                    <span>AI Triage ({confidence}%)</span>
                  </span>

                  {ticket.isPriorityOverridden && (
                    <span className="text-[10px] text-amber-400 bg-amber-950/30 px-1.5 py-0.2 rounded border border-amber-800/40">
                      Priority Overridden
                    </span>
                  )}
                </div>

                {/* Subject & Author Info */}
                <div>
                  <h4 className="font-heading text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {ticket.subject}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {ticket.description}
                  </p>
                </div>

                {/* Metadata Row: Author name, book, messages */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                  <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                    <User className="h-3 w-3 text-slate-500" />
                    <span>{ticket.author.name}</span>
                    {ticket.author.authorCode && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({ticket.author.authorCode})
                      </span>
                    )}
                  </span>

                  {ticket.book && (
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <BookOpen className="h-3 w-3 text-slate-500" />
                      <span className="truncate max-w-[180px]">{ticket.book.title}</span>
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <MessageSquare className="h-3 w-3 text-amber-400" />
                    <span>
                      {messageCount} {messageCount === 1 ? "Message" : "Messages"}
                    </span>
                  </span>

                  <span className="text-[11px] text-slate-500">
                    Received{" "}
                    {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Right Column: Category & Open Action */}
              <div className="flex items-center lg:flex-col lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80 flex-shrink-0">
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                  {formatCategory(ticket.category)}
                </span>

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-amber-500/20 text-amber-300 group-hover:bg-amber-500 group-hover:text-slate-950 border border-amber-500/30 transition-all"
                >
                  <span>Resolve Ticket</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
