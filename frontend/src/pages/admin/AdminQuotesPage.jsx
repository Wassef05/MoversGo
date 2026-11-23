import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminService } from "../../services/api/adminService";
import { useNotifications } from "../../contexts/NotificationContext";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/cn";
import {
  Search,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building,
  MapPin,
  TrendingUp,
  Percent,
  Receipt,
  RotateCcw
} from "lucide-react";

export function AdminQuotesPage() {
  const { onQuoteUpdate } = useNotifications();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadQuotes = async () => {
    try {
      const res = await adminService.getAllQuotes({ limit: 100 });
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.quotes)
            ? res.quotes
            : [];
      setQuotes(list);
    } catch (err) {
      console.error("Erreur chargement devis:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
    const unreg = onQuoteUpdate?.(() => {
      loadQuotes();
    });
    return () => {
      if (typeof unreg === "function") unreg();
    };
  }, [onQuoteUpdate]);

  // Overall KPI metrics
  const totalQuotesCount = quotes.length;
  const acceptedQuotesCount = quotes.filter((q) => q.status === "accepted").length;
  const pendingQuotesCount = quotes.filter((q) => q.status === "submitted" || q.status === "viewed").length;
  const totalVolumeTTC = quotes.reduce((sum, q) => {
    const total = q.totalPrice ?? q.pricing?.total ?? q.price?.total ?? 0;
    return sum + (q.status === "accepted" ? total : 0);
  }, 0);

  // Filtered quotes based on search & status
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const qId = String(q._id || q.id || "").toLowerCase();
      const cName = (
        q.company?.companyName ||
        q.companyName ||
        q.companyId?.commercialName ||
        q.companyId?.legalName ||
        ""
      ).toLowerCase();
      const clientName = (
        q.movingRequest?.client
          ? `${q.movingRequest.client.firstName || ""} ${q.movingRequest.client.lastName || ""}`
          : q.clientName || ""
      ).toLowerCase();
      const reqTitle = (q.movingRequest?.title || q.requestTitle || "").toLowerCase();
      const depCity = (q.movingRequest?.departureAddress?.city || "").toLowerCase();
      const arrCity = (q.movingRequest?.arrivalAddress?.city || "").toLowerCase();

      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        qId.includes(term) ||
        cName.includes(term) ||
        clientName.includes(term) ||
        reqTitle.includes(term) ||
        depCity.includes(term) ||
        arrCity.includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        q.status === statusFilter ||
        (statusFilter === "pending" && (q.status === "submitted" || q.status === "viewed"));

      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchTerm, statusFilter]);

  // Pagination computations
  const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / itemsPerPage));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredQuotes.length);
  const paginatedQuotes = filteredQuotes.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Supervision des Devis & Propositions
            </h1>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
              Contrôle Administratif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Surveillance et audit de l'ensemble des propositions tarifaires déposées par les transporteurs agréés
          </p>
        </div>

        <button
          onClick={loadQuotes}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-600" : "text-slate-500"}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-subtle space-y-1"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-2">
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Devis Émis</p>
          <p className="text-2xl font-black text-slate-900">{totalQuotesCount}</p>
          <p className="text-[11px] text-slate-400">Toutes entreprises confondues</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-subtle space-y-1 ring-1 ring-emerald-500/10"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">Devis Acceptés</p>
          <p className="text-2xl font-black text-emerald-600">{acceptedQuotesCount}</p>
          <p className="text-[11px] text-emerald-700 font-medium">
            {totalQuotesCount > 0 ? `${Math.round((acceptedQuotesCount / totalQuotesCount) * 100)}% de conversion` : "0%"}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-3xl border border-amber-100 shadow-subtle space-y-1 ring-1 ring-amber-500/10"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xs text-amber-800 font-semibold uppercase tracking-wider">En Attente Client</p>
          <p className="text-2xl font-black text-amber-600">{pendingQuotesCount}</p>
          <p className="text-[11px] text-amber-700 font-medium">Soumis & consultés par clients</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-3xl border border-brand-100 shadow-subtle space-y-1 ring-1 ring-brand-500/10"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-xs text-brand-900 font-semibold uppercase tracking-wider">Volume Contractualisé</p>
          <p className="text-2xl font-black text-brand-600">{formatCurrency(totalVolumeTTC)}</p>
          <p className="text-[11px] text-slate-400">Total devis conclus en Dinars</p>
        </motion.div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Rechercher par référence, transporteur, client, ville..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Tous les devis" },
            { id: "accepted", label: "Acceptés" },
            { id: "pending", label: "En attente" },
            { id: "rejected", label: "Refusés" },
            { id: "expired", label: "Expirés" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleStatusFilterChange(tab.id)}
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

      {/* Quotes Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 rounded-l-xl">Réf. Devis</th>
                <th className="py-3.5 px-4">Déménageur Agréé</th>
                <th className="py-3.5 px-4">Client Particulier</th>
                <th className="py-3.5 px-4">Demande & Trajet</th>
                <th className="py-3.5 px-4">Émis le</th>
                <th className="py-3.5 px-4">Montant TTC</th>
                <th className="py-3.5 px-4">Acompte Exigible</th>
                <th className="py-3.5 px-4 rounded-r-xl">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <AnimatePresence mode="wait">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      Chargement des propositions de devis...
                    </td>
                  </tr>
                ) : paginatedQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      Aucun devis ne correspond aux critères sélectionnés.
                    </td>
                  </tr>
                ) : (
                  paginatedQuotes.map((q) => {
                    const qId = q._id || q.id;
                    const cName =
                      q.company?.companyName ||
                      q.companyName ||
                      q.companyId?.commercialName ||
                      q.companyId?.legalName ||
                      "Entreprise";
                    const client = q.movingRequest?.client;
                    const clientName = client
                      ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
                      : q.clientName || "Client Particulier";
                    const total = q.totalPrice ?? q.pricing?.total ?? q.price?.total ?? 0;
                    const pct =
                      q.depositPercent ??
                      q.depositPercentage ??
                      q.pricing?.depositPercentage ??
                      (total > 0 && q.depositAmount ? Math.round((q.depositAmount / total) * 100) : 30);
                    const deposit =
                      q.depositAmount ??
                      q.pricing?.depositRequired ??
                      q.price?.depositAmount ??
                      Math.round(total * (pct / 100));

                    const depCity = q.movingRequest?.departureAddress?.city || "";
                    const arrCity = q.movingRequest?.arrivalAddress?.city || "";
                    const route =
                      depCity && arrCity
                        ? `${depCity} ➔ ${arrCity}`
                        : q.movingRequest?.title || q.requestTitle || `Devis #${String(qId).slice(-6)}`;

                    return (
                      <motion.tr
                        key={qId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          DEV-{String(qId).slice(-6).toUpperCase()}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {cName}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {clientName}
                        </td>
                        <td className="py-3.5 px-4 max-w-[220px] truncate text-slate-600 font-medium">
                          {route}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {formatDate(q.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                          {formatCurrency(total)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold whitespace-nowrap">
                          {formatCurrency(deposit)}{" "}
                          <span className="text-[11px] text-brand-600 font-bold">({pct}%)</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={q.status} />
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination Bar - 5 rows per page */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-500">
            <span>
              Affichage de{" "}
              <strong className="text-slate-900 font-bold">
                {filteredQuotes.length === 0 ? 0 : startIndex + 1}
              </strong>{" "}
              à{" "}
              <strong className="text-slate-900 font-bold">
                {endIndex}
              </strong>{" "}
              sur{" "}
              <strong className="text-slate-900 font-bold">
                {filteredQuotes.length}
              </strong>{" "}
              devis
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-700 text-[11px] font-mono font-medium">
              5 lignes / page
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Première page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(safePage - 1)}
              disabled={safePage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold cursor-pointer"
              title="Page précédente"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Précédent</span>
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    safePage === pageNum
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(safePage + 1)}
              disabled={safePage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold cursor-pointer"
              title="Page suivante"
            >
              <span>Suivant</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Dernière page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
