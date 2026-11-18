import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { companyService } from "../../services/api/companyService";
import { APP_CONFIG, getCoordinatesForGovernorate, getCurrentGpsLocation } from "../../config/appConfig";
import { LocationBadge } from "../../components/common/LocationBadge";
import {
  Building2,
  Save,
  CheckCircle2,
  ShieldCheck,
  Upload,
  Camera,
  MapPin,
  Navigation,
  ExternalLink,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { getLogoUrl } from "../../utils/cn";

export function CompanyProfilePage() {
  const { currentUser, updateProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [logo, setLogo] = useState(currentUser?.company?.logo || null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState("");

  const [formData, setFormData] = useState({
    companyName: currentUser?.company?.companyName || "Carthage Movers Tunis",
    siret: currentUser?.company?.matriculeFiscal || currentUser?.company?.siret || "1584920/A/M/000",
    licenseNumber: currentUser?.company?.licenseNumber || "MOT-TN-2022-8812",
    email: currentUser?.email || "contact@carthagemovers.tn",
    phone: currentUser?.phone || "+216 71 889 400",
    governorate: "Tunis",
    city: "Tunis",
    street: "Rue du Lac Malaren, Les Berges du Lac 2",
    postalCode: "1053",
    latitude: 36.8327,
    longitude: 10.2341,
    description: currentUser?.company?.description || "Leader du déménagement premium pour particuliers et entreprises en Tunisie. Spécialiste Grand Tunis, liaisons quotidiennes Sousse, Sfax, Nabeul et Bizerte.",
    fleetSize: currentUser?.company?.fleetSize || 8,
    employeesCount: currentUser?.company?.employeesCount || 22,
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await companyService.getMyProfile();
        const comp = res?.data?.company || res?.company || res?.data;
        if (comp) {
          if (comp.logo) setLogo(comp.logo);
          const addr = comp.address || {};
          const loc = comp.location || {};
          const gov = addr.governorate || "Tunis";
          const coords = getCoordinatesForGovernorate(gov);

          setFormData((prev) => ({
            ...prev,
            companyName: comp.companyName || comp.commercialName || prev.companyName,
            siret: comp.matriculeFiscal || comp.legalIdentifier || comp.siret || prev.siret,
            licenseNumber: comp.licenseNumber || prev.licenseNumber,
            email: comp.email || currentUser?.email || prev.email,
            phone: comp.phone || currentUser?.phone || prev.phone,
            governorate: gov,
            city: addr.city || prev.city,
            street: addr.street || (typeof comp.address === "string" ? comp.address : prev.street),
            postalCode: addr.postalCode || prev.postalCode,
            latitude: addr.latitude || loc.latitude || coords?.lat || 36.8327,
            longitude: addr.longitude || loc.longitude || coords?.lng || 10.2341,
            description: comp.description || prev.description,
            fleetSize: comp.fleetSize || prev.fleetSize,
            employeesCount: comp.employeesCount || prev.employeesCount,
          }));
        }
      } catch {
        // Fallback to existing state
      }
    }
    load();
  }, [currentUser]);

  const handleGovernorateChange = (gov) => {
    const coords = getCoordinatesForGovernorate(gov);
    setFormData((prev) => ({
      ...prev,
      governorate: gov,
      latitude: coords?.lat || prev.latitude,
      longitude: coords?.lng || prev.longitude,
    }));
  };

  const handleDetectGps = async () => {
    setDetectingGps(true);
    setGpsSuccess("");
    try {
      const pos = await getCurrentGpsLocation();
      setFormData((prev) => ({
        ...prev,
        latitude: pos.latitude,
        longitude: pos.longitude,
      }));
      setGpsSuccess(`Position GPS du dépôt détectée (${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)})`);
      toast.success("Position GPS du dépôt enregistrée !");
    } catch (err) {
      toast.error(err.message || "Impossible d'obtenir la position GPS.");
    } finally {
      setDetectingGps(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image valide (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le logo ne doit pas dépasser 5 Mo.");
      return;
    }

    setUploadingLogo(true);
    const fd = new FormData();
    fd.append("logo", file);

    try {
      const res = await companyService.uploadLogo(fd);
      const newLogoPath = res?.data?.logo || res?.logo;
      if (newLogoPath) {
        setLogo(newLogoPath);
        if (updateProfile && currentUser) {
          updateProfile({
            profileImage: newLogoPath,
            company: {
              ...(currentUser.company || {}),
              logo: newLogoPath,
            },
          });
        }
      }
      toast.success("Logo officiel de l'entreprise mis à jour avec succès !", {
        description: "Il apparaîtra sur vos devis, factures officielles et feuilles de route.",
      });
    } catch (err) {
      console.error("Erreur upload logo:", err);
      toast.error(err.response?.data?.message || err.message || "Erreur lors du téléchargement du logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        companyName: formData.companyName.trim(),
        legalIdentifier: formData.siret.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        description: formData.description.trim(),
        fleetSize: formData.fleetSize,
        employeesCount: formData.employeesCount,
        governorate: formData.governorate,
        city: formData.city.trim(),
        street: formData.street.trim(),
        postalCode: formData.postalCode.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: {
          governorate: formData.governorate,
          city: formData.city.trim(),
          street: formData.street.trim(),
          postalCode: formData.postalCode.trim(),
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
      };

      await companyService.updateMyProfile(payload);
      setSaved(true);
      toast.success("Fiche entreprise et localisation GPS mises à jour !");
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error("Erreur lors de la mise à jour: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fiche Entreprise & Dépôt</h1>
        <p className="text-xs text-slate-500">Ces informations et coordonnées GPS sont visibles sur vos devis et factures</p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Fiche entreprise et coordonnées GPS mises à jour avec succès !</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-6">
        {/* Logo Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {logo ? (
                <img
                  src={getLogoUrl(logo)}
                  alt="Logo Entreprise"
                  className="w-20 h-20 rounded-2xl object-contain border border-slate-200 bg-white p-1 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex flex-col items-center justify-center font-bold">
                  <Building2 className="w-8 h-8" />
                  <span className="text-[10px] font-bold uppercase mt-1">Logo</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute inset-0 bg-slate-950/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-80"
                title="Changer le logo officiel"
              >
                {uploadingLogo ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span className="text-[9px] font-bold uppercase mt-1">Changer</span>
                  </>
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoChange}
              className="hidden"
            />

            <div>
              <h3 className="text-base font-bold text-slate-900">{formData.companyName}</h3>
              <p className="text-xs text-slate-500">Matricule Fiscal : <span className="font-mono font-bold text-slate-700">{formData.siret}</span></p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 mt-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Société de Déménagement Vérifiée</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingLogo}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>{uploadingLogo ? "Upload..." : "Mettre à jour le logo"}</span>
          </button>
        </div>

        {/* Company Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Raison sociale</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse email pro</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone de contact</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Agrément Ministère du Transport</label>
            <input
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
            />
          </div>
        </div>

        {/* Localisation du Siège & Dépôt des Camions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>Localisation du Dépôt Principal & Flotte de camions</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Coordonnées GPS utilisées pour calculer les distances de départ et le suivi en direct des camions.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDetectGps}
              disabled={detectingGps}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-brand-700 hover:bg-brand-50 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${detectingGps ? "animate-spin" : ""}`} />
              <span>{detectingGps ? "Détection GPS..." : "📍 Actualiser GPS Dépôt"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gouvernorat d'implantation *</label>
              <select
                required
                value={formData.governorate}
                onChange={(e) => handleGovernorateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {APP_CONFIG.governorates.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ville / Zone industrielle</label>
              <input
                type="text"
                placeholder="Ex: Les Berges du Lac 2, Sahloul, Mghira..."
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rue & Numéro du dépôt</label>
              <input
                type="text"
                placeholder="Ex: Rue du Lac Malaren, Dépôt Central"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Code postal</label>
              <input
                type="text"
                placeholder="Ex: 1053"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <LocationBadge
            city={formData.city}
            governorate={formData.governorate}
            street={formData.street}
            latitude={formData.latitude}
            longitude={formData.longitude}
            label="Coordonnées GPS du Dépôt Officiel"
          />

          {gpsSuccess && (
            <p className="text-xs text-emerald-700 font-medium">{gpsSuccess}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de camions dans la flotte</label>
            <input
              type="number"
              value={formData.fleetSize}
              onChange={(e) => setFormData({ ...formData, fleetSize: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Effectif déménageurs</label>
            <input
              type="number"
              value={formData.employeesCount}
              onChange={(e) => setFormData({ ...formData, employeesCount: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description commerciale</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-brand flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Enregistrement..." : "Mettre à jour la fiche"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
