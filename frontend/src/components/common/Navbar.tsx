"use client";

import React from "react";
import { useAuth } from "../../context/AuthContext";
import { BookOpen, ShieldCheck, User, RefreshCw, Radio } from "lucide-react";

interface NavbarProps {
  sseConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ sseConnected = false }) => {
  const { user, switchDemoUser, isLoading } = useAuth();

  const isAuthor = user?.role === "AUTHOR";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b0f19]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/10">
            <div className="h-full w-full rounded-xl bg-slate-950 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-lg tracking-tight text-white">
                BookLeaf
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none">
              Author Support & Operations Desk
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Live SSE Stream Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              sseConnected
                ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-400"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
            title={sseConnected ? "Real-time updates active" : "Connecting to event stream..."}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                sseConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              }`}
            />
            <span className="hidden sm:inline">
              {sseConnected ? "Live SSE" : "Connecting..."}
            </span>
            <Radio className="h-3 w-3 sm:hidden" />
          </div>

          {/* Quick Demo Role Switcher Button */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => switchDemoUser("AUTHOR")}
              disabled={isLoading || isAuthor}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isAuthor
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Author View</span>
            </button>

            <button
              onClick={() => switchDemoUser("ADMIN")}
              disabled={isLoading || !isAuthor}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isAuthor
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin Queue</span>
            </button>
          </div>

          {/* Current User Badge */}
          {user && (
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="text-right">
                <p className="text-xs font-medium text-slate-200 leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {user.role === "AUTHOR" ? user.authorCode || "Author" : "Staff Admin"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
