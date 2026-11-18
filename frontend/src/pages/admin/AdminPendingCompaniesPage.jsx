import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { adminService } from "../../services/api/adminService";
import { Modal } from "../../components/common/Modal";
import { toast } from "sonner";
import { getLogoUrl } from "../../utils/cn";
import {
  ShieldAlert,
  FileCheck,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Building2,
  MapPin,
  AlertCircle,
  Truck,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  FileText,
  BadgeCheck,
  Calendar,
  UserCheck,
  Download
} from "lucide-react";

export function AdminPendingCompaniesPage() {
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [isRectificationMode, setIsRectificationMode] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingCompanies();
      const list = res?.data?.companies || res?.companies || res?.data || (Array.isArray(res) ? res : []);
      setPendingCompanies(list);
    } catch (err) {
      console.error("Error loading pending companies:", err);
      toast.error("Impossible de charger les entreprises en attente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleOpenApproveModal = (company) => {
    setSelectedCompany(company);
    setApproveModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedCompany) return;
    const targetId = selectedCompany._id || selectedCompany.id;
    setProcessing(true);
    try {
      await adminService.approveCompany(targetId);
      setPendingCompanies((prev) =>
        prev.filter((c) => (c._id || c.id) !== targetId)
      );
      setApproveModalOpen(false);
      toast.success(
        `L'entreprise "${selectedCompany.companyName || selectedCompany.name}" a été certifiée avec succès !`,
        {
          description:
            "Le badge 'Certifié MoversGo Tunisie' lui a été attribué et un email de confirmation a été envoyé au gérant.",
        }
      );
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Erreur lors de la validation.");
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenRejectModal = (company, isRectify = true) => {
    setSelectedCompany(company);
    setIsRectificationMode(isRectify);
    setRejectionReason(
      isRectify
        ? "Votre extrait RNE doit dater de moins de 3 mois. Veuillez téléverser un extrait RNE récent ou vérifier vos coordonnées légales."
        : "Dossier non conforme à la réglementation tunisienne du transport de marchandises."
    );
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedCompany) return;
    const targetId = selectedCompany._id || selectedCompany.id;
    setProcessing(true);
    try {
      await adminService.rejectCompany(targetId, rejectionReason, isRectificationMode);
      if (isRectificationMode) {
        setPendingCompanies((prev) =>
          prev.map((c) =>
            (c._id || c.id) === targetId
              ? { ...c, verificationStatus: "needs_rectification", rectificationNotes: rejectionReason }
              : c
          )
        );
        toast.info(
          `Remarques envoyées par email à "${selectedCompany.companyName || selectedCompany.name}".`,
          {
            description: "Le gérant a été notifié par email et peut actualiser ses pièces justificatives.",
          }
        );
      } else {
        setPendingCompanies((prev) =>
          prev.filter((c) => (c._id || c.id) !== targetId)
        );
        toast.error(
          `Dossier de "${selectedCompany.companyName || selectedCompany.name}" rejeté définitivement.`,
          {
            description: "Une notification officielle avec le motif légal a été envoyée par email au gérant.",
          }
        );
      }
      setRejectModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Erreur lors de l'envoi.");
    } finally {
      setProcessing(false);
    }
  };

  const backendUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Navigation & Header */}
      <div className="space-y-2">
        <Link
          to="/admin/companies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour à l'annuaire des transporteurs</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Audit & Agrément des Déménageurs</span>
              <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Conformité RNE Tunisie
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Vérification des extraits RNE de moins de 3 mois, identité du gérant et matricule fiscal
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-white shadow-sm flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>{pendingCompanies.length} dossier(s) en attente</span>
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-subtle flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Chargement des dossiers en attente...</p>
        </div>
      ) : pendingCompanies.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-subtle"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Tous les dossiers sont en règle !</h3>
            <p className="text-xs text-slate-500">
              Aucune nouvelle entreprise en attente d'instruction. Toutes les candidatures ont été auditées selon les normes de la législation tunisienne.
            </p>
          </div>
          <Link
            to="/admin/companies"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            Consulter les déménageurs certifiés
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {pendingCompanies.map((comp) => {
              const compId = comp._id || comp.id;
              const compName = comp.companyName || comp.name || "Société de Déménagement";
              const compLogo = getLogoUrl(comp.logo);
              const compSiret = comp.legalIdentifier || comp.matriculeFiscal || comp.siret || "En cours d'attribution";
              const compLocation = typeof comp.address === 'object' ? `${comp.address?.city || ''} (${comp.address?.governorate || 'Tunisie'})` : (comp.address || comp.city || "Tunisie");
              const managerFullName = comp.user ? `${comp.user.firstName || ''} ${comp.user.lastName || ''}`.trim() : (comp.managerName || "Gérant non spécifié");
              const userEmail = comp.email || comp.user?.email || "Non renseigné";
              const userPhone = comp.phone || comp.user?.phone || "Non renseigné";
              const isEmailVerified = comp.user?.isEmailVerified;

              // Extrait RNE document info
              const rneDoc = comp.rneDocument || comp.documents?.find((d) => d.filePath);
              const rneFilePath = rneDoc?.filePath ? (rneDoc.filePath.startsWith("http") ? rneDoc.filePath : `${backendUrl}/${rneDoc.filePath.replace(/^\/+/, '')}`) : null;
              const rneOriginalName = rneDoc?.originalName || rneDoc?.name || "Extrait_RNE.pdf";

              return (
              <motion.div
                key={compId}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6"
              >
                {/* Header Information */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 border-b border-slate-100 pb-6">
                  <div className="flex items-start gap-4">
                    {compLogo ? (
                      <img
                        src={compLogo}
                        alt={compName}
                        className="w-16 h-16 rounded-2xl object-contain border border-slate-200 bg-white p-1 shadow-sm flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex flex-col items-center justify-center font-bold flex-shrink-0">
                        <Building2 className="w-7 h-7" />
                        <span className="text-[9px] font-bold uppercase mt-0.5">Logo</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900">{compName}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                          Dossier Candidat
                        </span>
                        {comp.verificationStatus === "needs_rectification" && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" /> Rectification demandée
                          </span>
                        )}
                        {isEmailVerified ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Email vérifié
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            Email non validé
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        Raison sociale : <strong className="text-slate-900">{compName}</strong> • Matricule Fiscal : <strong className="font-mono text-slate-900">{compSiret}</strong>
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                          <span>Gérant : <strong>{managerFullName}</strong></span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{compLocation}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{userPhone}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{userEmail}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-start">
                    <button
                      onClick={() => handleOpenRejectModal(comp, true)}
                      disabled={processing}
                      className="px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      title="Demander au gérant de corriger le RNE ou les coordonnées"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Demander Rectification</span>
                    </button>
                    <button
                      onClick={() => handleOpenRejectModal(comp, false)}
                      disabled={processing}
                      className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      title="Refuser définitivement le dossier"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Refuser</span>
                    </button>
                    <button
                      onClick={() => handleOpenApproveModal(comp)}
                      disabled={processing}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valider & Agréer</span>
                    </button>
                  </div>
                </div>

                {comp.rectificationNotes && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950">Dernière remarque de rectification transmise au gérant :</p>
                      <p className="mt-0.5 text-amber-800 italic">"{comp.rectificationNotes}"</p>
                    </div>
                  </div>
                )}

                {/* Audit Grid Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px] uppercase">Gérant Responsable</span>
                    <p className="font-bold text-slate-900 mt-0.5">{managerFullName}</p>
                    <p className="text-[11px] text-slate-500">Contact : {userPhone}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px] uppercase">Matricule Fiscal Déclaré</span>
                    <p className="font-mono font-bold text-slate-900 mt-0.5">{compSiret}</p>
                    <p className="text-[11px] text-brand-700 font-semibold">À vérifier avec l'extrait RNE</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold text-[11px] uppercase">Flotte & Personnel</span>
                    <p className="font-bold text-slate-900 mt-0.5">{comp.fleetSize || 2} camion(s) • {comp.employeesCount || 4} déménageur(s)</p>
                    <p className="text-[11px] text-slate-500">Personnel affilié CNSS Tunisie</p>
                  </div>
                </div>

                {/* Compliance Documents & RNE Inspection */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-brand-600" />
                    <span>Pièce Justificative : Extrait RNE (Moins de 3 mois)</span>
                  </h4>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-100">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{rneOriginalName}</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            PDF Officiel
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Extrait du Registre National des Entreprises (RNE Tunisie) • Validité légale requise &lt; 3 mois
                        </p>
                      </div>
                    </div>

                    {rneFilePath ? (
                      <a
                        href={rneFilePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-bold transition-colors shadow-xs"
                      >
                        <ExternalLink className="w-4 h-4 text-brand-600" />
                        <span>Consulter l'Extrait RNE (PDF)</span>
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>Aucun fichier PDF joint</span>
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Validation de la Certification Entreprise"
        subtitle={`Voulez-vous accréditer officiellement ${selectedCompany?.companyName || selectedCompany?.name} sur MoversGo Tunisie ?`}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-emerald-800">
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
              <span>Conséquences de la validation :</span>
            </p>
            <ul className="list-disc pl-5 space-y-1 text-emerald-800">
              <li>L'entreprise reçoit le badge officiel <strong>"Société de Déménagement Agréée en Tunisie"</strong>.</li>
              <li>Un email de validation est automatiquement transmis au gérant pour lui ouvrir l'accès à son espace professionnel.</li>
              <li>Elle aura un accès immédiat aux demandes de devis publiées sur toute la Tunisie.</li>
              <li>Elle apparaîtra publiquement dans l'annuaire officiel des déménageurs de la plateforme.</li>
            </ul>
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button
              onClick={() => setApproveModalOpen(false)}
              disabled={processing}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmApprove}
              disabled={processing}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {processing ? "Validation..." : "Confirmer l'agrément"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Rejection / Rectification Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title={isRectificationMode ? "Demande de Rectification au Gérant" : "Refus Définitif du Dossier"}
        subtitle={`Notification et email envoyés à destination de ${selectedCompany?.companyName || selectedCompany?.name}`}
      >
        <div className="space-y-4">
          {/* Action Type Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setIsRectificationMode(true);
                setRejectionReason("Votre extrait RNE doit dater de moins de 3 mois. Veuillez téléverser un extrait RNE récent ou corriger votre matricule fiscal.");
              }}
              className={`py-2 px-3 rounded-lg transition-all ${
                isRectificationMode
                  ? "bg-white text-amber-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Rectification Requise (Révisable)
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRectificationMode(false);
                setRejectionReason("Dossier non conforme aux exigences réglementaires de MoversGo Tunisie.");
              }}
              className={`py-2 px-3 rounded-lg transition-all ${
                !isRectificationMode
                  ? "bg-white text-rose-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Refus Définitif
            </button>
          </div>

          {/* Quick Preset Reason Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Motifs fréquents (cliquez pour insérer) :</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Extrait RNE de plus de 3 mois",
                "Matricule fiscal non concordant avec le RNE",
                "Fichier RNE illisible ou document incomplet",
                "Nom du gérant différent du représentant légal",
                "Attestation d'assurance transport manquante"
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setRejectionReason(chip)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isRectificationMode
                ? "Remarques et instructions envoyées par email au gérant *"
                : "Motif réglementaire du refus (notifié par email) *"}
            </label>
            <textarea
              rows={4}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Expliquez précisément ce que l'entreprise doit corriger..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">
              ✉️ Envoi automatique par email :
            </p>
            <p>
              Ce message sera immédiatement transmis à <strong>{selectedCompany?.email || selectedCompany?.user?.email}</strong> avec un lien direct lui permettant de se connecter et de ré-envoyer son extrait RNE conforme.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={() => setRejectModalOpen(false)}
              disabled={processing}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={processing || !rejectionReason.trim()}
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-50 ${
                isRectificationMode
                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {processing
                ? "Envoi en cours..."
                : isRectificationMode
                ? "Envoyer la demande de rectification par email"
                : "Confirmer le refus par email"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
