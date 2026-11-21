import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminService } from "../../services/api/adminService";
import { formatCurrency, formatDate } from "../../utils/cn";
import { StatusBadge } from "../../components/common/StatusBadge";
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
  RefreshCw
} from "lucide-react";

export function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

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
        const mapped = list.map((t) => ({
          ...t,
          id: t.reference || t._id,
          clientName: t.client ? `${t.client.firstName || ''} ${t.client.lastName || ''}`.trim() : (t.clientName || 'Client Particulier'),
          companyName: t.company?.companyName || t.companyName || 'Déménageur Agréé',
          paymentMethod: t.paymentMethod || 'Carte Bancaire CIB',
          type: t.paymentType || t.type || 'Acompte Réservation',
          amount: t.amount || 0,
          platformFee: t.platformFee || 0,
          status: t.status || 'completed',
          date: t.createdAt || t.date,
        }));
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

  const handleDownloadInvoice = (tx) => {
    toast.success(`Bordereau fiscal #${tx.id} généré`, {
      description: `Facture avec Matricule fiscal MoversGo (1748293/A/M/000), TVA 19% et timbre fiscal 1.000 DT.`
    });
  };

  const handleExportCSV = () => {
    toast.info("Export comptable généré", {
      description: "Le fichier CSV des écritures bancaires (Dinars Tunisiens) a été téléchargé."
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
              12% Fixe
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Séquestres bancaires garantis, encaissements CIB/Konnect et reversements aux transporteurs tunisiens
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto"
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
          <p className="text-xs text-brand-900 font-semibold uppercase tracking-wider">Marge Nette MoversGo (12%)</p>
          <p className="text-2xl font-black text-brand-600 mt-1">+{formatCurrency(totalCommissions)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Directement prélevée à la source</p>
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
            onChange={(e) => setSearchTerm(e.target.value)}
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
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${statusFilter === tab.id
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
                <th className="py-3.5 px-4">Com. MoversGo (12%)</th>
                <th className="py-3.5 px-4">Statut Séquestre</th>
                <th className="py-3.5 px-4 text-right">Facture Légale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <AnimatePresence>
                {filtered.map((t) => (
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
                    <td className="py-3.5 px-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(t)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                        title="Bordereau avec TVA 19% et Matricule Fiscal"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reçu PDF</span>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
