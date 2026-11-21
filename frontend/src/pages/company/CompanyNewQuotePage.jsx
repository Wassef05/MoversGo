import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { requestService } from "../../services/api/requestService";
import { quoteService } from "../../services/api/quoteService";
import { formatCurrency, formatDate, getLogoUrl } from "../../utils/cn";
import {
  ChevronLeft,
  Send,
  CheckCircle2,
  Calculator,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  Plus,
  X,
  Clock,
  Calendar,
  Truck,
  FileText
} from "lucide-react";

function fmtAddr(addr) {
  if (!addr) return null;
  if (typeof addr === "string") return addr;
  return [addr.street, addr.postalCode ? `${addr.postalCode} ${addr.city || ""}`.trim() : addr.city, addr.governorate]
    .filter(Boolean)
    .join(", ");
}

export function CompanyNewQuotePage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  const company = currentUser?.company || {};
  const companyName = company.companyName || currentUser?.firstName || "Mon Entreprise de Déménagement";
  const companyLogoSrc = getLogoUrl(company.logo);
  const companyPhone = company.phone || currentUser?.phone || "—";
  const companyEmail = company.email || currentUser?.email || "—";
  const companyAddr = fmtAddr(company.address) || "Tunisie";
  const companyMatricule = company.legalIdentifier || null;

  // Pricing Form State
  const [priceDetails, setPriceDetails] = useState({
    transport: 850,
    packaging: 150,
    disassembly: 120,
    furnitureLift: 200,
    insurance: 50,
    discount: 0,
  });

  const [depositPercent, setDepositPercent] = useState(30);
  const [estimatedDuration, setEstimatedDuration] = useState("1 jour ouvré (08h00 - 17h00)");
  const defaultValidity = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [validityDate, setValidityDate] = useState(defaultValidity);
  const [proposedDate, setProposedDate] = useState("");
  const [notes, setNotes] = useState(
    "Notre équipe de professionnels qualifiés prendra en charge votre mobilier avec housses de protection capitonnées et matériel adapté."
  );
  const [terms, setTerms] = useState(
    "Acompte exigible à la réservation. Solde à la livraison après constat de bon état. Assurance incluse."
  );

  const [includedServices, setIncludedServices] = useState([
    "Camion capitonné avec hayon élévateur",
    "Équipe de 3 déménageurs qualifiés",
    "Assurance marchandises STAR / COMAR",
    "Protection intégrale sous couvertures capitonnées",
    "Fourniture de cartons offerts",
  ]);
  const [excludedServices, setExcludedServices] = useState([]);
  const [newIncluded, setNewIncluded] = useState("");
  const [newExcluded, setNewExcluded] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await requestService.getRequestById(requestId);
        const raw = res?.request || res?.movingRequest || res?.data?.request || res?.data?.movingRequest || res?.data || res;
        const req = raw?.request || raw;
        setRequest(req);
        if (req?.preferredDate) {
          setProposedDate(new Date(req.preferredDate).toISOString().split("T")[0]);
        }
      } catch (err) {
        console.error("Erreur chargement demande:", err);
        setError("Impossible de charger la demande de déménagement.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [requestId]);

  const totalCalculated =
    (priceDetails.transport || 0) +
    (priceDetails.packaging || 0) +
    (priceDetails.disassembly || 0) +
    (priceDetails.furnitureLift || 0) +
    (priceDetails.insurance || 0) -
    (priceDetails.discount || 0);

  const depositCalculated = Math.round(totalCalculated * (depositPercent / 100));

  const handlePriceChange = (key, val) => {
    setPriceDetails((prev) => ({ ...prev, [key]: Math.max(0, parseFloat(val) || 0) }));
  };

  const handleAddIncluded = () => {
    if (newIncluded.trim()) {
      setIncludedServices((prev) => [...prev, newIncluded.trim()]);
      setNewIncluded("");
    }
  };

  const handleAddExcluded = () => {
    if (newExcluded.trim()) {
      setExcludedServices((prev) => [...prev, newExcluded.trim()]);
      setNewExcluded("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalCalculated <= 0) {
      setError("Le montant total du devis doit être supérieur à 0.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        movingRequest: requestId,
        totalPrice: totalCalculated,
        priceDetails: JSON.stringify(priceDetails),
        depositPercent: Number(depositPercent),
        depositPercentage: Number(depositPercent),
        depositAmount: depositCalculated,
        includedServices: includedServices,
        excludedServices: excludedServices,
        terms,
        validityDate,
        proposedDate: proposedDate || undefined,
        estimatedDuration,
        notes,
      };

      const res = await quoteService.createQuote(payload);
      const quoteId = res?.data?.quote?._id || res?.quote?._id;
      navigate(`/company/quotes/${quoteId || ""}`, { state: { createdSuccess: true } });
    } catch (err) {
      console.error("Erreur émission devis:", err);
      setError(err.message || "Erreur lors de l'enregistrement et envoi du devis.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">{error}</p>
        <Link to="/company/requests" className="text-xs font-bold text-brand-600 hover:underline">
          Retour aux demandes disponibles
        </Link>
      </div>
    );
  }

  const depObj = request?.departureAddress || request?.departure || {};
  const arrObj = request?.arrivalAddress || request?.arrival || {};
  const depFull = fmtAddr(depObj);
  const arrFull = fmtAddr(arrObj);
  const clientName = request?.client
    ? `${request.client.firstName || ""} ${request.client.lastName || ""}`.trim()
    : "Client";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Link
          to={`/company/requests/${requestId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour à la fiche de la demande</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Émettre un devis avec papier à en-tête
            </h1>
            <p className="text-xs text-slate-500">
              Pour : <strong>{clientName}</strong> • {depObj.city} ➔ {arrObj.city}
              {request?.estimatedVolume ? ` (${request.estimatedVolume} m³)` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPreview ? "Masquer l'en-tête" : "Aperçu de l'en-tête client"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Letterhead Preview (Papier En-Tête Professionnel) */}
      {showPreview && (
        <div className="bg-white rounded-3xl border-2 border-brand-500/30 shadow-card overflow-hidden">
          <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span className="flex items-center gap-1.5 text-brand-700 font-bold">
              <FileText className="w-4 h-4" />
              <span>Aperçu en temps réel : Papier à en-tête officiel MoversGo</span>
            </span>
            <span className="text-[11px] text-slate-400">Ce document sera transmis au client</span>
          </div>

          {/* Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              {/* Company Info */}
              <div className="flex items-start gap-4">
                {companyLogoSrc ? (
                  <img
                    src={companyLogoSrc}
                    alt={companyName}
                    className="w-16 h-16 rounded-2xl object-contain border-2 border-white/20 shadow-md bg-white p-1 flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20">
                    <Building2 className="w-8 h-8 text-white/80" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-extrabold text-white">{companyName}</h2>
                  {companyMatricule && (
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      Matricule fiscal / RNE : {companyMatricule}
                    </p>
                  )}
                  <div className="mt-2 space-y-0.5 text-xs text-slate-300">
                    {companyPhone !== "—" && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-brand-400" />
                        <span>{companyPhone}</span>
                      </div>
                    )}
                    {companyEmail !== "—" && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-brand-400" />
                        <span>{companyEmail}</span>
                      </div>
                    )}
                    {companyAddr && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-brand-400" />
                        <span>{companyAddr}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount badge */}
              <div className="text-left sm:text-right">
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold block">
                    Devis Officiel
                  </span>
                  <p className="text-2xl font-extrabold text-white">
                    {formatCurrency(totalCalculated)} TTC
                  </p>
                  <p className="text-xs text-brand-300 font-semibold">
                    Acompte ({depositPercent}%) : {formatCurrency(depositCalculated)}
                  </p>
                  <p className="text-[10px] text-slate-400 pt-1">
                    Validité jusqu'au : {formatDate(validityDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coordinates Summary */}
          <div className="p-6 bg-slate-50/60 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-brand-600 uppercase">Adresse de Chargement :</span>
              <p className="text-slate-900 font-semibold mt-0.5">{depFull || "Non spécifié"}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Adresse de Livraison :</span>
              <p className="text-slate-900 font-semibold mt-0.5">{arrFull || "Non spécifié"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pricing Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">
              Ventilation des tarifs (en Dinars Tunisiens TTC)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transport & Véhicule * (DT)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={priceDetails.transport}
                onChange={(e) => handlePriceChange("transport", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prestation emballage / cartons (DT)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={priceDetails.packaging}
                onChange={(e) => handlePriceChange("packaging", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Démontage / Remontage (DT)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={priceDetails.disassembly}
                onChange={(e) => handlePriceChange("disassembly", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monte-meubles avec opérateur (DT)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={priceDetails.furnitureLift}
                onChange={(e) => handlePriceChange("furnitureLift", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assurance marchandises (DT)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={priceDetails.insurance}
                onChange={(e) => handlePriceChange("insurance", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Remise commerciale éventuelle (DT)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={priceDetails.discount}
                onChange={(e) => handlePriceChange("discount", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-emerald-700 font-semibold"
              />
            </div>
          </div>

          {/* Dynamic Total Box */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Montant Total Calculé TTC
              </span>
              <p className="text-2xl font-extrabold text-white mt-0.5">
                {formatCurrency(totalCalculated)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Acompte à la réservation ({depositPercent}%)
              </span>
              <p className="text-xl font-bold text-brand-400 mt-0.5">
                {formatCurrency(depositCalculated)}
              </p>
            </div>
          </div>

          {/* Deposit percentage selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Taux d'acompte exigible à la réservation
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[10, 20, 30, 40, 50, 60].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDepositPercent(pct)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${depositPercent === pct
                      ? "bg-brand-600 border-brand-600 text-white shadow-brand"
                      : "bg-white border-slate-200 text-slate-700 hover:border-brand-400 hover:text-brand-600"
                    }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Montant de l'acompte : <span className="font-bold text-brand-600">{formatCurrency(depositCalculated)} TND</span> ({depositPercent}% de {formatCurrency(totalCalculated)})
            </p>
          </div>
        </div>

        {/* Schedule & Conditions */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Détails de planification & garanties
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Durée estimée *
              </label>
              <input
                type="text"
                required
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                placeholder="Ex: 1 jour ouvré"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date proposée pour le déménagement
              </label>
              <input
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expiration de la validité du devis *
              </label>
              <input
                type="date"
                required
                value={validityDate}
                onChange={(e) => setValidityDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Message d'accompagnement pour le client
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Conditions particulières & termes
            </label>
            <textarea
              rows={2}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Services Inclus et Exclus */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Prestations Incluses et Exclues
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Included */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                ✓ Prestations Incluses
              </span>
              <div className="space-y-2">
                {includedServices.map((srv, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900"
                  >
                    <span>{srv}</span>
                    <button
                      type="button"
                      onClick={() => setIncludedServices(includedServices.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newIncluded}
                  onChange={(e) => setNewIncluded(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddIncluded())}
                  placeholder="Ajouter une prestation incluse..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={handleAddIncluded}
                  className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Excluded */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider block">
                ✗ Prestations Non Comprises
              </span>
              <div className="space-y-2">
                {excludedServices.map((srv, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-red-50 border border-red-100 text-xs text-red-900"
                  >
                    <span>{srv}</span>
                    <button
                      type="button"
                      onClick={() => setExcludedServices(excludedServices.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newExcluded}
                  onChange={(e) => setNewExcluded(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddExcluded())}
                  placeholder="Ajouter une exclusion..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={handleAddExcluded}
                  className="p-2 rounded-xl bg-red-500 text-white hover:bg-red-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || totalCalculated <= 0}
          className="w-full py-4 rounded-xl bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition-colors shadow-brand flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Transmettre le devis officiel avec papier à en-tête au client</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
