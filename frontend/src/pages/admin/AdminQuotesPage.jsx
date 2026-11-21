import React, { useState, useEffect } from "react";
import { adminService } from "../../services/api/adminService";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/cn";
import { Search } from "lucide-react";

export function AdminQuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getAllQuotes();
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
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supervision des Devis & Propositions</h1>
        <p className="text-xs text-slate-500">Flux de tous les devis déposés par les transporteurs partenaires</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Réf. Devis</th>
                <th className="py-3.5 px-4">Déménageur</th>
                <th className="py-3.5 px-4">Demande associée</th>
                <th className="py-3.5 px-4">Émis le</th>
                <th className="py-3.5 px-4">Montant TTC</th>
                <th className="py-3.5 px-4">Acompte exigible</th>
                <th className="py-3.5 px-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Chargement des devis...
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun devis disponible pour le moment.
                  </td>
                </tr>
              ) : (
                quotes.map((q) => {
                  const qId = q._id || q.id;
                  const cName = q.company?.companyName || q.companyName || q.companyId?.commercialName || q.companyId?.legalName || "Entreprise";
                  const total = q.totalPrice ?? q.pricing?.total ?? q.price?.total ?? 0;
                  const pct = q.depositPercent ?? q.depositPercentage ?? q.pricing?.depositPercentage ?? (total > 0 && q.depositAmount ? Math.round((q.depositAmount / total) * 100) : 30);
                  const deposit = q.depositAmount ?? q.pricing?.depositRequired ?? q.price?.depositAmount ?? Math.round(total * (pct / 100));
                  const title = q.movingRequest?.title || (q.movingRequest?.departureAddress ? `${q.movingRequest.departureAddress?.city || ''} ➔ ${q.movingRequest.arrivalAddress?.city || ''}` : '') || q.requestTitle || `Devis #${String(qId).slice(-6)}`;
                  return (
                    <tr key={qId} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{String(qId).slice(-6)}</td>
                      <td className="py-3.5 px-4 font-semibold">{cName}</td>
                      <td className="py-3.5 px-4 max-w-[220px] truncate">{title}</td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(q.createdAt)}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{formatCurrency(total)}</td>
                      <td className="py-3.5 px-4 font-semibold">
                        {formatCurrency(deposit)} <span className="text-[11px] text-brand-600 font-bold">({pct}%)</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={q.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

