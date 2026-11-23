import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { quoteService } from "../../services/api/quoteService";
import { useNotifications } from "../../contexts/NotificationContext";
import { StatusBadge } from "../../components/common/StatusBadge";
import { RatingStars } from "../../components/common/RatingStars";
import { formatCurrency, formatDate, getLogoUrl } from "../../utils/cn";
import { Scale, Eye, Building2, FileText, RefreshCw, MapPin, ArrowRight } from "lucide-react";

export function ClientQuotesPage() {
  const { onQuoteUpdate } = useNotifications();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await quoteService.getClientQuotes({ limit: 100 });
      const list = res?.data || (Array.isArray(res) ? res : []);
      setQuotes(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Erreur chargement devis:", err);
      if (!silent) setQuotes([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
    const unregister = onQuoteUpdate?.(() => {
      fetchQuotes(true);
    });
    return () => {
      if (typeof unregister === "function") unregister();
    };
  }, [onQuoteUpdate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Devis reçus</h1>
          <p className="text-xs text-slate-500">
            Consultez les offres officielles déposées par les déménageurs partenaires avec en-tête et garanties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchQuotes}
            title="Rafraîchir"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {quotes.length > 0 && (
            <Link
              to="/client/compare"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-brand"
            >
              <Scale className="w-4 h-4" />
              <span>Ouvrir le comparateur d'offres</span>
            </Link>
          )}
        </div>
      </div>

      {loading && quotes.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Aucun devis reçu pour le moment</p>
              <p className="text-xs text-slate-400">
                Vos offres officielles apparaîtront ici dès que les transporteurs répondront à vos demandes de déménagement.
              </p>
              <div className="pt-2">
                <Link
                  to="/client/requests"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"
                >
                  Consulter mes demandes en cours
                </Link>
              </div>
            </div>
          ) : (
            quotes.map((q) => {
              const quoteId = q._id || q.id;
              const company = q.company || {};
              const companyName = company.companyName || "Déménageur Partenaire";
              const companyLogoSrc = getLogoUrl(company.logo);
              const movingReq = q.movingRequest || {};
              const depCity = movingReq.departureAddress?.city || "—";
              const arrCity = movingReq.arrivalAddress?.city || "—";
              const requestTitle = movingReq.title || `Déménagement ${depCity} → ${arrCity}`;
              const total = q.totalPrice || 0;
              const pct = q.depositPercent || q.depositPercentage || q.pricing?.depositPercentage || (total > 0 && q.depositAmount ? Math.round((q.depositAmount / total) * 100) : 30);
              const deposit = q.depositAmount || Math.round(total * (pct / 100));
              const validDate = q.validityDate;

              return (
                <div
                  key={quoteId}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4">
                    {companyLogoSrc ? (
                      <img
                        src={companyLogoSrc}
                        alt={companyName}
                        className="w-14 h-14 rounded-2xl object-contain border border-slate-200 bg-white p-0.5 flex-shrink-0 shadow-xs"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0 border border-brand-100">
                        <Building2 className="w-7 h-7 text-brand-500" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{companyName}</h3>
                        <StatusBadge status={q.status} />
                      </div>
                      <RatingStars
                        rating={company.averageRating || 5}
                        count={company.totalReviews || 0}
                        size="xs"
                      />
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                        <span><strong>{depCity}</strong></span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span><strong>{arrCity}</strong></span>
                        <span className="text-slate-400">({requestTitle})</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Émis le {formatDate(q.createdAt)} • Valide jusqu'au {formatDate(validDate)}
                      </p>
                      {q.notes && (
                        <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 line-clamp-1">
                          "{q.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-5 self-end md:self-center flex-shrink-0">
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {formatCurrency(total)}
                      </span>
                      <span className="text-[11px] text-slate-500 block font-medium">
                        Acompte ({pct}%) : {formatCurrency(deposit)}
                      </span>
                    </div>

                    <Link
                      to={`/client/quotes/${quoteId}`}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-brand-600 transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Examiner le devis</span>
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
