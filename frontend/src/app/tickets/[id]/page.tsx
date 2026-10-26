"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useSSE } from "../../../lib/useSSE";
import { api } from "../../../lib/api";
import type { Ticket } from "../../../types/index";
import { Navbar } from "../../../components/common/Navbar";
import { AuthorTicketDetail } from "../../../components/author/AuthorTicketDetail";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

function TicketDetailContent() {
  const params = useParams();
  const ticketId = params?.id as string;

  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Connect to SSE stream
  const { isConnected, lastEvent } = useSSE(token);

  // Redirect unauthenticated users to /login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const loadTicket = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.tickets.getById(ticketId);
      if (res.success && res.data) {
        setTicket(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load ticket details:", err);
      setError(err?.message || "Inquiry not found or access denied.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && ticketId) {
      loadTicket();
    }
  }, [user, ticketId]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0b0f19]">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 text-teal-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">
              Loading support conversation thread...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0b0f19]">
        <Navbar />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">
          <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
            <h2 className="font-heading text-lg font-bold text-white">
              Support Inquiry Unavailable
            </h2>
            <p className="text-xs text-slate-400">
              {error || "The requested ticket does not exist or belongs to another author."}
            </p>
            <button
              type="button"
              onClick={() => router.push("/tickets")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to My Tickets</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19]">
      <Navbar sseConnected={isConnected} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <AuthorTicketDetail
          ticket={ticket}
          onBack={() => router.push("/tickets")}
          onTicketUpdated={(updated) => setTicket(updated)}
          lastSSEEvent={lastEvent}
        />
      </main>
    </div>
  );
}

export default function TicketDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TicketDetailContent />
    </Suspense>
  );
}
