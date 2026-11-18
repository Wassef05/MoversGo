import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { companyService } from "../../services/api/companyService";
import { authService } from "../../services/api/authService";
import { toast } from "sonner";
import { getLogoUrl } from "../../utils/cn";
import {
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Upload,
  RefreshCw,
  LogOut,
  Building2,
  Mail,
  Phone,
  Hash,
  User,
  ArrowRight
} from "lucide-react";

export function CompanyPendingApprovalPage() {
  const { currentUser, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);
  const [rneFile, setRneFile] = useState(null);
  const [submittingRne, setSubmittingRne] = useState(false);

  const company = currentUser?.company || {};
  const status = company.verificationStatus || "pending";
  const isApproved = status === "approved";

  // If already approved, redirect directly to dashboard
  if (isApproved) {
    navigate("/company/dashboard", { replace: true });
    return null;
  }

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      const res = await authService.getMe();
      const freshUser = res?.data?.user || res?.user || res;
      if (freshUser) {
        await updateProfile(freshUser);
        const freshStatus = freshUser.company?.verificationStatus;
        if (freshStatus === "approved") {
          toast.success("Votre compte a été validé par l'administration ! 🎉", {
            description: "Bienvenue sur votre espace déménageur MoversGo."
          });
          navigate("/company/dashboard", { replace: true });
          return;
        } else if (freshStatus === "needs_rectification") {
          toast.warning("Rectification demandée par l'administration", {
            description: "Veuillez consulter les remarques ci-dessous et fournir les pièces demandées."
          });
        } else if (freshStatus === "rejected") {
          toast.error("Votre dossier n'a pas été retenu par l'administration.");
        } else {
          toast.info("Dossier toujours en cours d'examen par l'administration.");
        }
      }
    } catch (err) {
      toast.error("Erreur lors de l'actualisation du statut");
    } finally {
      setRefreshing(false);
    }
  };

  const handleUploadNewRne = async (e) => {
    e.preventDefault();
    if (!rneFile) {
      toast.error("Veuillez sélectionner votre extrait RNE au format PDF.");
      return;
    }
    setSubmittingRne(true);
    try {
      const formData = new FormData();
      formData.append("rneDocument", rneFile);
      const res = await companyService.resubmitRne(formData);
      toast.success("Document RNE actualisé avec succès !", {
        description: "Votre dossier a été retransmis à l'administrateur pour validation."
      });
      setRneFile(null);
      // Refresh user profile
      const freshUser = await authService.getMe();
      if (freshUser) await updateProfile(freshUser);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Erreur lors de la transmission du document.");
    } finally {
      setSubmittingRne(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-10 space-y-8">

        {/* Status Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20 shadow-subtle">
            {status === "needs_rectification" ? (
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            ) : status === "rejected" ? (
              <ShieldAlert className="w-8 h-8 text-rose-600" />
            ) : (
              <Clock className="w-8 h-8 text-amber-600" />
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              {status === "needs_rectification"
                ? "Rectification de document requise"
                : status === "rejected"
                  ? "Compte refusé"
                  : "Compte en cours de validation administrative"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {status === "needs_rectification"
              ? "Précisions ou document requis"
              : status === "rejected"
                ? "Dossier non validé"
                : "Dossier entreprise en cours d'examen"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            {status === "needs_rectification"
              ? "L'administration MoversGo a examiné votre dossier et demande la rectification de vos pièces légales pour pouvoir agréer votre entreprise."
              : status === "rejected"
                ? "Votre demande d'adhésion en tant que déménageur agréé n'a pas été retenue par l'administration."
                : "Conformément à la réglementation de notre marketplace, le gérant ne peut accéder à l'espace déménageur qu'après audit et validation de son extrait RNE par l'administrateur."}
          </p>
        </div>

        {/* Rectification Box */}
        {status === "needs_rectification" && (
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 text-xs">Remarques de l'administrateur :</p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed bg-white/80 p-3 rounded-xl border border-amber-200/60 font-medium">
                  {company.rectificationNotes || company.rejectionReason || "Veuillez fournir un extrait RNE de moins de 3 mois et vérifier le matricule fiscal."}
                </p>
              </div>
            </div>

            {/* Re-upload Form */}
            <form onSubmit={handleUploadNewRne} className="space-y-3 pt-2 border-t border-amber-200/60">
              <label className="block text-xs font-bold text-amber-900">
                Téléverser un nouvel extrait RNE conforme (PDF, &lt; 3 mois) *
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="file"
                  accept="application/pdf"
                  required
                  onChange={(e) => setRneFile(e.target.files[0] || null)}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer bg-white p-1 rounded-xl border border-amber-300"
                />
                <button
                  type="submit"
                  disabled={submittingRne || !rneFile}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 flex-shrink-0"
                >
                  {submittingRne ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Transmettre</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Summary of Company Submission with Logo */}
        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
            <div className="flex items-center gap-4">
              {company.logo ? (
                <img
                  src={getLogoUrl(company.logo)}
                  alt={company.companyName || "Logo Entreprise"}
                  className="w-16 h-16 rounded-2xl object-contain border border-slate-200 bg-white p-1 shadow-sm flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex flex-col items-center justify-center font-bold flex-shrink-0">
                  <Building2 className="w-8 h-8" />
                  <span className="text-[9px] font-bold uppercase mt-0.5">Logo</span>
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-slate-900">{company.companyName || "Entreprise"}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Matricule fiscal : <strong className="text-slate-800">{company.legalIdentifier || "-"}</strong>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Dossier complet téléversé</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span><strong>Société :</strong> {company.companyName || "Entreprise"}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span><strong>Gérant :</strong> {currentUser?.firstName} {currentUser?.lastName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span><strong>Matricule fiscal :</strong> {company.legalIdentifier || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span><strong>Email :</strong> {currentUser?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span><strong>Tél :</strong> {currentUser?.phone || company.phone || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span><strong>Extrait RNE :</strong> {company.rneDocument ? "Document joint" : "En attente"}</span>
            </div>
          </div>
        </div>

        {/* Process Steps */}
        <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/60 text-xs text-slate-600 space-y-2">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Étapes du processus de validation :</span>
          </p>
          <ul className="space-y-1 pl-5 list-disc text-[11px] text-slate-500">
            <li>Votre email professionnel est déjà validé via le code OTP.</li>
            <li>L'administration MoversGo vérifie la validité légale de votre extrait RNE et de votre matricule fiscal.</li>
            <li>Dès validation administrative, vous recevrez un email de confirmation et l'accès à votre tableau de bord sera immédiatement débloqué.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleRefreshStatus}
            disabled={refreshing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Vérifier si mon compte a été validé</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

