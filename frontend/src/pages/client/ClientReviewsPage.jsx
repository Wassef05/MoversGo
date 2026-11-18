import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { reviewService } from "../../services/api/reviewService";
import { RatingStars } from "../../components/common/RatingStars";
import { formatDate, getLogoUrl } from "../../utils/cn";
import { Star, PlusCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

const STATUS_MAP = {
  approved: { label: "Publié", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  pending:  { label: "En attente de validation", cls: "bg-amber-50 text-amber-700 border-amber-100" },
  rejected: { label: "Rejeté", cls: "bg-rose-50 text-rose-700 border-rose-100" },
};

export function ClientReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await reviewService.getMyReviews();
        const list = res?.data || res?.reviews || (Array.isArray(res) ? res : []);
        setReviews(list);
      } catch (err) {
        console.error("Erreur chargement avis:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mes avis &amp; Retours d'expérience</h1>
          <p className="text-xs text-slate-500">Retrouvez les évaluations que vous avez partagées avec la communauté</p>
        </div>
        <Link
          to="/client/reviews/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-brand"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Déposer un nouvel avis</span>
        </Link>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center text-slate-400">
            Chargement de vos avis...
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200/80 text-center space-y-3">
            <Star className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Aucun avis rédigé pour le moment</p>
            <p className="text-xs text-slate-400">
              Vous pouvez évaluer une entreprise de déménagement dès que votre prestation est terminée.
            </p>
          </div>
        ) : (
          reviews.map((rev) => {
            const revId = rev._id || rev.id;
            const companyName =
              rev.company?.companyName ||
              rev.company?.commercialName ||
              rev.companyName ||
              "Déménageur Partenaire";
            const statusInfo = STATUS_MAP[rev.status] || STATUS_MAP.pending;

            return (
              <div
                key={revId}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{companyName}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {rev.bookingReference || "Mission validée"} · {formatDate(rev.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <RatingStars rating={rev.rating || 5} size="sm" />
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.cls}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{rev.comment}"
                </p>

                {/* Company response */}
                {rev.companyResponse?.text && (
                  <div className="pl-4 border-l-2 border-brand-200">
                    <p className="text-[11px] font-bold text-brand-700 mb-1">Réponse de l'entreprise :</p>
                    <p className="text-xs text-slate-600 italic">"{rev.companyResponse.text}"</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(rev.companyResponse.respondedAt)}
                    </p>
                  </div>
                )}

                {/* Status indicator */}
                <div className="pt-1 flex items-center gap-1.5 text-[11px] font-semibold">
                  {rev.status === "approved" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Avis vérifié et publié sur la fiche de l'entreprise</span>
                    </>
                  ) : rev.status === "rejected" ? (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-rose-500">Avis non conforme – non publié</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-amber-600">En attente de validation par l'équipe</span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
