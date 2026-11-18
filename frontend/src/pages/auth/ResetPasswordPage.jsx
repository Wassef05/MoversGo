import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { authService } from "../../services/api/authService";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [token, setToken] = useState(tokenParam);
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("L'adresse email est requise.");
      return;
    }
    if (!token) {
      setError("Le jeton de réinitialisation est manquant. Veuillez cliquer sur le lien reçu par email.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, email, password);
      setSuccess(true);
      setTimeout(() => {
        if (searchParams.get("admin") === "true") {
          navigate("/login/admin");
        } else {
          navigate("/login");
        }
      }, 2500);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Échec de la réinitialisation. Le lien a peut-être expiré.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block mb-1">
          Sécurité du Compte
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nouveau mot de passe</h2>
        <p className="text-xs text-slate-500">Choisissez un mot de passe robuste d'au moins 8 caractères</p>
      </div>

      {success ? (
        <div className="text-center space-y-3 py-4">
          <div className="w-14 h-14 rounded-2xl bg-[#800020] border-2 border-white text-white flex items-center justify-center mx-auto shadow-lg shadow-[#800020]/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <p className="text-xs font-bold text-slate-800">
            Mot de passe réinitialisé avec succès !
          </p>
          <p className="text-xs text-slate-500 font-mono">
            Redirection automatique vers la connexion...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#800020] flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!emailParam && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Votre email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@email.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
                />
              </div>
            </div>
          )}

          {!tokenParam && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jeton de réinitialisation (Token)</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Collez ici le jeton reçu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nouveau mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirmer le nouveau mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-sm border-2 border-white transition-all shadow-md shadow-[#800020]/20 flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-0.5"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enregistrer le mot de passe</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="text-center pt-2 border-t border-slate-100">
        <Link to="/login" className="text-xs font-bold text-slate-600 hover:text-[#800020] transition-colors">
          ← Retour à la page de connexion
        </Link>
      </div>
    </div>
  );
}
