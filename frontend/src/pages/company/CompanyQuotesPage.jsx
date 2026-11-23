import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { quoteService } from "../../services/api/quoteService";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/cn";
import { FileSpreadsheet, Eye, Clock, ArrowRight, RefreshCw, MapPin } from "lucide-react";

export function CompanyQuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await quoteService.getMyQuotes({ limit: 100 });
      const list = res?.data || (Array.isArray(res) ? res : []);
      setQuotes(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Erreur chargement devis émis:", err);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mes devis émis</h1>
          <p className="text-xs text-slate-500">
            Suivi des propositions officielles transmises et des retours clients
          </p>
        </div>
        <button
          onClick={fetchQuotes}
          title="Rafraîchir"
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && quotes.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center text-slate-400 text-xs space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">Vous n'avez pas encore émis de devis.</p>
              <p>Consultez les demandes de déménagement disponibles pour soumettre vos offres avec papier à en-tête.</p>
              <div className="pt-2">
                <Link
                  to="/company/requests"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"
                >
                  Voir les demandes disponibles
                </Link>
              </div>
            </div>
          ) : (
            quotes.map((q) => {
              const quoteId = q._id || q.id;
              const movingReq = q.movingRequest || {};
              const depCity = movingReq.departureAddress?.city || "—";
              const arrCity = movingReq.arrivalAddress?.city || "—";
              const requestTitle = movingReq.title || `Déménagement ${depCity} ➔ ${arrCity}`;
              const validDate = q.validityDate;
              const total = q.totalPrice || 0;
              const pct = q.depositPercent || q.depositPercentage || q.pricing?.depositPercentage || (total > 0 && q.depositAmount ? Math.round((q.depositAmount / total) * 100) : 30);
              const deposit = q.depositAmount || Math.round(total * (pct / 100));

              return (
                <div
                  key={quoteId}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={q.status} />
                      <span className="text-[11px] text-slate-400 font-mono">
                        Devis #{String(quoteId).slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{requestTitle}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-brand-600" />
                      <span>{depCity} ➔ {arrCity}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Émis le {formatDate(q.createdAt)} • Valide jusqu'au {formatDate(validDate)} • Durée : {q.estimatedDuration || "1 jour"}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 self-end md:self-center">
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {formatCurrency(total)}
                      </span>
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Acompte ({pct}%) : {formatCurrency(deposit)}
                      </span>
                    </div>

                    <Link
                      to={`/company/quotes/${quoteId}`}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-brand-600 transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Examiner</span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
