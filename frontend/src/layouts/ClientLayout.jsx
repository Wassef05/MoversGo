import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { DashboardHeader } from "../components/layout/DashboardHeader";

export function ClientLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <DashboardHeader
          onMenuClick={() => setSidebarOpen(true)}
          title="Espace Client"
          subtitle="Gérez vos demandes de déménagement et comparez vos devis reçus"
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

