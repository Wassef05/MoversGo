import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { adminService } from "../../services/api/adminService";
import { StatusBadge } from "../../components/common/StatusBadge";
import { RatingStars } from "../../components/common/RatingStars";
import { toast } from "sonner";
import { getLogoUrl } from "../../utils/cn";
import {
  Search,
  Building2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  MapPin,
  Truck,
  Phone,
  CheckCircle2,
  XCircle,
  ExternalLink
} from "lucide-react";

export function AdminCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getAllCompanies();
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.companies)
              ? res.companies
              : [];
        setCompanies(list);
      } catch (err) {
        console.error("Erreur chargement entreprises:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggleStatus = async (comp) => {
    const compId = comp._id || comp.id;
    const isVerified = comp.verificationStatus === "verified" || comp.verificationStatus === "approved";
    try {
      if (isVerified) {
        await adminService.suspendCompany(compId);
        setCompanies((prev) =>
          prev.map((c) => ((c._id || c.id) === compId ? { ...c, verificationStatus: "suspended", isActive: false } : c))
        );
        toast.warning(`Entreprise "${comp.companyName || comp.name}" suspendue temporairement`, {
          description: "Ses offres ont été masquées et elle ne peut plus répondre aux demandes clients."
        });
      } else {
        await adminService.approveCompany(compId);
        setCompanies((prev) =>
          prev.map((c) => ((c._id || c.id) === compId ? { ...c, verificationStatus: "approved", isActive: true } : c))
        );
        toast.success(`Entreprise "${comp.companyName || comp.name}" réactivée avec succès`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la modification du statut");
    }
  };

  const filtered = companies.filter((c) => {
    const compName = (c.companyName || c.name || "").toLowerCase();
    const compCity = (typeof c.address === "object" ? (c.address?.city || c.address?.governorate || "") : (c.city || c.address || "")).toLowerCase();
    const compSiret = c.legalIdentifier || c.siret || "";

    const matchesSearch =
      compName.includes(searchTerm.toLowerCase()) ||
      compCity.includes(searchTerm.toLowerCase()) ||
      compSiret.includes(searchTerm);
    const matchesCity = cityFilter === "all" || compCity.includes(cityFilter.toLowerCase());
    return matchesSearch && matchesCity;
  });

  const pendingCount = companies.filter(
    (c) =>
      c.verificationStatus === "pending" ||
      c.verificationStatus === "under_review" ||
      c.verificationStatus === "needs_rectification"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Annuaire des Déménageurs Agréés
            </h1>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Conformité Tunisie
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervision du réseau professionnel, vérification RNE, agréments et suspension des contrevenants
          </p>
        </div>

        {pendingCount > 0 && (
          <Link
            to="/admin/companies/pending"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{pendingCount} dossier(s) en attente d'audit</span>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par société, Matricule Fiscal ou ville..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Toute la Tunisie" },
            { id: "Tunis", label: "Grand Tunis" },
            { id: "Sousse", label: "Sousse & Sahel" },
            { id: "Sfax", label: "Sfax" },
            { id: "Nabeul", label: "Cap Bon" },
            { id: "Bizerte", label: "Bizerte" },
          ].map((city) => (
            <button
              key={city.id}
              onClick={() => setCityFilter(city.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${cityFilter === city.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {city.label}
            </button>
          ))}
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Déménageur Partenaire</th>
                <th className="py-3.5 px-4">Matricule Fiscal & RNE</th>
                <th className="py-3.5 px-4">Gouvernorat</th>
                <th className="py-3.5 px-4">Flotte & Monte-charge</th>
                <th className="py-3.5 px-4">Évaluation</th>
                <th className="py-3.5 px-4">Statut Légal</th>
                <th className="py-3.5 px-4 text-right">Actions Modération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <AnimatePresence>
                {filtered.map((c) => {
                  const compId = c._id || c.id;
                  const compName = c.companyName || c.name || "Déménageur";
                  const compLogo = getLogoUrl(c.logo);
                  const compCity = typeof c.address === "object" ? (c.address?.city || c.address?.governorate || "Tunis") : (c.city || c.address || "Tunis");
                  const compGov = typeof c.address === "object" ? (c.address?.governorate || "") : (c.governorate || "");
                  const compSiret = c.legalIdentifier || c.siret || "Non renseigné";
                  const isVerified = c.verificationStatus === "verified" || c.verificationStatus === "approved";

                  return (
                    <motion.tr
                      key={compId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {compLogo ? (
                            <img
                              src={compLogo}
                              alt={compName}
                              className="w-10 h-10 rounded-xl object-contain border border-slate-200 bg-white p-0.5 shadow-xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center font-bold">
                              <Building2 className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{compName}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{c.email || "contact@moveflow.tn"} • {c.phone || "Non renseigné"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <p className="font-bold text-slate-900">{compSiret}</p>
                        <p className="text-slate-400">Agrément Min. Transport</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{compCity}</span>
                        {compGov && <p className="text-[10px] text-slate-400">{compGov}</p>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900">{c.fleetSize || 2} camions</span>
                        <p className="text-[10px] text-emerald-700 font-medium">Monte-charge dispo</p>
                      </td>
                      <td className="py-3.5 px-4">
                        {(c.rating || c.averageRating) > 0 ? (
                          <div>
                            <RatingStars rating={c.rating || c.averageRating} size="sm" />
                            <span className="text-[10px] text-slate-400">({c.reviewsCount || c.totalReviews || 1} avis)</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Nouveau pro</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.verificationStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/companies/${compId}`}
                            target="_blank"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 inline-flex items-center"
                            title="Voir la vitrine publique"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          {isVerified ? (
                            <button
                              onClick={() => handleToggleStatus(c)}
                              className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition-colors"
                            >
                              Suspendre
                            </button>
                          ) : c.verificationStatus === "suspended" ? (
                            <button
                              onClick={() => handleToggleStatus(c)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-bold transition-colors shadow-xs"
                            >
                              Réactiver
                            </button>
                          ) : (
                            <Link
                              to="/admin/companies/pending"
                              className="px-2.5 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 text-[11px] font-bold transition-colors shadow-xs"
                            >
                              Auditer
                            </Link>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
