import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { adminService } from "../../services/api/adminService";
import { formatDate, getLogoUrl } from "../../utils/cn";
import { toast } from "sonner";
import {
  Search,
  User,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Building2,
  Shield,
  MapPin,
  Mail,
  Phone,
  Trash2,
  Eye,
  FileText,
  Clock,
  ExternalLink,
  AlertTriangle,
  X,
  Filter,
  Check,
  Lock,
  Calendar,
  RefreshCw,
  BadgeCheck,
  Send
} from "lucide-react";

const BACKEND_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Inspection & Verification modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [processingValidation, setProcessingValidation] = useState(false);

  // Rectification sub-form inside modal
  const [showRectifyInput, setShowRectifyInput] = useState(false);
  const [rectificationText, setRectificationText] = useState(
    "Votre extrait RNE doit dater de moins de 3 mois. Veuillez téléverser un extrait RNE récent ou vérifier vos coordonnées légales."
  );

  // Delete confirmation modal
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllUsers({ limit: 300 });
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : res?.users || [];
      setUsers(list);
    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err);
      toast.error("Impossible de charger la liste des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Validation Actions for Company
  const handleApproveCompany = async (user) => {
    const compId = user.company?._id || user.company?.id || user.company;
    if (!compId) return;
    setProcessingValidation(true);
    try {
      await adminService.approveCompany(compId);
      toast.success(
        `L'entreprise "${user.company?.companyName || user.firstName}" a été validée avec succès !`,
        {
          description: "Le compte est désormais activé et un email de confirmation a été envoyé au gérant."
        }
      );
      // Update local state
      setUsers((prev) =>
        prev.map((u) => {
          if ((u._id || u.id) === (user._id || user.id)) {
            return {
              ...u,
              company: { ...u.company, verificationStatus: "approved" },
              isActive: true,
              status: "active"
            };
          }
          return u;
        })
      );
      if (selectedUser && (selectedUser._id || selectedUser.id) === (user._id || user.id)) {
        setSelectedUser((prev) => ({
          ...prev,
          company: { ...prev.company, verificationStatus: "approved" },
          isActive: true,
          status: "active"
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Erreur lors de la validation");
    } finally {
      setProcessingValidation(false);
    }
  };

  const handleRectifyCompany = async (user) => {
    const compId = user.company?._id || user.company?.id || user.company;
    if (!compId || !rectificationText.trim()) return;
    setProcessingValidation(true);
    try {
      await adminService.requestCompanyRectification(compId, rectificationText.trim());
      toast.warning(`Demande de rectification envoyée à "${user.company?.companyName || user.firstName}".`, {
        description: "Un email contenant vos instructions a été transmis au gérant."
      });
      setShowRectifyInput(false);
      setUsers((prev) =>
        prev.map((u) => {
          if ((u._id || u.id) === (user._id || user.id)) {
            return {
              ...u,
              company: { ...u.company, verificationStatus: "needs_rectification", rectificationNotes: rectificationText }
            };
          }
          return u;
        })
      );
      if (selectedUser && (selectedUser._id || selectedUser.id) === (user._id || user.id)) {
        setSelectedUser((prev) => ({
          ...prev,
          company: { ...prev.company, verificationStatus: "needs_rectification", rectificationNotes: rectificationText }
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Erreur lors de la demande de rectification");
    } finally {
      setProcessingValidation(false);
    }
  };

  const handleRejectCompany = async (user) => {
    const compId = user.company?._id || user.company?.id || user.company;
    if (!compId) return;
    if (!window.confirm("Êtes-vous sûr de vouloir rejeter définitivement ce dossier d'entreprise ?")) return;
    setProcessingValidation(true);
    try {
      await adminService.rejectCompany(compId, "Dossier non conforme à la réglementation MoversGo.");
      toast.error(`Le dossier de "${user.company?.companyName || user.firstName}" a été rejeté.`);
      setUsers((prev) =>
        prev.map((u) => {
          if ((u._id || u.id) === (user._id || user.id)) {
            return {
              ...u,
              company: { ...u.company, verificationStatus: "rejected" }
            };
          }
          return u;
        })
      );
      if (selectedUser && (selectedUser._id || selectedUser.id) === (user._id || user.id)) {
        setSelectedUser((prev) => ({
          ...prev,
          company: { ...prev.company, verificationStatus: "rejected" }
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Erreur lors du rejet");
    } finally {
      setProcessingValidation(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const userId = user._id || user.id;
    const isCurrentlyActive = user.isActive !== undefined ? user.isActive : user.status === "active";
    const newActive = !isCurrentlyActive;
    try {
      await adminService.updateUserStatus(userId, newActive);
      setUsers((prev) =>
        prev.map((u) =>
          (u._id || u.id) === userId
            ? { ...u, status: newActive ? "active" : "suspended", isActive: newActive }
            : u
        )
      );
      if (selectedUser && (selectedUser._id || selectedUser.id) === userId) {
        setSelectedUser((prev) => ({
          ...prev,
          isActive: newActive,
          status: newActive ? "active" : "suspended"
        }));
      }
      if (!newActive) {
        toast.warning(`Compte de ${user.firstName} ${user.lastName} suspendu`, {
          description: "L'utilisateur ne peut plus se connecter ni utiliser la plateforme."
        });
      } else {
        toast.success(`Compte de ${user.firstName} ${user.lastName} réactivé.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la mise à jour du statut");
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const userId = userToDelete._id || userToDelete.id;
    setDeleting(true);
    try {
      await adminService.deleteUser(userId, true);
      toast.success(`Compte de ${userToDelete.firstName} ${userToDelete.lastName} définitivement supprimé.`);
      setUsers((prev) => prev.filter((u) => (u._id || u.id) !== userId));
      if (selectedUser && (selectedUser._id || selectedUser.id) === userId) {
        setSelectedUser(null);
      }
      setUserToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  // Stats calculation
  const totalCount = users.length;
  const clientCount = users.filter((u) => u.role === "client").length;
  const companyCount = users.filter((u) => u.role === "company").length;
  const pendingCompaniesCount = users.filter(
    (u) =>
      u.role === "company" &&
      u.company &&
      (u.company.verificationStatus === "pending" || u.company.verificationStatus === "needs_rectification")
  ).length;

  // Filtered users
  const filtered = users.filter((u) => {
    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const phone = u.phone || "";
    const city = (u.address?.city || u.address?.governorate || u.city || "").toLowerCase();
    const compName = (u.company?.companyName || "").toLowerCase();
    const matricule = (u.company?.legalIdentifier || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      fullName.includes(search) ||
      email.includes(search) ||
      phone.includes(search) ||
      city.includes(search) ||
      compName.includes(search) ||
      matricule.includes(search);

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    let matchesStatus = true;
    if (statusFilter === "pending_verification") {
      matchesStatus =
        u.role === "company" &&
        u.company &&
        (u.company.verificationStatus === "pending" || u.company.verificationStatus === "needs_rectification");
    } else if (statusFilter === "active") {
      matchesStatus = u.isActive !== false && u.status !== "suspended";
    } else if (statusFilter === "suspended") {
      matchesStatus = u.isActive === false || u.status === "suspended";
    } else if (statusFilter === "unverified") {
      matchesStatus = !u.isEmailVerified;
    }

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Gestion de tous les comptes
            </h1>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {totalCount} inscrits
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervision, vérification des coordonnées, audit des dossiers RNE et validation immédiate des entreprises
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            title="Rafraîchir"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Urgent Pending Companies Alert Banner */}
      {pendingCompaniesCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 animate-pulse shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {pendingCompaniesCount} dossier(s) d'entreprise en attente de vérification & validation
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Des déménageurs attendent l'audit de leur extrait RNE pour pouvoir émettre des devis et accéder au tableau de bord.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setStatusFilter("pending_verification");
                setRoleFilter("company");
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Afficher les comptes à valider ({pendingCompaniesCount})
            </button>
            <Link
              to="/admin/companies/pending"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              Espace Dossiers RNE
            </Link>
          </div>
        </div>
      )}

      {/* Quick KPI stats */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
          Clients : <strong className="font-bold text-slate-900">{clientCount}</strong>
        </span>
        <span className="px-3.5 py-1.5 rounded-xl bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200">
          Déménageurs : <strong className="font-bold text-sky-900">{companyCount}</strong>
        </span>
        {pendingCompaniesCount > 0 && (
          <span className="px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>En attente validation : {pendingCompaniesCount}</span>
          </span>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone, société, RNE..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Role Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            {[
              { id: "all", label: "Tous" },
              { id: "client", label: "Clients" },
              { id: "company", label: "Déménageurs" },
              { id: "admin", label: "Admins" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  roleFilter === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="all">Tous les statuts</option>
            {pendingCompaniesCount > 0 && (
              <option value="pending_verification">
                ⚠️ En attente de validation ({pendingCompaniesCount})
              </option>
            )}
            <option value="active">Actifs uniquement</option>
            <option value="suspended">Suspendus uniquement</option>
            <option value="unverified">Email non vérifié</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Utilisateur</th>
                <th className="py-3.5 px-4">Rôle & Raison Sociale</th>
                <th className="py-3.5 px-4">Coordonnées</th>
                <th className="py-3.5 px-4">Date d'inscription</th>
                <th className="py-3.5 px-4">Agrément / Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Chargement des comptes en cours...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Aucun compte trouvé correspondant aux critères.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filtered.map((user) => {
                    const userId = user._id || user.id;
                    const isActiveUser =
                      user.isActive !== undefined ? user.isActive : user.status === "active";
                    const company = user.company;
                    const customLogo = user.role === "company" && company?.logo ? getLogoUrl(company.logo) : null;
                    const userImg = user.profileImage ? getLogoUrl(user.profileImage) : null;
                    const avatarUrl =
                      customLogo ||
                      userImg ||
                      user.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        `${user.firstName || "U"} ${user.lastName || ""}`
                      )}&background=0f172a&color=fff`;
                    const cityDisplay =
                      user.address?.city || user.address?.governorate || user.city || company?.address?.city || "Tunisie";
                    const isPendingCompany =
                      user.role === "company" &&
                      company &&
                      (company.verificationStatus === "pending" || company.verificationStatus === "needs_rectification");

                    return (
                      <motion.tr
                        key={userId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`transition-colors ${
                          isPendingCompany ? "bg-amber-50/40 hover:bg-amber-50/70" : "hover:bg-slate-50/70"
                        }`}
                      >
                        {/* User Identity */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={avatarUrl}
                              alt={user.firstName}
                              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs flex-shrink-0"
                            />
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <span>{user.email}</span>
                                {user.isEmailVerified ? (
                                  <span className="text-emerald-600 font-bold" title="Email vérifié">✓</span>
                                ) : (
                                  <span className="text-amber-500 text-[10px] font-semibold" title="Email non vérifié">(non vérifié)</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role & Company details */}
                        <td className="py-3.5 px-4">
                          {user.role === "admin" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
                              <Shield className="w-3 h-3" />
                              <span>Administrateur</span>
                            </span>
                          )}

                          {user.role === "client" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200">
                              <User className="w-3 h-3" />
                              <span>Particulier</span>
                            </span>
                          )}

                          {user.role === "company" && (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold text-[11px] border border-sky-200">
                                <Building2 className="w-3 h-3" />
                                <span>Déménageur Pro</span>
                              </span>
                              {company && (
                                <div className="text-[11px] text-slate-600">
                                  <p className="font-semibold text-slate-900">{company.companyName}</p>
                                  {company.legalIdentifier && (
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      MF : {company.legalIdentifier}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Contact details */}
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{cityDisplay}</span>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{user.phone || company?.phone || "Non renseigné"}</span>
                          </p>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          <p>{formatDate(user.createdAt)}</p>
                        </td>

                        {/* Status & Verification */}
                        <td className="py-3.5 px-4">
                          {user.role === "company" && company ? (
                            <div className="space-y-1">
                              {company.verificationStatus === "approved" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Agréé MoversGo</span>
                                </span>
                              ) : company.verificationStatus === "needs_rectification" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                  <Clock className="w-3 h-3 text-orange-600" />
                                  <span>Rectification demandée</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>En attente validation</span>
                                </span>
                              )}

                              <div>
                                {isActiveUser ? (
                                  <span className="text-[10px] text-slate-400">Compte Actif</span>
                                ) : (
                                  <span className="text-[10px] text-rose-500 font-semibold">Suspendu</span>
                                )}
                              </div>
                            </div>
                          ) : isActiveUser ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Suspendu
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Urgent Verify Button for Pending Company */}
                            {isPendingCompany && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowRectifyInput(false);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Vérifier & Valider</span>
                              </button>
                            )}

                            {/* View Full Data Modal */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowRectifyInput(false);
                              }}
                              title="Consulter toutes les données du compte"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Suspend / Reactivate */}
                            {user.role !== "admin" && (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                  isActiveUser
                                    ? "border border-rose-200 text-rose-600 hover:bg-rose-50"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                                }`}
                              >
                                {isActiveUser ? "Suspendre" : "Activer"}
                              </button>
                            )}

                            {/* Delete User */}
                            {user.role !== "admin" && (
                              <button
                                type="button"
                                onClick={() => setUserToDelete(user)}
                                title="Supprimer définitivement ce compte"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL USER DETAILS & VALIDATION MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  {selectedUser.firstName?.[0]}
                  {selectedUser.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Fiche Complète : {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {selectedUser._id || selectedUser.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Details Grid */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-slate-400 font-medium">Email :</span>
                  <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <span>{selectedUser.email}</span>
                    {selectedUser.isEmailVerified ? (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                        Vérifié ✓
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded font-bold">
                        Non vérifié
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Téléphone :</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedUser.phone || "Non renseigné"}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Rôle sur MoversGo :</span>
                  <p className="font-bold text-slate-800 mt-0.5 uppercase tracking-wider">{selectedUser.role}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Statut du compte :</span>
                  <p className="font-bold mt-0.5 flex items-center gap-1">
                    {selectedUser.isActive !== false ? (
                      <span className="text-emerald-700 font-bold">Actif</span>
                    ) : (
                      <span className="text-rose-700 font-bold">Suspendu</span>
                    )}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Date de création :</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{formatDate(selectedUser.createdAt)}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Dernière connexion :</span>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : "Jamais"}
                  </p>
                </div>
              </div>

              {/* Company Legal Data & Validation Panel */}
              {selectedUser.role === "company" && selectedUser.company && (
                <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-sky-200/60 pb-3">
                    <p className="font-bold text-sky-950 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                      <Building2 className="w-4 h-4 text-sky-700" />
                      <span>Dossier Légal & Extrait RNE</span>
                    </p>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        selectedUser.company.verificationStatus === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedUser.company.verificationStatus === "needs_rectification"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                      }`}
                    >
                      {selectedUser.company.verificationStatus === "approved"
                        ? "Dossier Validé (Agréé)"
                        : selectedUser.company.verificationStatus === "needs_rectification"
                        ? "Rectification demandée"
                        : "En attente de validation"}
                    </span>
                  </div>

                  {selectedUser.company.logo && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-sky-200/60">
                      <img
                        src={getLogoUrl(selectedUser.company.logo)}
                        alt="Logo Entreprise"
                        className="w-12 h-12 rounded-lg object-contain border border-slate-200 bg-white p-0.5 shadow-xs"
                      />
                      <div>
                        <span className="text-[11px] font-bold text-sky-900 block">Logo Officiel Entreprise</span>
                        <span className="text-[10px] text-slate-500">Affiché sur les devis, factures et feuilles de route</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sky-950">
                    <div>
                      <span className="text-sky-600 font-medium text-[11px]">Raison sociale :</span>
                      <p className="font-bold text-sm">{selectedUser.company.companyName}</p>
                    </div>

                    <div>
                      <span className="text-sky-600 font-medium text-[11px]">Matricule fiscal (Tunisie / RNE) :</span>
                      <p className="font-mono font-bold text-sm">
                        {selectedUser.company.legalIdentifier || "Non renseigné"}
                      </p>
                    </div>

                    <div>
                      <span className="text-sky-600 font-medium text-[11px]">Gouvernorat / Ville :</span>
                      <p className="font-bold">
                        {selectedUser.company.address?.city || selectedUser.company.address?.governorate || "Tunis"}
                      </p>
                    </div>

                    <div>
                      <span className="text-sky-600 font-medium text-[11px]">Document RNE officiel :</span>
                      {selectedUser.company.rneDocument?.filePath ? (
                        <p className="mt-1">
                          <a
                            href={`${BACKEND_URL}/${selectedUser.company.rneDocument.filePath.replace(/^\/+/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Ouvrir le PDF RNE</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </p>
                      ) : selectedUser.company.documents?.[0]?.filePath ? (
                        <p className="mt-1">
                          <a
                            href={`${BACKEND_URL}/${selectedUser.company.documents[0].filePath.replace(/^\/+/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors shadow-xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Ouvrir le document</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </p>
                      ) : (
                        <p className="font-semibold text-slate-500 mt-1">Aucun fichier téléversé</p>
                      )}
                    </div>
                  </div>

                  {selectedUser.company.rectificationNotes && (
                    <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-900 text-xs">
                      <strong>Remarque actuelle de rectification :</strong> "{selectedUser.company.rectificationNotes}"
                    </div>
                  )}

                  {/* Direct Administrative Validation Controls */}
                  <div className="pt-3 border-t border-sky-200/80 space-y-3">
                    <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Décision administrative pour cette entreprise :
                    </p>

                    {selectedUser.company.verificationStatus !== "approved" ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            disabled={processingValidation}
                            onClick={() => handleApproveCompany(selectedUser)}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>Valider & Activer le compte</span>
                          </button>

                          <button
                            type="button"
                            disabled={processingValidation}
                            onClick={() => setShowRectifyInput(!showRectifyInput)}
                            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Demander rectification</span>
                          </button>

                          <button
                            type="button"
                            disabled={processingValidation}
                            onClick={() => handleRejectCompany(selectedUser)}
                            className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <X className="w-4 h-4" />
                            <span>Rejeter</span>
                          </button>
                        </div>

                        {/* Rectification text prompt */}
                        {showRectifyInput && (
                          <div className="p-4 rounded-xl bg-white border border-amber-200 space-y-2 shadow-xs">
                            <label className="block text-xs font-bold text-slate-800">
                              Instructions de rectification envoyées par email au gérant :
                            </label>
                            <textarea
                              rows={3}
                              value={rectificationText}
                              onChange={(e) => setRectificationText(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                              placeholder="Indiquez les documents ou données à corriger..."
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setShowRectifyInput(false)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold"
                              >
                                Annuler
                              </button>
                              <button
                                type="button"
                                disabled={processingValidation || !rectificationText.trim()}
                                onClick={() => handleRectifyCompany(selectedUser)}
                                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Envoyer par email</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                        <span>Cette entreprise est certifiée et habilitée à soumettre des devis aux clients.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Address details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-medium">Adresse enregistrée :</span>
                <p className="font-semibold text-slate-800 mt-1">
                  {selectedUser.address?.street
                    ? `${selectedUser.address.street}, ${selectedUser.address.city || ""} ${selectedUser.address.governorate || ""}`
                    : selectedUser.company?.address?.city
                    ? `${selectedUser.company.address.city} (${selectedUser.company.address.governorate || ""})`
                    : selectedUser.city || "Adresse non renseignée"}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              {selectedUser.role !== "admin" && (
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedUser)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    selectedUser.isActive !== false
                      ? "border border-rose-200 text-rose-600 hover:bg-rose-50"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                  }`}
                >
                  {selectedUser.isActive !== false ? "Suspendre ce compte" : "Réactiver ce compte"}
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors ml-auto"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Supprimer définitivement ce compte ?</h3>
              <p className="text-xs text-slate-500">
                Vous êtes sur le point de supprimer le compte de{" "}
                <strong className="text-slate-900">
                  {userToDelete.firstName} {userToDelete.lastName}
                </strong>{" "}
                ({userToDelete.email}). Cette action effacera également son profil et ses données associées.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmer la suppression</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
