"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useSSE } from "../../../lib/useSSE";
import { api } from "../../../lib/api";
import type { Ticket } from "../../../types/index";
import { Navbar } from "../../../components/common/Navbar";
import { AuthorTicketDetail } from "../../../components/author/AuthorTicketDetail";
import { ArrowLeft, Loader2 } from "lucide-react";

function TicketDetailContent() {
  const params = useParams();
  const ticketId = params?.id as string;

  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { isConnected, lastEvent } = useSSE(token);

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
      setError(err?.message || "Ticket not found.");
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
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </main>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-12">
          <div className="bg-card border border-border rounded-lg p-6 text-center space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Ticket Unavailable
            </h2>
            <p className="text-xs text-muted-foreground">{error || "Not found."}</p>
            <button
              type="button"
              onClick={() => router.push("/tickets")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-border hover:bg-muted"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Tickets</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar sseConnected={isConnected} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6">
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
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TicketDetailContent />
    </Suspense>
  );
}
