import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminService } from "../../services/api/adminService";
import { formatCurrency, formatDate } from "../../utils/cn";
import { StatusBadge } from "../../components/common/StatusBadge";
import { InvoiceModal } from "../../components/common/InvoiceModal";
import { toast } from "sonner";
import {
  CreditCard,
  Download,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Building,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
} from "lucide-react";

export function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceBookingId, setSelectedInvoiceBookingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getTransactions({ limit: 100 });
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.transactions)
              ? res.transactions
              : [];
        const mapped = list.map((t) => {
          const rawBooking = t.booking;
          const bId =
            rawBooking?._id ||
            rawBooking?.id ||
            (typeof rawBooking === "string" ? rawBooking : null) ||
            t.bookingId ||
            null;
          return {
            ...t,
            id: t.reference || (t._id ? `TX-${String(t._id).slice(-6).toUpperCase()}` : "TX-FLUX"),
            bookingId: bId ? String(bId) : null,
            clientName: t.client
              ? `${t.client.firstName || ""} ${t.client.lastName || ""}`.trim()
              : t.clientName || "Client Particulier",
            companyName: t.company?.companyName || t.companyName || "Déménageur Agréé",
            paymentMethod:
              t.paymentMethod === "card"
                ? "Carte CIB / GNT"
                : t.paymentMethod === "konnect"
                ? "Konnect Pay"
                : t.paymentMethod === "transfer"
                ? "Virement Bancaire"
                : t.paymentMethod || "Carte CIB",
            type:
              t.type === "deposit"
                ? "Acompte Réservation"
                : t.type === "final_payment"
                ? "Solde Final"
                : t.paymentType || t.type || "Acompte",
            amount: t.amount || 0,
            platformFee: t.platformFee || 0,
            status: t.status || "completed",
            date: t.createdAt || t.date,
          };
        });
        setTransactions(mapped);
      } catch (err) {
        console.error("Erreur chargement transactions:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalCommissions = transactions.reduce((sum, t) => sum + (t.platformFee || 0), 0);
  const totalNetCompanies = totalAmount - totalCommissions;

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.paymentMethod && t.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
  const paginatedTransactions = filtered.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDownloadInvoice = (tx) => {
    toast.success(`Bordereau fiscal #${tx.id} généré`, {
      description: `Facture avec Matricule fiscal MoversGo (1748293/A/M/000), TVA 19% et timbre fiscal 1.000 DT.`
    });
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.warning("Aucune transaction à exporter.");
      return;
    }
    const headers = [
      'Référence', 'Date', 'Client', 'Déménageur', 'Type', 'Méthode Règlement',
      'Montant Brut (TND)', 'Commission MVG (TND)', 'Net Entreprise (TND)', 'Statut'
    ];
    const rows = transactions.map((t) => [
      t.id || '',
      t.date ? new Date(t.date).toLocaleDateString('fr-TN') : '',
      t.clientName || '',
      t.companyName || '',
      t.type || '',
      t.paymentMethod || '',
      (t.amount || 0).toFixed(3),
      (t.platformFee || 0).toFixed(3),
      ((t.amount || 0) - (t.platformFee || 0)).toFixed(3),
      t.status || '',
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Journal-Comptable-MoversGo-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Journal comptable exporté !', {
      description: `${transactions.length} transaction(s) exportée(s) en CSV (Dinars Tunisiens).`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Flux Financiers & Commissions
            </h1>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
              2% TTC par 10% d'Acompte
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Séquestres bancaires garantis, encaissements CIB/Konnect et reversements aux transporteurs tunisiens
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Exporter Journal Comptable (DT)</span>
        </button>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle relative overflow-hidden"
        >
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Volume Brut Encaissé</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalAmount)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Acomptes séquestre & soldes de déménagement</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-3xl border border-brand-200 shadow-subtle relative overflow-hidden ring-1 ring-brand-500/10"
        >
          <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs text-brand-900 font-semibold uppercase tracking-wider">Commission MoversGo (2% TTC / 10% Acompte)</p>
          <p className="text-2xl font-black text-brand-600 mt-1">+{formatCurrency(totalCommissions)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Directement prélevée à la source (Séquestre)</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle relative overflow-hidden"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Building className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Reversements Déménageurs</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalNetCompanies)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Débloqués après confirmation de livraison</p>
        </motion.div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher par référence, client, société ou carte CIB..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Tous les flux" },
            { id: "paid", label: "Encaissé / Séquestré" },
            { id: "completed", label: "Reversé" },
            { id: "pending", label: "En attente" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${statusFilter === tab.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Réf. Flux</th>
                <th className="py-3.5 px-4">Client Particulier</th>
                <th className="py-3.5 px-4">Déménageur Bénéficiaire</th>
                <th className="py-3.5 px-4">Moyen de Règlement</th>
                <th className="py-3.5 px-4">Date Émission</th>
                <th className="py-3.5 px-4">Montant Brut</th>
                <th className="py-3.5 px-4">Com. MoversGo</th>
                <th className="py-3.5 px-4">Net Déménageur</th>
                <th className="py-3.5 px-4">Statut Séquestre</th>
                <th className="py-3.5 px-4 text-right">Facture Légale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <AnimatePresence mode="wait">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Aucune transaction trouvée correspondant à vos critères.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((t) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{t.id}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{t.clientName}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{t.companyName}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{t.type}</p>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(t.date)}</td>
                      <td className="py-3.5 px-4 font-black text-slate-900">{formatCurrency(t.amount)}</td>
                      <td className="py-3.5 px-4 font-bold text-brand-600">
                        +{formatCurrency(t.platformFee)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {formatCurrency(Math.max(0, (t.amount || 0) - (t.platformFee || 0)))}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {t.bookingId ? (
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceBookingId(t.bookingId)}
                            className="px-3 py-1.5 rounded-xl border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700 inline-flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs hover:shadow-sm group cursor-pointer"
                            title="Superviser la Facture Finale & Contrat"
                          >
                            <FileText className="w-3.5 h-3.5 text-brand-600 group-hover:scale-110 transition-transform" />
                            <span>Facture Légale</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Non liée</span>
                        )}
                      </td>
                    </motion.tr>
                  ))
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
                {filtered.length === 0 ? 0 : startIndex + 1}
              </strong>{" "}
              à{" "}
              <strong className="text-slate-900 font-bold">
                {endIndex}
              </strong>{" "}
              sur{" "}
              <strong className="text-slate-900 font-bold">
                {filtered.length}
              </strong>{" "}
              transactions
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
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors"
              title="Première page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(safePage - 1)}
              disabled={safePage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold"
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
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
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
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold"
              title="Page suivante"
            >
              <span>Suivant</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors"
              title="Dernière page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Modal for Admin Supervision */}
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
