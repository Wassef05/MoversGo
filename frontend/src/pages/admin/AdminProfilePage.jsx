import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/api/authService";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Camera,
} from "lucide-react";

export function AdminProfilePage() {
  const { currentUser, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
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
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
      }));
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    // Validate passwords if user wants to change password
    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
      };

      if (formData.newPassword) {
        payload.newPassword = formData.newPassword;
        if (formData.currentPassword) {
          payload.currentPassword = formData.currentPassword;
        }
      }

      await updateProfile(payload);

      setSaved(true);
      toast.success("Profil administrateur mis à jour avec succès !", {
        description: formData.newPassword
          ? "Vos informations personnelles et votre nouveau mot de passe ont été enregistrés."
          : "Vos informations personnelles ont été enregistrées.",
      });

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de la mise à jour du profil administrateur.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const userAvatar =
    currentUser?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${currentUser?.firstName || "Admin"} ${currentUser?.lastName || "MoversGo"}`
    )}&background=800020&color=fff&bold=true`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block mb-1">
            Supervision Direction
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Mon Profil Administrateur
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Gérez vos informations personnelles d'administrateur et modifiez votre mot de passe d'accès sécurisé.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">
            Votre profil administrateur et vos accès ont été enregistrés avec succès.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-[#800020] flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity & Basic Info Card */}
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
              <p className="text-[11px] text-slate-400 mt-1">
                Administrateur principal du réseau national MoversGo Tunisie
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
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Nom"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Adresse email de connexion *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@moversgo.tn"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Sert d'identifiant pour vous connecter au portail /login/admin
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Téléphone mobile / direct
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+216 71 889 400"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security & Password Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <KeyRound className="w-5 h-5 text-[#800020]" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Sécurité & Nouveau mot de passe
              </h2>
              <p className="text-[11px] text-slate-500">
                Laissez ces champs vides si vous ne souhaitez pas modifier votre mot de passe actuel.
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
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Saisissez votre mot de passe actuel"
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
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
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
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirmez le nouveau mot de passe"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-[#800020] hover:bg-[#660019] text-white text-xs sm:text-sm font-bold border-2 border-white transition-all shadow-md shadow-[#800020]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:-translate-y-0.5"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Enregistrer les modifications du profil</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
