import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/api/authService";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  ChevronLeft,
} from "lucide-react";

export function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password mode state
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const user = await login(cleanEmail, password, "admin");

      // Verify that the user has admin role
      if (user.role !== "admin") {
        await logout();
        setError("Accès refusé : Ce portail est strictement réservé aux administrateurs autorisés de MoversGo.");
        setLoading(false);
        return;
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Identifiants administrateur invalides. Veuillez vérifier votre adresse et mot de passe."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);

    try {
      const cleanEmail = forgotEmail.trim().toLowerCase();
      await authService.forgotPassword(cleanEmail);
      setForgotSent(true);
    } catch (err) {
      setForgotError(
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de l'envoi des instructions de réinitialisation."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Subtle background security grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #800020 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Header Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#800020] border-2 border-white text-white shadow-2xl mx-auto">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-slate-300 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Portail Haute Sécurité</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Console d'Administration
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              MoversGo Tunisie • Accès réservé au personnel habilité
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="mt-8 bg-slate-900/95 py-8 px-6 sm:px-8 rounded-[2.2rem] border-2 border-slate-800 shadow-2xl space-y-6">
          {forgotMode ? (
            /* FORGOT PASSWORD SUB-VIEW */
            <div className="space-y-5">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(false);
                    setForgotSent(false);
                    setForgotError("");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Retour à la connexion</span>
                </button>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-rose-400" />
                  <span>Réinitialisation du mot de passe</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Saisissez l'adresse email de votre compte administrateur.
                </p>
              </div>

              {forgotSent ? (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Lien de réinitialisation transmis !</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-300/90 font-mono">
                    Un email sécurisé contenant un lien de renouvellement a été envoyé à <strong>{forgotEmail}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(false);
                      setForgotSent(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
                  >
                    Retour à l'écran de connexion
                  </button>
                </div>
              ) : (
                <>
                  {forgotError && (
                    <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Email administrateur
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="admin@moveflow.tn"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full py-3 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-xs border-2 border-white transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {forgotLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Envoyer le lien par email</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          ) : (
            /* STANDARD ADMIN LOGIN FORM */
            <>
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Identifiant / Email Administrateur
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@moveflow.tn"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotMode(true);
                        setForgotEmail(email);
                        setError("");
                      }}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-xs border-2 border-white transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Accéder à la console</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="pt-2 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 font-mono">
              Connexion sécurisée via chiffrement SSL/TLS • Traçabilité IP active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
