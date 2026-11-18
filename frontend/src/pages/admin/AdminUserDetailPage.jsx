import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { adminService } from "../../services/api/adminService";
import { formatDate } from "../../utils/cn";
import { ChevronLeft, User, Mail, Phone, MapPin, ShieldCheck, CheckCircle2 } from "lucide-react";

export function AdminUserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getUserById(id);
        setUser(res.data?.user || res.data || null);
      } catch (err) {
        console.error("Erreur chargement utilisateur:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading || !user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const userId = user._id || user.id;
  const userAvatar = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || 'User')}&background=cf0000&color=fff`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour aux utilisateurs</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Fiche Utilisateur #{String(userId).slice(-6)}</h1>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <img
            src={userAvatar}
            alt={user.firstName}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-200"
          />
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-xs text-slate-400">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
              Rôle : {user.role}
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700">
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-400 font-semibold">Téléphone :</span>
            <span>{user.phone || "-"}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-400 font-semibold">Ville :</span>
            <span>{user.city || "-"}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-400 font-semibold">Adresse :</span>
            <span>{user.address || "-"}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-400 font-semibold">Date d'inscription :</span>
            <span>{formatDate(user.createdAt)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400 font-semibold">Statut du compte :</span>
            <span className={user.status === "active" ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
              {user.status === "active" ? "Actif & Vérifié" : "Suspendu"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

