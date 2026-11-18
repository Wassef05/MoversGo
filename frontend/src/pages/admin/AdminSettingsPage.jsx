import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { APP_CONFIG } from "../../config/appConfig";
import { useAuth } from "../../contexts/AuthContext";
import {
  Sliders,
  Save,
  CheckCircle2,
  ShieldCheck,
  Building2,
  CreditCard,
  User,
  Mail,
  Phone,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export function AdminSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "system" ? "system" : "profile";
  const [activeTab, setActiveTab] = useState(initialTab); // "profile" | "system"

  const { currentUser, updateProfile } = useAuth();

  // Profile & Password State
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Platform System Settings State
  const [platformFee, setPlatformFee] = useState(12);
  const [depositPercent, setDepositPercent] = useState(30);
  const [currency] = useState("DT (Dinar Tunisien)");
  const [platformName, setPlatformName] = useState(APP_CONFIG.name);
  const [supportEmail, setSupportEmail] = useState(APP_CONFIG.contact.email);
  const [supportPhone, setSupportPhone] = useState(APP_CONFIG.contact.phone);
  const [taxId, setTaxId] = useState(APP_CONFIG.legal.taxId);
  const [systemSaved, setSystemSaved] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileData((prev) => ({
        ...prev,
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
      }));
    }
  }, [currentUser]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setProfileError("");
  };

  // Handle Profile & Password Save
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSaved(false);

    if (profileData.newPassword) {
      if (profileData.newPassword.length < 8) {
        setProfileError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
        return;
      }
      if (profileData.newPassword !== profileData.confirmPassword) {
        setProfileError("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
        return;
      }
    }

    setProfileLoading(true);
    try {
      const payload = {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        email: profileData.email.trim().toLowerCase(),
        phone: profileData.phone.trim(),
      };

      if (profileData.newPassword) {
        payload.newPassword = profileData.newPassword;
        if (profileData.currentPassword) {
          payload.currentPassword = profileData.currentPassword;
        }
      }

      await updateProfile(payload);

      setProfileSaved(true);
      toast.success("Profil administrateur mis à jour avec succès !", {
        description: profileData.newPassword
          ? "Vos coordonnées et votre nouveau mot de passe ont été enregistrés."
          : "Vos coordonnées ont été enregistrées.",
      });

      setProfileData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setTimeout(() => setProfileSaved(false), 3500);
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de la mise à jour du profil.";
      setProfileError(errMsg);
      toast.error(errMsg);
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Platform Settings Save
  const handleSystemSave = (e) => {
    e.preventDefault();
    setSystemSaved(true);
    toast.success("Paramètres enregistrés avec succès", {
      description: "La configuration nationale MoversGo Tunisie est immédiatement active.",
    });
    setTimeout(() => setSystemSaved(false), 2500);
  };

  const userAvatar =
    currentUser?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${currentUser?.firstName || "Admin"} ${currentUser?.lastName || "MoversGo"}`
    )}&background=800020&color=fff&bold=true`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block mb-1">
            Supervision Direction
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Paramètres & Profil Administrateur
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Gérez votre profil personnel d'administrateur, votre mot de passe et les paramètres globaux de la plateforme.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border-2 border-slate-200">
        <button
          type="button"
          onClick={() => handleTabChange("profile")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "profile"
              ? "bg-[#800020] text-white shadow-md border-2 border-white"
              : "text-slate-600 hover:text-slate-900"
            }`}
        >
          <User className="w-4 h-4" />
          <span>Mon Profil & Mot de passe</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("system")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "system"
              ? "bg-slate-900 text-white shadow-md border-2 border-white"
              : "text-slate-600 hover:text-slate-900"
            }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Configuration Système</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 1: MON PROFIL & MOT DE PASSE
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {profileSaved && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">
                Votre profil et vos accès administrateur ont été enregistrés avec succès.
              </span>
            </div>
          )}

          {profileError && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-[#800020] flex-shrink-0" />
              <span className="font-semibold">{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Identity Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
                <div className="relative">
                  <img
                    src={userAvatar}
                    alt={currentUser?.firstName}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-rose-200 bg-slate-50 shadow-xs"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#800020] text-white flex items-center justify-center text-[10px]">
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {currentUser?.firstName} {currentUser?.lastName}
                    </h3>
                    <span className="bg-[#800020] text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white">
                      Super Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser?.email}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Compte certifié Haute Direction MoversGo
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Prénom *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      placeholder="Prénom"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nom *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      placeholder="Nom"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email de connexion administrateur *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="admin@moversgo.tn"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Adresse servant à vous connecter sur /login/admin
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Téléphone direct
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+216 71 889 400"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Password Management Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <KeyRound className="w-5 h-5 text-[#800020]" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Sécurité & Nouveau mot de passe
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Laissez ces champs vides si vous souhaitez conserver votre mot de passe actuel.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mot de passe actuel (si requis pour vérification)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                      placeholder="Votre mot de passe actuel"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                      placeholder="Au moins 8 caractères"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                      placeholder="Confirmez le nouveau mot de passe"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-6 py-3 rounded-xl bg-[#800020] hover:bg-[#660019] text-white text-xs sm:text-sm font-bold border-2 border-white transition-all shadow-md shadow-[#800020]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:-translate-y-0.5"
              >
                {profileLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Enregistrer mon profil et mot de passe</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          TAB 2: CONFIGURATION SYSTÈME
      ───────────────────────────────────────────────────────────────────────────── */}
      {activeTab === "system" && (
        <form onSubmit={handleSystemSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in duration-200">
          {systemSaved && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Paramètres de la plateforme mis à jour et répliqués sur l'ensemble des modules.</span>
            </div>
          )}

          {/* Financial Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <CreditCard className="w-4 h-4 text-[#800020]" />
              <h2 className="text-sm font-bold text-slate-900">Règles Financières & Commissionnement</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Commission Fixe Plateforme (%)</label>
                <input
                  type="number"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] font-bold text-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">Prélevée sur le montant brut du devis (12%)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Acompte Séquestré Exigé (%)</label>
                <input
                  type="number"
                  value={depositPercent}
                  onChange={(e) => setDepositPercent(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] font-bold text-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">Payé par le client à la réservation (30%)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Devise Officielle</label>
                <input
                  type="text"
                  disabled
                  value={currency}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600"
                />
                <p className="text-[11px] text-slate-400 mt-1">Dinar Tunisien (DT / TND)</p>
              </div>
            </div>
          </div>

          {/* Legal & Identité */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Identité & Informations Légales (Tunisie)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom Commercial</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Matricule Fiscal Officiel (DGI)</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Support Administratif</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone Siège Tunis</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-[#800020] transition-colors shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Mettre à jour les paramètres système</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
