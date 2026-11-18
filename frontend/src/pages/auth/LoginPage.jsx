import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { GoogleAuthButton } from "../../components/auth/GoogleAuthButton";
import { Mail, Lock, ArrowRight, User, Building2, AlertCircle } from "lucide-react";

export function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "company" ? "company" : "client";

  const [accountType, setAccountType] = useState(initialRole); // "client" | "company"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "company" && accountType !== "company") {
      setAccountType("company");
    } else if (roleParam === "client" && accountType !== "client") {
      setAccountType("client");
    }
  }, [searchParams]);

  const handleTabChange = (type) => {
    setAccountType(type);
    setError("");
    setSearchParams({ role: type });
  };

  const redirectAfterLogin = (user) => {
    if (!user.isEmailVerified && user.role !== "admin") {
      navigate("/verify-email", { state: { email: user.email, role: user.role } });
      return;
    }
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    if (user.role === "admin") navigate("/admin/dashboard", { replace: true });
    else if (user.role === "company") {
      const isApproved = user.company?.verificationStatus === "approved" || user.isApproved;
      navigate(isApproved ? "/company/dashboard" : "/company/pending-approval", { replace: true });
    } else {
      navigate("/client/dashboard", { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      // Pass the expected role strictly
      const user = await login(cleanEmail, password, accountType);

      // Verify that user role strictly matches current portal
      if (user.role !== accountType) {
        await logout();
        setError(
          accountType === "client"
            ? "Ce compte est un compte entreprise ou administrateur. Veuillez vous connecter dans votre espace dédié."
            : "Ce compte n'est pas un compte entreprise! . Veuillez vous connecter dans l'Espace Client."
        );
        return;
      }

      redirectAfterLogin(user);
    } catch (err) {
      setError(err.message || "Identifiants invalides. Veuillez vérifier votre email et mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block mb-1">
          Accès Sécurisé
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Espace de Connexion</h2>
        <p className="text-xs text-slate-500">
          {accountType === "company"
            ? "Accès réservé exclusivement aux sociétés de déménagement agréées"
            : "Accédez à vos devis et gérez vos projets de déménagement"}
        </p>
      </div>

      {/* Two Access Choices Tabs: Client or Company */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border-2 border-slate-200">
        <button
          type="button"
          onClick={() => handleTabChange("client")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${accountType === "client"
              ? "bg-[#800020] text-white shadow-md border-2 border-white"
              : "text-slate-600 hover:text-slate-900"
            }`}
        >
          <User className="w-4 h-4" />
          <span>Espace Client</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("company")}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${accountType === "company"
              ? "bg-slate-900 text-white shadow-md border-2 border-white"
              : "text-slate-600 hover:text-slate-900"
            }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Espace Déménageur</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#800020] flex-shrink-0" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {/* Google Sign-In Option: STRICTLY FOR CLIENT ONLY */}
      {accountType === "client" && (
        <div className="space-y-3 pt-1">
          <GoogleAuthButton
            mode="signin"
            onSuccess={redirectAfterLogin}
            onError={(err) => setError(err)}
          />
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className="bg-white px-3">ou avec votre adresse email</span>
            </div>
          </div>
        </div>
      )}

      {/* Form for active tab */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {accountType === "company" ? "Adresse email professionnelle *" : "Adresse email *"}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                accountType === "company"
                  ? "contact@entreprise-demenagement.tn"
                  : "votre-email@exemple.com"
              }
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">
              Mot de passe *
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-[#800020] hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
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

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 rounded-xl text-white font-bold text-sm border-2 border-white transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-0.5 cursor-pointer ${accountType === "company"
              ? "bg-slate-900 hover:bg-[#800020]"
              : "bg-[#800020] hover:bg-[#660019] shadow-[#800020]/20"
            }`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>
                {accountType === "company"
                  ? "Connexion Espace Entreprise"
                  : "Connexion Espace Client"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Role-Specific Registration Link */}
      <div className="text-center pt-2 space-y-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          {accountType === "company"
            ? "Vous n'êtes pas encore partenaire MoversGo ?"
            : "Pas encore de compte client ?"}{" "}
          <Link
            to={accountType === "company" ? "/register/company" : "/register/client"}
            className="font-bold text-[#800020] hover:underline"
          >
            {accountType === "company" ? "Inscrire ma société" : "S'inscrire gratuitement"}
          </Link>
        </p>
      </div>
    </div>
  );
}
