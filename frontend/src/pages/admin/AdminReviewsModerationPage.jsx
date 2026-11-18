import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { adminService } from "../../services/api/adminService";
import { RatingStars } from "../../components/common/RatingStars";
import { formatDate } from "../../utils/cn";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ShieldAlert, Star, MessageSquare, Trash2, Clock, Filter } from "lucide-react";

export function AdminReviewsModerationPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'pending' | 'approved' | 'rejected'

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllReviews();
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];
      setReviews(list);
    } catch (err) {
      console.error("Erreur chargement avis:", err);
      toast.error("Impossible de charger les avis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleModerate = async (reviewId, newStatus) => {
    try {
      await adminService.moderateReview(reviewId, newStatus);
      setReviews((prev) =>
        prev.map((r) => ((r.id === reviewId || r._id === reviewId) ? { ...r, status: newStatus } : r))
      );
      if (newStatus === "published" || newStatus === "approved") {
        toast.success("Avis client validé et approuvé ✅", {
          description: "L'avis est désormais visible dans le tableau de bord de l'entreprise qui peut le publier sur sa fiche publique.",
        });
      } else {
        toast.warning("Avis rejeté ❌", {
          description: "L'avis a été masqué et ne sera pas affiché.",
        });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erreur de modération");
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Supprimer définitivement cet avis ? Cette action est irréversible.")) return;
    try {
      await adminService.deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => (r._id || r.id) !== reviewId));
      toast.success("Avis supprimé définitivement");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approvedCount = reviews.filter((r) => r.status === "approved" || r.status === "published").length;
  const rejectedCount = reviews.filter((r) => r.status === "rejected").length;

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === "pending") return r.status === "pending";
    if (activeTab === "approved") return r.status === "approved" || r.status === "published";
    if (activeTab === "rejected") return r.status === "rejected";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Modération des Avis Clients
            </h1>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              Charte Confiance MoversGo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Validation des avis post-déménagement avant diffusion aux entreprises et au public
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === "all"
                ? "bg-white text-slate-900 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            Tous ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${activeTab === "pending"
                ? "bg-amber-500 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-amber-700"
              }`}
          >
            <span>En attente</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === "approved"
                ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-emerald-700"
              }`}
          >
            Validés ({approvedCount})
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === "rejected"
                ? "bg-rose-600 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-rose-700"
              }`}
          >
            Rejetés ({rejectedCount})
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold">Chargement des avis clients...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400">
            <Star className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-500" />
            <p className="font-semibold text-slate-700">Aucun avis client dans cette catégorie.</p>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === "pending"
                ? "Tous les avis soumis ont déjà été modérés !"
                : "Les nouveaux avis soumis apparaîtront automatiquement ici."}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredReviews.map((rev) => {
              const revId = rev._id || rev.id;
              const isApproved = rev.status === "published" || rev.status === "approved";
              const isPending = rev.status === "pending";
              const cName = rev.client
                ? `${rev.client.firstName || ""} ${rev.client.lastName || ""}`.trim()
                : rev.clientName || "Client";
              const compName = rev.company?.companyName || rev.companyName || "Déménageur Agréé";
              const cAvatar =
                rev.client?.profileImage ||
                rev.clientAvatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(cName)}&background=cf0000&color=fff`;
              const bookingRef = rev.booking?.scheduledDate
                ? `DEM-${String(rev.booking?._id || "").slice(-4)}`
                : rev.bookingReference || "DEM-001";

              return (
                <motion.div
                  key={revId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-3xl p-6 border shadow-subtle flex flex-col md:flex-row md:items-start justify-between gap-6 ${isPending ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200"
                    }`}
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isApproved
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isPending
                              ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                      >
                        {isApproved ? "Validé & Approuvé" : isPending ? "⏳ En attente de validation admin" : "Rejeté"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Mission : <strong>{bookingRef}</strong> • {formatDate(rev.date || rev.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={cAvatar}
                        alt={cName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{cName}</h3>
                        <p className="text-xs text-slate-500">
                          Entreprise évaluée : <strong className="text-slate-800">{compName}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="pt-0.5 flex items-center gap-2">
                      <RatingStars rating={rev.rating} size="sm" />
                      <span className="text-xs font-extrabold text-slate-800">{rev.rating}/5</span>
                    </div>

                    <div>
                      {rev.title && <h4 className="text-sm font-bold text-slate-900">"{rev.title}"</h4>}
                      <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mt-1">
                        "{rev.comment}"
                      </p>
                    </div>

                    {/* Company Response if any */}
                    {rev.companyResponse?.text && (
                      <div className="pl-4 border-l-2 border-indigo-200 bg-indigo-50/40 p-2.5 rounded-r-xl">
                        <p className="text-[11px] font-bold text-indigo-900">Réponse de l'entreprise :</p>
                        <p className="text-xs text-slate-600 italic">"{rev.companyResponse.text}"</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-start pt-2 md:pt-0">
                    {!isApproved && (
                      <button
                        onClick={() => handleModerate(revId, "approved")}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Valider & Accepter</span>
                      </button>
                    )}
                    {rev.status !== "rejected" && (
                      <button
                        onClick={() => handleModerate(revId, "rejected")}
                        className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Rejeter</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(revId)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-bold transition-colors"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
