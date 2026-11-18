import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { DashboardHeader } from "../components/layout/DashboardHeader";

export function CompanyLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <DashboardHeader
          onMenuClick={() => setSidebarOpen(true)}
          title="Espace Déménageur Partenaire"
          subtitle="Consultez les demandes, gérez vos devis et optimisez votre planning"
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

