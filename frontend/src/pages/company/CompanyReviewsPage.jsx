import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { reviewService } from "../../services/api/reviewService";
import { RatingStars } from "../../components/common/RatingStars";
import { formatDate, getLogoUrl } from "../../utils/cn";
import { Star, ShieldCheck, CheckCircle2, MessageSquare, Globe, EyeOff, Send } from "lucide-react";
import { toast } from "sonner";

export function CompanyReviewsPage() {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTexts, setReplyTexts] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const rawComp = currentUser?.company || currentUser?.companyId;
  const companyId =
    (typeof rawComp === "object" && rawComp !== null
      ? (rawComp._id || rawComp.id)
      : rawComp) || (typeof currentUser?.company === "string" ? currentUser.company : null);

  useEffect(() => {
    async function load() {
      if (!companyId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Company views all approved reviews received
        const res = await reviewService.getCompanyReviews(companyId, { limit: 100 });
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.reviews)
          ? res.reviews
          : [];
        setReviews(list);
      } catch (err) {
        console.error("Erreur chargement avis entreprise:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [companyId]);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : "—";

  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => Math.round(r.rating) === s).length,
  }));

  // Submit response to review (fixes previous 400 bad request)
  const handleReplySubmit = async (reviewId) => {
    const text = (replyTexts[reviewId] || "").trim();
    if (!text) {
      toast.warning("Veuillez saisir votre réponse.");
      return;
    }
    setSubmittingReply(true);
    try {
      await reviewService.respondToReview(reviewId, text);
      setReviews((prev) =>
        prev.map((r) =>
          (r._id || r.id) === reviewId
            ? { ...r, companyResponse: { text, respondedAt: new Date().toISOString() } }
            : r
        )
      );
      setReplyTexts((prev) => ({ ...prev, [reviewId]: "" }));
      setReplyingTo(null);
      toast.success("Votre réponse a été publiée avec succès ! 💬");
    } catch (err) {
      console.error("Reply error:", err);
      toast.error(err?.response?.data?.message || "Erreur lors de l'envoi de la réponse");
    } finally {
      setSubmittingReply(false);
    }
  };

  // Toggle publish to public visitor interface
  const handleTogglePublish = async (reviewId) => {
    setTogglingId(reviewId);
    try {
      const res = await reviewService.togglePublishReview(reviewId);
      const isNowPublic = res?.review?.isPublishedToPublic ?? res?.data?.review?.isPublishedToPublic;

      setReviews((prev) =>
        prev.map((r) =>
          (r._id || r.id) === reviewId
            ? { ...r, isPublishedToPublic: isNowPublic !== undefined ? isNowPublic : !r.isPublishedToPublic }
            : r
        )
      );

      toast.success(
        isNowPublic
          ? "Avis publié sur votre fiche publique visiteur ! 🌐"
          : "Avis masqué de votre fiche publique visiteur."
      );
    } catch (err) {
      console.error("Toggle publish error:", err);
      toast.error(err?.response?.data?.message || "Erreur lors de la modification de la visibilité.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Avis &amp; Réputation de l'entreprise
          </h1>
          <p className="text-xs text-slate-500">
            Avis clients validés par la modération • Note globale : {avgRating}/5 ({reviews.length} avis certifiés)
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Average Rating */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle flex flex-col items-center justify-center text-center">
          <p className="text-4xl font-extrabold text-slate-900">{avgRating}</p>
          {reviews.length > 0 && (
            <RatingStars rating={parseFloat(avgRating)} size="md" className="mt-1" />
          )}
          <p className="text-xs text-slate-400 mt-2">{reviews.length} avis certifiés MoversGo</p>
        </div>

        {/* Star breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle flex flex-col justify-center space-y-2">
          {starCounts.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs w-12 text-right font-semibold text-slate-700">
                {star} ★
              </span>
              <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all"
                  style={{
                    width:
                      reviews.length > 0 ? `${Math.round((count / reviews.length) * 100)}%` : "0%",
                  }}
                />
              </div>
              <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
            </div>
          ))}
        </div>

        {/* Badge */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle flex flex-col justify-center items-center text-center space-y-1.5">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
          <h4 className="text-xs font-bold text-slate-900">Badge 'Excellence Pro'</h4>
          <p className="text-[11px] text-slate-500">Moins de 1% de réclamation sur 12 mois glissants</p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold">Chargement des avis...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center text-slate-400">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-30 text-amber-500" />
            <p className="font-semibold text-slate-700">Aucun avis validé pour le moment.</p>
            <p className="text-xs mt-1 text-slate-400">
              Les avis des clients apparaissent ici dès qu'ils ont été approuvés par l'administrateur.
            </p>
          </div>
        ) : (
          reviews.map((rev) => {
            const revId = rev._id || rev.id;
            const clientName = rev.client
              ? `${rev.client.firstName || ""} ${rev.client.lastName || ""}`.trim()
              : rev.clientName || "Client";
            const clientAvatar =
              (rev.client?.profileImage ? getLogoUrl(rev.client.profileImage) : null) ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=cf0000&color=fff`;
            const isReplying = replyingTo === revId;
            const isPublic = !!rev.isPublishedToPublic;

            return (
              <div key={revId} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={clientAvatar}
                      alt={clientName}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=cf0000&color=fff`;
                      }}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{clientName}</h4>
                      <p className="text-[11px] text-slate-400">
                        {rev.bookingReference || "Mission validée"} · {formatDate(rev.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {/* Public Visibility Badge */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                        isPublic
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {isPublic ? <Globe className="w-3 h-3 text-emerald-600" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                      <span>{isPublic ? "Visible sur votre fiche publique" : "Masqué au public"}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <RatingStars rating={rev.rating || 5} size="sm" />
                      <span className="text-xs font-bold text-slate-800 ml-1">{rev.rating}/5</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                  "{rev.comment}"
                </p>

                {/* Company Response */}
                {rev.companyResponse?.text && (
                  <div className="pl-4 border-l-2 border-brand-500 bg-brand-50/30 p-3 rounded-r-xl">
                    <p className="text-[11px] font-bold text-brand-700 mb-0.5">Votre réponse officielle :</p>
                    <p className="text-xs text-slate-700 italic">"{rev.companyResponse.text}"</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Publiée le {formatDate(rev.companyResponse.respondedAt)}
                    </p>
                  </div>
                )}

                {/* Actions Toolbar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                  {/* Toggle Public Button */}
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(revId)}
                    disabled={togglingId === revId}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                      isPublic
                        ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                        : "bg-emerald-600 text-white border-transparent hover:bg-emerald-700 shadow-xs"
                    }`}
                  >
                    {isPublic ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        <span>Masquer de ma fiche publique</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        <span>🌐 Publier sur ma fiche publique</span>
                      </>
                    )}
                  </button>

                  {/* Reply Action */}
                  {!rev.companyResponse?.text && !isReplying && (
                    <button
                      onClick={() => setReplyingTo(revId)}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-brand-50 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Répondre à cet avis</span>
                    </button>
                  )}
                </div>

                {/* Inline Reply Form */}
                {isReplying && (
                  <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-800">
                      Votre réponse au client :
                    </label>
                    <textarea
                      value={replyTexts[revId] || ""}
                      onChange={(e) =>
                        setReplyTexts((prev) => ({ ...prev, [revId]: e.target.value }))
                      }
                      placeholder="Ex: Merci beaucoup pour votre confiance ! Nous sommes ravis que notre équipe ait répondu à vos attentes."
                      rows={3}
                      className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 font-medium text-slate-800"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setReplyingTo(null); setReplyTexts((prev) => ({ ...prev, [revId]: "" })); }}
                        className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-white transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleReplySubmit(revId)}
                        disabled={submittingReply}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submittingReply ? "Envoi..." : "Publier ma réponse"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
