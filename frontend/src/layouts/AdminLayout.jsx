import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { DashboardHeader } from "../components/layout/DashboardHeader";
import {
  ShieldAlert,
  Activity,
  Globe2,
  Lock,
  Layers,
  Sparkles,
  Server
} from "lucide-react";

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar with dark theme */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Executive Top System Ticker */}
        <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-[11px] px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3 text-slate-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-bold text-slate-200">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Plateforme MoversGo</span>
            </span>
            <span className="hidden sm:inline-block text-slate-700">|</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
              <Globe2 className="w-3 h-3 text-slate-500" />
              <span>Tunis (GMT+1) • Couverture 24 Gouvernorats</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="hidden md:inline-flex items-center gap-1.5 text-slate-400">
              <Server className="w-3 h-3 text-emerald-400" />
              <span>Passerelles CIB & Konnect : <strong className="text-emerald-400 font-mono">100% UP</strong></span>
            </span>
            <span className="bg-brand-950/80 text-brand-300 border border-brand-800/60 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
              SUPER ADMIN
            </span>
          </div>
        </div>

        {/* Dashboard Header */}
        <DashboardHeader
          onMenuClick={() => setSidebarOpen(true)}
          title="Supervision Haute Direction"
          subtitle="Console nationale de régulation, conformité transporteurs et transactions"
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto text-slate-900 bg-slate-50 rounded-t-3xl sm:rounded-t-[32px] mt-2 shadow-inner min-h-[calc(100vh-8rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
