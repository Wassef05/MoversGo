import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminService } from "../../services/api/adminService";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/cn";
import { InvoiceModal } from "../../components/common/InvoiceModal";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  Eye,
  FileText,
  Search,
  RotateCcw,
  Truck,
  CheckCircle2,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export function AdminBookingsPage() {
  const { onBookingUpdate } = useNotifications();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceBookingId, setSelectedInvoiceBookingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadBookings = async () => {
    try {
      const res = await adminService.getAllBookings();
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.bookings)
            ? res.bookings
            : [];
      setBookings(list);
    } catch (err) {
      console.error("Erreur chargement réservations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    const unreg = onBookingUpdate?.("*", () => loadBookings());
    return () => {
      if (typeof unreg === "function") unreg();
    };
  }, [onBookingUpdate]);

  // KPI Summary
  const totalBookings = bookings.length;
  const completedCount = bookings.filter((b) => b.serviceStatus === "completed").length;
  const inProgressCount = bookings.filter(
    (b) => b.serviceStatus === "in_progress" || b.serviceStatus === "preparation"
  ).length;
  const totalVolume = bookings.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);

  // Filtered bookings
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const cName = b.client
        ? `${b.client.firstName || ""} ${b.client.lastName || ""}`.trim()
        : b.clientName || "";
      const compName = b.company?.companyName || b.companyName || "";
      const dep = b.movingRequest?.departureAddress?.city || b.departureCity || "";
      const arr = b.movingRequest?.arrivalAddress?.city || b.arrivalCity || "";
      const bId = String(b._id || b.id || "");
      const term = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !term ||
        cName.toLowerCase().includes(term) ||
        compName.toLowerCase().includes(term) ||
        dep.toLowerCase().includes(term) ||
        arr.toLowerCase().includes(term) ||
        bId.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        b.serviceStatus === statusFilter ||
        b.bookingStatus === statusFilter ||
        b.paymentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
  const paginatedBookings = filtered.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Supervision des Réservations Fermes
            </h1>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
              Contrôle Administratif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Toutes les opérations de déménagement validées avec acompte réglé — Lecture des contrats signés disponible
          </p>
        </div>
        <button
          onClick={loadBookings}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-600" : "text-slate-500"}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle space-y-1">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-2">
            <Truck className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Réservations</p>
          <p className="text-2xl font-black text-slate-900">{totalBookings}</p>
          <p className="text-[11px] text-slate-400">Toutes missions contractualisées</p>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-subtle space-y-1 ring-1 ring-emerald-500/10">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">Missions Clôturées</p>
          <p className="text-2xl font-black text-emerald-600">{completedCount}</p>
          <p className="text-[11px] text-emerald-700 font-medium">
            {totalBookings > 0 ? `${Math.round((completedCount / totalBookings) * 100)}% taux de réalisation` : "0%"}
          </p>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-3xl border border-sky-100 shadow-subtle space-y-1 ring-1 ring-sky-500/10">
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xs text-sky-800 font-semibold uppercase tracking-wider">En Cours / Préparation</p>
          <p className="text-2xl font-black text-sky-600">{inProgressCount}</p>
          <p className="text-[11px] text-sky-700 font-medium">Missions actives sur le terrain</p>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-3xl border border-brand-100 shadow-subtle space-y-1 ring-1 ring-brand-500/10">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-xs text-brand-900 font-semibold uppercase tracking-wider">Volume Brut Total</p>
          <p className="text-2xl font-black text-brand-600">{formatCurrency(totalVolume)}</p>
          <p className="text-[11px] text-slate-400">TTC — Dinars Tunisiens</p>
        </motion.div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Rechercher par client, déménageur, ville..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Toutes" },
            { id: "preparation", label: "En préparation" },
            { id: "in_progress", label: "En cours" },
            { id: "completed", label: "Clôturées" },
            { id: "deposit_paid", label: "Acompte réglé" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Réf. Réservation</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Déménageur</th>
                <th className="py-3.5 px-4">Trajet</th>
                <th className="py-3.5 px-4">Date Prévue</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Acompte Séquestre</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Contrat Signé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <AnimatePresence mode="wait">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Chargement des réservations...
                    </td>
                  </tr>
                ) : paginatedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      Aucune réservation ne correspond aux critères.
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((b) => {
                    const bId = b._id || b.id;
                    const cName = b.client
                      ? `${b.client.firstName || ""} ${b.client.lastName || ""}`.trim()
                      : b.clientName || "Client Particulier";
                    const compName = b.company?.companyName || b.companyName || "Déménageur Agréé";
                    const dep = b.movingRequest?.departureAddress?.city || b.departureCity || "Tunis";
                    const arr = b.movingRequest?.arrivalAddress?.city || b.arrivalCity || "Sousse";
                    const total = b.totalAmount ?? b.quote?.totalPrice ?? 0;
                    const depPaid = b.depositAmount ?? b.depositPaid ?? b.quote?.depositAmount ?? Math.round(total * 0.1);
                    const mDate = b.scheduledDate || b.movingDate || b.createdAt;
                    const mTime = b.movingTime || b.scheduledTime || "08:00";
                    const status = b.serviceStatus || b.bookingStatus || b.status;
                    const hasInvoice =
                      b.paymentStatus === "deposit_paid" || b.paymentStatus === "fully_paid";

                    return (
                      <motion.tr
                        key={String(bId)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          RES-{String(bId).slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{cName}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">{compName}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {dep} ➔ {arr}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {formatDate(mDate)} à {mTime}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {formatCurrency(total)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700">
                          {formatCurrency(depPaid)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {hasInvoice ? (
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceBookingId(String(bId))}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-bold transition-colors shadow-2xs group cursor-pointer"
                              title="Superviser la facture / contrat signé"
                            >
                              <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              <span>Contrat</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">En attente acompte</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-500">
            <span>
              Affichage de{" "}
              <strong className="text-slate-900">{filtered.length === 0 ? 0 : startIndex + 1}</strong> à{" "}
              <strong className="text-slate-900">{endIndex}</strong> sur{" "}
              <strong className="text-slate-900">{filtered.length}</strong> réservations
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-700 text-[11px] font-mono font-medium">
              5 lignes / page
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => handlePageChange(1)} disabled={safePage === 1} className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => handlePageChange(safePage - 1)} disabled={safePage === 1} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Précédent</span>
            </button>
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button key={pageNum} type="button" onClick={() => handlePageChange(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${safePage === pageNum ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-200"}`}>
                  {pageNum}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => handlePageChange(safePage + 1)} disabled={safePage === totalPages} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold cursor-pointer">
              <span>Suivant</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => handlePageChange(totalPages)} disabled={safePage === totalPages} className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Modal for Admin */}
      {selectedInvoiceBookingId && (
        <InvoiceModal
          isOpen={Boolean(selectedInvoiceBookingId)}
          onClose={() => setSelectedInvoiceBookingId(null)}
          bookingId={selectedInvoiceBookingId}
        />
      )}
    </div>
  );
}
