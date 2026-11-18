import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { dataService } from "../../services/mock/dataService";
import { Star, ChevronLeft, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ClientNewReviewPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(searchParams.get("bookingId") || "");
  const [companyId, setCompanyId] = useState(searchParams.get("companyId") || "");
  const [companyName, setCompanyName] = useState(searchParams.get("companyName") || "");

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadBookings() {
      const boks = await dataService.getBookings();
      setBookings(boks);
      if (!selectedBookingId && boks.length > 0) {
        const first = boks[0];
        setSelectedBookingId(first._id || first.id);
        setCompanyId(first.companyId?._id || first.companyId || first.company);
        setCompanyName(first.companyName || first.companyId?.commercialName || "Transporteur Partenaire");
      }
    }
    loadBookings();
  }, [selectedBookingId]);

  const handleBookingChange = (e) => {
    const bId = e.target.value;
    setSelectedBookingId(bId);
    const found = bookings.find((b) => (b._id || b.id) === bId);
    if (found) {
      setCompanyId(found.companyId?._id || found.companyId || found.company);
      setCompanyName(found.companyName || found.companyId?.commercialName || "Transporteur Partenaire");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await dataService.createReview({
        company: companyId || "comp_01",
        companyId: companyId || "comp_01",
        companyName: companyName || "Transporteur Partenaire",
        booking: selectedBookingId || "bok_01",
        bookingReference: selectedBookingId ? `DEM-${String(selectedBookingId).slice(-6)}` : "DEM-001",
        client: currentUser?._id || currentUser?.id,
        clientId: currentUser?._id || currentUser?.id || "usr_client_01",
        clientName: currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : "Client",
        rating: rating,
        title: title,
        comment: comment,
      });
      toast.success("Votre avis a été soumis avec succès !");
      navigate("/client/reviews");
    } catch (err) {
      toast.error("Erreur lors de la publication de l'avis: " + (err.response?.data?.message || err.message));
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <Link
          to="/client/reviews"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour à mes avis</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Déposer un avis vérifié</h1>
        <p className="text-xs text-slate-500">Votre évaluation aide la communauté à choisir en toute transparence</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-6">
        {bookings.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Déménagement concerné</label>
            <select
              value={selectedBookingId}
              onChange={handleBookingChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {bookings.map((b) => {
                const bId = b._id || b.id;
                const cName = b.companyName || b.companyId?.commercialName || "Transporteur";
                const dep = b.departureCity || b.requestId?.departure?.city || "Tunis";
                const arr = b.arrivalCity || b.requestId?.arrival?.city || "Sousse";
                return (
                  <option key={bId} value={bId}>
                    {cName} ({dep} ➔ {arr}) - #{String(bId).slice(-6)}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Déménageur évalué</label>
          <input
            type="text"
            disabled
            value={companyName || "Transporteur Partenaire"}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800"
          />
        </div>

        {/* Rating selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Note globale</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-200"
                  }`}
                />
              </button>
            ))}
            <span className="ml-3 text-sm font-bold text-slate-800">
              {rating}/5 étoiles
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Titre de votre avis *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Équipe ponctuelle et très soignée !"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Commentaire détaillé *</label>
          <textarea
            required
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Détaillez le déroulement de la journée : respect des horaires, protection des meubles, état du camion..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition-colors shadow-brand flex items-center justify-center gap-2"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Publier mon avis vérifié</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

