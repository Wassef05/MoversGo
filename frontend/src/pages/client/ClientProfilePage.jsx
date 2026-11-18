import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/api/authService";
import { APP_CONFIG, getCoordinatesForGovernorate, getCurrentGpsLocation } from "../../config/appConfig";
import { LocationBadge } from "../../components/common/LocationBadge";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  ExternalLink,
  AlertCircle
} from "lucide-react";

export function ClientProfilePage() {
  const { currentUser, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    governorate: "Tunis",
    city: "",
    street: "",
    postalCode: "",
    latitude: 36.8065,
    longitude: 10.1815,
  });

  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser) {
      const addr = currentUser.address || {};
      const loc = currentUser.location || {};
      const gov = addr.governorate || currentUser.governorate || "Tunis";
      const coords = getCoordinatesForGovernorate(gov);

      setFormData({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        governorate: gov,
        city: addr.city || currentUser.city || "",
        street: addr.street || (typeof currentUser.address === "string" ? currentUser.address : ""),
        postalCode: addr.postalCode || "",
        latitude: addr.latitude || loc.latitude || coords?.lat || 36.8065,
        longitude: addr.longitude || loc.longitude || coords?.lng || 10.1815,
      });
    }
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
    setError("");
    try {
      const pos = await getCurrentGpsLocation();
      setFormData((prev) => ({
        ...prev,
        latitude: pos.latitude,
        longitude: pos.longitude,
      }));
      setGpsSuccess(`Position GPS actualisée avec succès (${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)})`);
    } catch (err) {
      setError(err.message || "Impossible d'obtenir la position GPS.");
    } finally {
      setDetectingGps(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
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

      try {
        await authService.updateProfile(payload);
      } catch (apiErr) {
        // Fallback to authContext updateProfile
        if (updateProfile) await updateProfile(payload);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "Erreur lors de la mise à jour du profil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mon Profil Particulier</h1>
        <p className="text-xs text-slate-500">
          Gérez vos coordonnées, informations personnelles et votre localisation géographique MoversGo
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Profil et coordonnées GPS mis à jour avec succès !</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
        {/* User Identity Header */}
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center font-bold text-xl ring-4 ring-brand-50/50">
            {formData.firstName?.[0]?.toUpperCase() || "C"}
            {formData.lastName?.[0]?.toUpperCase() || "L"}
          </div>
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-900">
              {formData.firstName || "Client"} {formData.lastName || "MoversGo"}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Membre particulier certifié MoversGo Tunisie</span>
            </p>
          </div>
        </div>

        {/* Identity Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom</label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom</label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse email</label>
            <input
              type="email"
              disabled
              value={formData.email}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone mobile</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+216 98 123 456"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Localisation & Coordonnées GPS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>Localisation géographique & GPS</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Cette position permet aux déménageurs d'estimer les itinéraires et la logistique.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDetectGps}
              disabled={detectingGps}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-brand-700 hover:bg-brand-50 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${detectingGps ? "animate-spin" : ""}`} />
              <span>{detectingGps ? "Détection GPS..." : "📍 Actualiser mon GPS"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gouvernorat *</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ville / Quartier</label>
              <input
                type="text"
                placeholder="Ex: Ennasr 2, La Marsa, Sahloul..."
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rue & Numéro</label>
              <input
                type="text"
                placeholder="Ex: Avenue Hédi Nouira, Résidence Les Palmiers"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Code postal</label>
              <input
                type="text"
                placeholder="Ex: 2037"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* GPS Coordinates Badge Preview */}
          <LocationBadge
            city={formData.city}
            governorate={formData.governorate}
            street={formData.street}
            latitude={formData.latitude}
            longitude={formData.longitude}
            label="Coordonnées GPS Actuelles"
          />

          {gpsSuccess && (
            <p className="text-xs text-emerald-700 font-medium">{gpsSuccess}</p>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-brand flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Enregistrement..." : "Enregistrer mon profil"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
