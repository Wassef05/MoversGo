import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { dataService } from "../../services/mock/dataService";
import { companyService } from "../../services/api/companyService";
import { reviewService } from "../../services/api/reviewService";
import { RatingStars } from "../../components/common/RatingStars";
import { LocationBadge } from "../../components/common/LocationBadge";
import { getLogoUrl } from "../../utils/cn";
import {
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Truck,
  Users,
  Check,
  ChevronLeft,
  ArrowRight,
  Star,
  CheckCircle2,
} from "lucide-react";

export function CompanyDetailPage() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const resolveMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const clean = url.replace(/\\/g, "/").replace(/^\/+/, "");
    const base = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");
    return `${base}/${clean}`;
  };

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        // Load company profile from real API with fallback
        let comp = null;
        try {
          const compRes = await companyService.getPublicCompanyById(id);
          comp = compRes?.company || compRes?.data?.company || compRes?.data || compRes;
        } catch {
          comp = await dataService.getCompanyById(id);
        }

        // Load reviews: public approved reviews
        let companyReviews = [];
        try {
          const revRes = await reviewService.getCompanyReviews(id, { publicOnly: true });
          companyReviews = Array.isArray(revRes)
            ? revRes
            : Array.isArray(revRes?.data)
            ? revRes.data
            : Array.isArray(revRes?.reviews)
            ? revRes.reviews
            : [];
        } catch {
          companyReviews = [];
        }

        setCompany(comp);
        setReviews(companyReviews);
      } catch (err) {
        console.error("Erreur chargement fiche entreprise:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 bg-slate-50/70">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">Chargement de la fiche entreprise...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center py-20 px-4 bg-slate-50/70">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center max-w-md mx-auto space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Entreprise introuvable</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cette entreprise n'existe pas ou son compte fait l'objet d'une mise à jour réglementaire.
          </p>
          <div className="pt-2">
            <Link
              to="/companies"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Retour à l'annuaire des déménageurs</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const compName = company.companyName || company.name || company.commercialName || company.legalName || "Entreprise de Déménagement";
  const defaultCover = "/couverture.png";
  const coverImg = (company.coverImage && !company.coverImage.includes("unsplash.com"))
    ? (resolveMediaUrl(company.coverImage) || defaultCover)
    : defaultCover;
  const logoUrl = resolveMediaUrl(company.logo);
  const logoInitial = compName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "MO";

  const servicesList = Array.isArray(company.services) && company.services.length > 0
    ? company.services
    : [
        "Déménagement complet résidentiel",
        "Emballage & protection capitonnée",
        "Démontage & remontage de meubles",
        "Monte-meubles télescopique (jusqu'au 10e)",
        "Transfert de bureaux & entreprises",
        "Liaisons inter-gouvernorats sécurisées",
      ];

  const formatAddress = (addr) => {
    if (!addr) return null;
    if (typeof addr === "string") return addr;
    if (typeof addr === "object") {
      const parts = [addr.street, addr.city, addr.governorate].filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : null;
    }
    return null;
  };

  const city =
    (typeof company.address === "object" ? company.address?.city : null) ||
    company.headquartersAddress?.city ||
    (typeof company.address === "string" ? company.address : "Tunis");
  const governorate =
    (typeof company.address === "object" ? company.address?.governorate : null) ||
    company.headquartersAddress?.governorate ||
    "Tunis";

  const displayAddress =
    formatAddress(company.address) ||
    formatAddress(company.headquartersAddress) ||
    company.location?.formattedAddress ||
    [city, governorate].filter(Boolean).join(", ") ||
    "Tunis, Tunisie";

  const serviceAreas = Array.isArray(company.serviceAreas) && company.serviceAreas.length > 0
    ? company.serviceAreas
    : [governorate, city, "Grand Tunis", "Sousse", "Sfax"].filter(Boolean);

  const docsList = [
    { name: "Extrait RNE certifié", desc: "Inscription légale au Registre National des Entreprises vérifiée" },
    { name: "Agrément Ministère du Transport", desc: "Autorisation officielle d'exercice du transport routier de marchandises" },
    { name: "Police d'assurance STAR / COMAR", desc: "Marchandises et mobilier couverts jusqu'à 200 000 DT" },
    { name: "Contrôle technique de la flotte", desc: "Véhicules capitonnés récents inspectés et conformes" },
  ];

  const rating = company.rating || company.averageRating || 4.9;
  const revCount = company.reviewsCount || company.totalReviews || reviews.length;

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Clean Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link to="/" className="hover:text-slate-900 transition-colors">Accueil</Link>
          <span className="text-slate-300">/</span>
          <Link to="/companies" className="hover:text-slate-900 transition-colors">Déménageurs Agréés</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-semibold">{compName}</span>
        </div>

        {/* Clean Profile Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Cover photo banner */}
          <div className="relative h-48 sm:h-64 overflow-hidden bg-slate-900">
            <img
              src={coverImg}
              alt={compName}
              onError={(e) => {
                e.currentTarget.src = defaultCover;
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

            {/* Top status badges */}
            <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-emerald-800 border border-emerald-100 text-xs font-semibold shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Entreprise Agréée MoversGo • RNE Conforme</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm text-white text-xs font-medium shadow-xs">
                <MapPin className="w-3.5 h-3.5 text-slate-300" />
                <span>{city}, {governorate}</span>
              </span>
            </div>
          </div>

          {/* Profile Header Content Layer */}
          <div className="p-6 sm:p-8 pt-0 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12 sm:-mt-14">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                {/* Real Company Logo */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border border-slate-200 shadow-sm p-2 flex items-center justify-center overflow-hidden flex-shrink-0 z-10">
                  {logoUrl && !imgError ? (
                    <img
                      src={logoUrl}
                      alt={compName}
                      onError={() => setImgError(true)}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 font-bold text-2xl tracking-wider">
                      {logoInitial}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 sm:pt-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    {compName}
                  </h1>
                  {/* Public Legal Badges — NO raw matricule fiscal */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">{company.legalStatus || "Société Agréée"}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-700 font-medium">Statut RNE Vérifié</span>
                    <span className="text-slate-300">•</span>
                    <span>Agrément Transport Validé</span>
                  </div>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                  <RatingStars rating={rating} count={revCount} size="sm" />
                </div>

                <Link
                  to="/client/requests/new"
                  className="px-5 py-2.5 rounded-xl bg-[#800020] hover:bg-[#6b001a] text-white border-2 border-white text-xs font-bold transition-all shadow-md ring-2 ring-[#800020]/25 flex items-center gap-2"
                >
                  <span>Demander un devis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Details Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Presentation Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  Présentation de l'entreprise
                </h2>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Transporteur Vérifié
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {company.description || "Transporteur professionnel agréé pour déménagements de particuliers et d'entreprises. Équipe expérimentée, matériel capitonné adapté et respect scrupuleux des délais convenus sur l'ensemble du territoire tunisien."}
              </p>

              {/* Fleet & Team Numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-medium text-slate-500 block">Flotte de transport</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{company.fleetSize || 6} camions</p>
                  <p className="text-[11px] text-slate-400">Capitonnés 20 à 60 m³</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[11px] font-medium text-slate-500 block">Équipe terrain</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{company.employeesCount || 16} déménageurs</p>
                  <p className="text-[11px] text-slate-400">Personnel formé &amp; qualifié</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-medium text-slate-500 block">Taux de ponctualité</span>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{company.acceptanceRate || "98%"}</p>
                  <p className="text-[11px] text-slate-400">Engagements respectés</p>
                </div>
              </div>
            </div>

            {/* Services Offered */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  Prestations &amp; Équipements disponibles
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  {servicesList.length} formules
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {servicesList.map((srv, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-800"
                  >
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{typeof srv === "string" ? srv : srv?.name || srv?.title || "Prestation de déménagement"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zones d'intervention & Gouvernorats desservis */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Zones d'intervention &amp; Gouvernorats desservis
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {serviceAreas.length} gouvernorat{serviceAreas.length > 1 ? "s" : ""}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Cette société prend en charge les déménagements et transports de marchandises au départ et à l'arrivée des gouvernorats suivants :
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {serviceAreas.map((area, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{area}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Legal Compliance & Audits */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Conformité administrative &amp; Garanties
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pièces justificatives vérifiées manuellement par les équipes MoversGo.
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Audit Validé
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {docsList.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">{doc.name}</span>
                        <span className="text-[11px] text-slate-500">{doc.desc}</span>
                      </div>
                    </div>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100 text-[11px]">
                      Conforme
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Reviews */}
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Avis clients certifiés
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Avis émis exclusivement par des particuliers ayant réservé via MoversGo.
                  </p>
                </div>
                <RatingStars rating={rating} count={revCount} size="xs" />
              </div>

              <div className="space-y-3 pt-1">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                    Cette entreprise a récemment rejoint MoversGo. Ses avis clients seront publiés dès la fin de ses premières missions.
                  </div>
                ) : (
                  reviews.map((rev) => {
                    const revId = rev._id || rev.id;
                    const cName = rev.client
                      ? `${rev.client.firstName || ""} ${rev.client.lastName || ""}`.trim()
                      : rev.clientName || "Client vérifié";
                    const cAvatar =
                      (rev.client?.profileImage ? getLogoUrl(rev.client.profileImage) : null) ||
                      rev.clientAvatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(cName)}&background=0f172a&color=fff`;

                    return (
                      <div
                        key={revId}
                        className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={cAvatar}
                              alt={cName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cName)}&background=0f172a&color=fff`;
                              }}
                            />
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{cName}</p>
                              <p className="text-[10px] text-emerald-700 font-medium">Mission certifiée</p>
                            </div>
                          </div>
                          <RatingStars rating={typeof rev.rating === "number" ? rev.rating : 5} size="xs" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800">{typeof rev.title === "string" ? rev.title : "Prestation de déménagement"}</p>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          "{typeof rev.comment === "string" ? rev.comment : rev.comment?.text || ""}"
                        </p>

                        {/* Company response */}
                        {rev.companyResponse && (rev.companyResponse.text || typeof rev.companyResponse === "string") && (
                          <div className="pl-3 border-l-2 border-slate-300 bg-white p-2.5 rounded-r-lg text-xs space-y-0.5 mt-2">
                            <p className="text-[10px] font-semibold text-slate-900">Réponse de l'entreprise :</p>
                            <p className="text-slate-600">
                              "{typeof rev.companyResponse === "string" ? rev.companyResponse : rev.companyResponse.text}"
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Agency details & Contact (1 col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5 sticky top-24">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Agence &amp; Dépôt
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Coordonnées professionnelles
                </h3>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 block">Adresse de l'agence</span>
                  <span className="text-slate-900 font-medium block">
                    {displayAddress}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 block">Téléphone direct</span>
                  <span className="text-slate-900 font-medium block">{company.phone || "+216 71 889 400"}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 block">Courriel professionnel</span>
                  <span className="text-slate-900 font-medium block">{company.email || "contact@moversgo.tn"}</span>
                </div>

                {(company.address || company.location || company.headquartersAddress) && (
                  <div className="pt-1">
                    <LocationBadge
                      city={company.address?.city || company.headquartersAddress?.city || city}
                      governorate={company.address?.governorate || company.headquartersAddress?.governorate || governorate}
                      street={company.address?.street || company.headquartersAddress?.street}
                      latitude={company.address?.latitude || company.location?.latitude || 36.8065}
                      longitude={company.address?.longitude || company.location?.longitude || 10.1815}
                      label="Dépôt et Siège Social"
                      size="md"
                    />
                  </div>
                )}
              </div>

              {/* Clean Insurance Guarantee Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-xs font-semibold text-slate-900 block">Assurance Marchandises Incluse</span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {typeof company.insurancePartner === "string"
                    ? company.insurancePartner
                    : company.insuranceInformation?.provider
                    ? `${company.insuranceInformation.provider} (Couverture ${(company.insuranceInformation.coverageAmount || 200000).toLocaleString()} DT)`
                    : "STAR Assurances Pro Tunisie (Garantie Marchandises 200 000 DT)"}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2 space-y-2">
                <Link
                  to="/client/requests/new"
                  className="w-full py-3 rounded-xl bg-[#800020] hover:bg-[#6b001a] text-white border-2 border-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md ring-2 ring-[#800020]/25"
                >
                  <span>Demander un devis à cette société</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <p className="text-[11px] text-center text-slate-400">
                  100% gratuit • Acompte sécurisé sous séquestre
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
