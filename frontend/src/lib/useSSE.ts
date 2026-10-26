"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { SSEEventType } from "../types/index";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface SSEEventDetail {
  event: SSEEventType;
  data: any;
  timestamp: string;
}

export type SSEEventHandler = (detail: SSEEventDetail) => void;

const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API_BASE_URL = rawUrl.endsWith("/api")
  ? rawUrl
  : `${rawUrl.replace(/\/+$/, "")}/api`;

export function useSSE(token: string | null, onEvent?: SSEEventHandler) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [lastEvent, setLastEvent] = useState<SSEEventDetail | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);

  // Keep callback reference fresh without causing re-connects
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const handleMessage = useCallback((event: SSEEventType, rawData: string) => {
    try {
      const data = JSON.parse(rawData);
      const detail: SSEEventDetail = {
        event,
        data,
        timestamp: new Date().toISOString(),
      };
      setLastEvent(detail);
      onEventRef.current?.(detail);
    } catch (err) {
      console.warn("Failed to parse SSE payload:", err, rawData);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setStatus("disconnected");
      return;
    }

    setStatus("connecting");

    const url = `${API_BASE_URL}/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setStatus("connected");
    };

    es.onerror = () => {
      setStatus("disconnected");
    };

    // Register listeners for all domain event types
    const events: SSEEventType[] = ["CONNECTED", "TICKET_CREATED", "TICKET_UPDATED", "NEW_MESSAGE"];

    events.forEach((eventType) => {
      es.addEventListener(eventType, (e: MessageEvent) => {
        handleMessage(eventType, e.data);
      });
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
      setStatus("disconnected");
    };
  }, [token, handleMessage]);

  return {
    status,
    lastEvent,
    isConnected: status === "connected",
  };
}
