import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/api/authService";
import { companyService } from "../../services/api/companyService";
import { getLogoUrl } from "../../utils/cn";
import { APP_CONFIG, getCoordinatesForGovernorate, getCurrentGpsLocation } from "../../config/appConfig";
import {
  ArrowRight,
  Building2,
  AlertCircle,
  UploadCloud,
  FileText,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  User,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  Trash2,
  Camera,
  MapPin,
  Navigation,
  ExternalLink,
} from "lucide-react";

export function RegisterCompanyPage() {
  const [searchParams] = useSearchParams();
  const isRectifyMode = searchParams.get("rectify") === "true";

  const [formData, setFormData] = useState({
    managerLastName: "",
    managerFirstName: "",
    companyName: "",
    matriculeFiscal: "",
    email: "",
    phone: "",
    governorate: "Tunis",
    city: "",
    street: "",
    latitude: 36.8065,
    longitude: 10.1815,
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsDetected, setGpsDetected] = useState(false);
  const [gpsMessage, setGpsMessage] = useState("");

  const [rneFile, setRneFile] = useState(null);
  const [rneError, setRneError] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoError, setLogoError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(isRectifyMode);
  const [rectificationNotes, setRectificationNotes] = useState("");
  const [resubmitSuccess, setResubmitSuccess] = useState(false);

  const handleGovernorateChange = (gov) => {
    const coords = getCoordinatesForGovernorate(gov);
    setFormData((prev) => ({
      ...prev,
      governorate: gov,
      ...(!gpsDetected && coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
    }));
  };

  const handleDetectGps = async () => {
    setDetectingGps(true);
    setGpsMessage("");
    setError("");
    try {
      const pos = await getCurrentGpsLocation();
      setFormData((prev) => ({
        ...prev,
        latitude: pos.latitude,
        longitude: pos.longitude,
      }));
      setGpsDetected(true);
      setGpsMessage(`Position GPS du dépôt enregistrée (${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)})`);
    } catch (err) {
      setGpsMessage(err.message || "Impossible de récupérer la position GPS.");
    } finally {
      setDetectingGps(false);
    }
  };

  const { register, currentUser } = useAuth();
  const navigate = useNavigate();

  // Load existing company data if in rectify mode
  useEffect(() => {
    if (!isRectifyMode) return;

    async function loadCurrentData() {
      setLoadingInitial(true);
      try {
        const userRes = await authService.getMe();
        const user = userRes?.data?.user || userRes?.user || userRes;

        let company = user?.company;
        try {
          const compRes = await companyService.getMyProfile();
          company = compRes?.data?.company || compRes?.company || company;
        } catch (e) {
          // Fallback to user company
        }

        if (company) {
          setRectificationNotes(company.rectificationNotes || company.rejectionReason || "");
          if (company.logo) {
            setLogoPreview(getLogoUrl(company.logo));
          }
          setFormData((prev) => ({
            ...prev,
            companyName: company.companyName || "",
            matriculeFiscal: company.legalIdentifier || company.matriculeFiscal || "",
            email: company.email || user?.email || "",
            phone: company.phone || user?.phone || "",
            governorate: company.address?.governorate || "Tunis",
            city: company.address?.city || "",
            street: company.address?.street || "",
            latitude: company.address?.latitude || company.location?.latitude || 36.8065,
            longitude: company.address?.longitude || company.location?.longitude || 10.1815,
            managerFirstName: user?.firstName || "",
            managerLastName: user?.lastName || "",
            acceptTerms: true,
          }));
        } else if (user) {
          if (user.profileImage) {
            setLogoPreview(getLogoUrl(user.profileImage));
          }
          setFormData((prev) => ({
            ...prev,
            email: user.email || "",
            phone: user.phone || "",
            managerFirstName: user.firstName || "",
            managerLastName: user.lastName || "",
            acceptTerms: true,
          }));
        }
      } catch (err) {
        console.warn("Impossible de charger les données existantes:", err);
      } finally {
        setLoadingInitial(false);
      }
    }

    loadCurrentData();
  }, [isRectifyMode]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setRneError("");
    if (!file) {
      setRneFile(null);
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setRneError("Le document doit obligatoirement être un fichier PDF.");
      setRneFile(null);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setRneError("La taille du fichier ne doit pas dépasser 15 Mo.");
      setRneFile(null);
      return;
    }

    setRneFile(file);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    setLogoError("");
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLogoError("Le fichier doit obligatoirement être une image (PNG, JPG, WEBP).");
      setLogoFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoError("La taille de l'image ne doit pas dépasser 5 Mo.");
      setLogoFile(null);
      return;
    }

    setLogoFile(file);
    try {
      setLogoPreview(URL.createObjectURL(file));
    } catch { }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRectifyMode) {
      // Rectification mode: resubmit updated RNE and coordinates
      if (!rneFile) {
        setError("Veuillez joindre une copie actualisée de votre extrait RNE au format PDF.");
        return;
      }

      setLoading(true);
      try {
        const payload = new FormData();
        payload.append("rneDocument", rneFile);
        if (logoFile) payload.append("logo", logoFile);
        if (formData.matriculeFiscal) payload.append("legalIdentifier", formData.matriculeFiscal.trim());
        if (formData.companyName) payload.append("companyName", formData.companyName.trim());
        if (formData.phone) payload.append("phone", formData.phone.trim());
        if (formData.managerFirstName) payload.append("firstName", formData.managerFirstName.trim());
        if (formData.managerLastName) payload.append("lastName", formData.managerLastName.trim());
        if (formData.governorate) payload.append("governorate", formData.governorate);
        if (formData.city) payload.append("city", formData.city.trim());
        if (formData.street) payload.append("street", formData.street.trim());
        if (formData.latitude) payload.append("latitude", formData.latitude);
        if (formData.longitude) payload.append("longitude", formData.longitude);

        await companyService.resubmitRne(payload);
        setResubmitSuccess(true);
        setTimeout(() => {
          navigate("/company/pending-approval");
        }, 2000);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Erreur lors de la retransmission du dossier.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Normal Registration Mode
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    if (!rneFile) {
      setError("Veuillez joindre une copie de votre extrait RNE récent (moins de 3 mois) au format PDF.");
      return;
    }

    if (!formData.acceptTerms) {
      setError("Veuillez accepter les conditions d'adhésion et de conformité légale.");
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("role", "company");
      payload.append("firstName", formData.managerFirstName);
      payload.append("lastName", formData.managerLastName);
      payload.append("companyName", formData.companyName);
      const cleanEmail = formData.email.trim();
      payload.append("matriculeFiscal", formData.matriculeFiscal.trim());
      payload.append("siret", formData.matriculeFiscal.trim());
      payload.append("email", cleanEmail);
      payload.append("phone", formData.phone.trim());
      payload.append("password", formData.password);
      payload.append("governorate", formData.governorate);
      payload.append("city", formData.city.trim() || formData.governorate);
      payload.append("street", formData.street.trim());
      payload.append("latitude", formData.latitude);
      payload.append("longitude", formData.longitude);
      payload.append("rneDocument", rneFile);
      if (logoFile) payload.append("logo", logoFile);

      try {
        localStorage.setItem("moveflow_tn_registered_email", cleanEmail);
      } catch { }

      await register(payload);
      navigate("/verify-email", {
        state: {
          email: cleanEmail,
          role: "company",
          isCompany: true,
          companyName: formData.companyName,
        },
      });
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement de l'entreprise.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-[#800020] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium font-mono">Chargement des données de votre dossier...</p>
      </div>
    );
  }

  if (resubmitSuccess) {
    return (
      <div className="p-8 text-center space-y-4 bg-emerald-50 rounded-3xl border-2 border-emerald-200">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Dossier rectifié transmis avec succès !</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Vos informations et votre nouvel extrait RNE ont été retransmis à l'administrateur MoversGo pour validation.
        </p>
        <p className="text-xs text-emerald-700 font-bold font-mono">Redirection vers votre espace d'attente...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block mb-1">
          {isRectifyMode ? "Mise à Niveau Réglementaire" : "Réseau Professionnel Agréé"}
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          {isRectifyMode ? "Rectification du Dossier Entreprise" : "Inscription Entreprise de Déménagement"}
        </h2>
        <p className="text-xs text-slate-500">
          {isRectifyMode
            ? "Mettez à jour vos pièces et coordonnées conformément aux remarques de l'administrateur"
            : "Rejoignez le réseau officiel des déménageurs certifiés en Tunisie"}
        </p>
      </div>

      {/* Admin Rectification Remarks Banner */}
      {isRectifyMode && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-900">
                Remarques de l'administrateur pour la validation :
              </p>
              <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium whitespace-pre-wrap leading-relaxed">
                {rectificationNotes || "Veuillez fournir un extrait RNE récent (moins de 3 mois) et vérifier la conformité de votre matricule fiscal."}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#800020] flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identité du Gérant */}
        <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg bg-[#800020] border-2 border-white text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <User className="w-3.5 h-3.5" />
            </span>
            <span>Responsable / Gérant légal</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Prénom du gérant *</label>
              <input
                type="text"
                required
                value={formData.managerFirstName}
                onChange={(e) => setFormData({ ...formData, managerFirstName: e.target.value })}
                placeholder="Ex: Mohamed"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom du gérant *</label>
              <input
                type="text"
                required
                value={formData.managerLastName}
                onChange={(e) => setFormData({ ...formData, managerLastName: e.target.value })}
                placeholder="Ex: Ben Salem"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Informations Entreprise */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Raison sociale & Nom de l'entreprise *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Ex: Carthage Express Déménagement SARL"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Matricule fiscal complet (RNE) *
            </label>
            <input
              type="text"
              required
              value={formData.matriculeFiscal}
              onChange={(e) => setFormData({ ...formData, matriculeFiscal: e.target.value })}
              placeholder="Ex: 1584920/A/M/000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
            />
          </div>
        </div>

        {/* Upload Copie Extrait RNE (PDF) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {isRectifyMode
              ? "Nouvel extrait RNE rectifié (PDF de moins de 3 mois) *"
              : "Copie de l'extrait RNE (PDF des 3 derniers mois) *"}
          </label>
          <div className="border-2 border-dashed border-slate-300 hover:border-[#800020] rounded-2xl p-4 transition-colors bg-slate-50/70">
            <input
              type="file"
              id="rneFileInput"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="rneFileInput"
              className="cursor-pointer flex flex-col items-center justify-center text-center gap-1.5"
            >
              <span className="w-10 h-10 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </span>
              {rneFile ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 mt-1">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>
                    {rneFile.name} ({(rneFile.size / 1024 / 1024).toFixed(2)} Mo)
                  </span>
                </div>
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-800">
                    Cliquez pour téléverser votre extrait RNE officiel
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Format PDF uniquement (max. 15 Mo) • Délivré il y a moins de 3 mois
                  </span>
                </>
              )}
            </label>
          </div>
          {rneError && <p className="text-xs text-rose-600 mt-1 font-semibold">{rneError}</p>}
        </div>

        {/* Upload Logo Entreprise */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Logo de l'entreprise (affiché sur vos devis, factures & espace public)
          </label>
          <div className="border-2 border-slate-200 hover:border-[#800020] rounded-2xl p-4 transition-colors bg-slate-50/70">
            <input
              type="file"
              id="logoFileInput"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoChange}
              className="hidden"
            />
            {logoPreview ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={logoPreview}
                    alt="Logo entreprise preview"
                    className="w-14 h-14 rounded-xl object-contain border-2 border-white bg-white p-1 shadow-sm"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {logoFile ? logoFile.name : "Logo actuel de l'entreprise"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {logoFile
                        ? `${(logoFile.size / 1024 / 1024).toFixed(2)} Mo • Prêt à l'enregistrement`
                        : "Logo enregistré"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="logoFileInput"
                    className="cursor-pointer px-3 py-1.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 text-xs font-bold hover:border-[#800020] hover:text-[#800020] transition-colors"
                  >
                    Changer
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="logoFileInput"
                className="cursor-pointer flex items-center justify-center gap-3 py-2 text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-white text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 block">
                    Ajouter le logo officiel de votre société
                  </span>
                  <span className="text-[11px] text-slate-500 block font-mono">
                    Format PNG, JPG ou WEBP (Max. 5 Mo)
                  </span>
                </div>
              </label>
            )}
          </div>
          {logoError && <p className="text-xs text-rose-600 mt-1 font-semibold">{logoError}</p>}
        </div>

        {/* Coordonnées Pro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email professionnel *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                disabled={isRectifyMode}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@carthage-movers.tn"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone de contact *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+216 71 889 400"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Localisation du Siège Social & Dépôt */}
        <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#800020]" />
              <span>Localisation Siège Social & Dépôt</span>
            </span>
            <button
              type="button"
              onClick={handleDetectGps}
              disabled={detectingGps}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white border-2 border-white text-[11px] font-bold transition-all disabled:opacity-50 shadow-xs"
            >
              <Navigation className={`w-3 h-3 ${detectingGps ? "animate-spin" : ""}`} />
              <span>{detectingGps ? "Détection..." : "📍 Détecter GPS dépôt"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Gouvernorat d'implantation *</label>
              <select
                required
                value={formData.governorate}
                onChange={(e) => handleGovernorateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
              >
                {APP_CONFIG.governorates.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Ville / Zone industrielle</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: Les Berges du Lac 2, Sahloul, Mghira..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Adresse complète du dépôt / siège</label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="Ex: Rue du Lac Malaren, Immeuble Move, Dépôt Central"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 font-mono">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${gpsDetected ? "bg-emerald-500" : "bg-amber-400"}`} />
              GPS : {formData.latitude.toFixed(4)}° N, {formData.longitude.toFixed(4)}° E
            </span>
            <a
              href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#800020] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Vérifier</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {gpsMessage && (
            <p className={`text-[11px] ${gpsDetected ? "text-emerald-700 font-semibold" : "text-amber-700"}`}>
              {gpsMessage}
            </p>
          )}
        </div>

        {/* Mot de passe - Uniquement en création */}
        {!isRectifyMode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe sécurisé *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 caractères"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirmer mot de passe *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirmez le mot de passe"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Conditions */}
        {!isRectifyMode && (
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="termsCompany"
              required
              checked={formData.acceptTerms}
              onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-[#800020] focus:ring-[#800020]"
            />
            <label htmlFor="termsCompany" className="text-xs text-slate-500 leading-tight">
              Je certifie que les informations et l'extrait RNE fournis sont authentiques, et j'accepte que mon compte soit soumis à la validation de l'administrateur MoversGo.
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-[#800020] text-white font-bold text-sm border-2 border-white transition-all shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50 hover:-translate-y-0.5"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>{isRectifyMode ? "Transmettre le dossier rectifié à l'admin" : "Soumettre mon inscription transporteur"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {!isRectifyMode && (
        <div className="text-center pt-2 space-y-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Vous avez déjà un compte professionnel ?{" "}
            <Link to="/login?role=company" className="font-bold text-[#800020] hover:underline">
              Se connecter (Espace Déménageur)
            </Link>
          </p>
          <p className="text-xs text-slate-500">
            Vous êtes un particulier souhaitant déménager ?{" "}
            <Link to="/register/client" className="font-bold text-[#800020] hover:underline">
              Inscription Client Particulier
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
