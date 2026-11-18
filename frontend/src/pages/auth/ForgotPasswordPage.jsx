import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { authService } from "../../services/api/authService";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block mb-1">
          Récupération de Compte
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Mot de passe oublié
        </h2>
        <p className="text-xs text-slate-500">
          Entrez votre adresse email pour recevoir un lien de réinitialisation sécurisé
        </p>
      </div>

      {sent ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-14 h-14 rounded-2xl bg-[#800020] border-2 border-white text-white flex items-center justify-center mx-auto shadow-lg shadow-[#800020]/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Si un compte est associé à <strong className="text-slate-900">{email}</strong>, vous recevrez
            les instructions de réinitialisation dans quelques minutes.
            Vérifiez également vos courriers indésirables (spams).
          </p>
          <Link
            to="/login"
            className="block w-full py-3 rounded-xl bg-[#800020] hover:bg-[#660019] text-white text-xs font-bold border-2 border-white shadow-md text-center transition-all"
          >
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#800020] flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Votre adresse email enregistrée
              </label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-sm border-2 border-white transition-all shadow-md shadow-[#800020]/20 flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Envoyer le lien de réinitialisation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </>
      )}

      <div className="text-center pt-2 border-t border-slate-100">
        <Link to="/login" className="text-xs font-bold text-slate-600 hover:text-[#800020] transition-colors">
          ← Retour à la page de connexion
        </Link>
      </div>
    </div>
  );
}
