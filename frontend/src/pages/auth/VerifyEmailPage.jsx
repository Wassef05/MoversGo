import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { MailCheck, RefreshCw, ArrowRight, AlertCircle, CheckCircle2, Edit3, Clock, Building2, ShieldAlert, FileCheck } from "lucide-react";
import { authService } from "../../services/api/authService";

export function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => {
    return (
      location.state?.email ||
      localStorage.getItem("moveflow_tn_registered_email") ||
      ""
    );
  });
  const [role, setRole] = useState(() => {
    return location.state?.role || (location.state?.isCompany ? "company" : "client");
  });
  const [isEditingEmail, setIsEditingEmail] = useState(!email);

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
      try {
        localStorage.setItem("moveflow_tn_registered_email", location.state.email);
      } catch { }
    }
    if (location.state?.role) {
      setRole(location.state.role);
    }
  }, [location.state]);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError("");
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("Veuillez entrer le code à 6 chiffres.");
      return;
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) {
      setError("Veuillez renseigner votre adresse email pour valider le code.");
      setIsEditingEmail(true);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await authService.verifyEmail(cleanEmail, fullCode);
      const userRole = res?.data?.role || res?.role || role;
      setRole(userRole);
      setVerified(true);
      if (userRole !== "company") {
        setTimeout(() => {
          if (userRole === "admin") navigate("/admin/dashboard");
          else navigate("/client/dashboard");
        }, 2500);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Code incorrect ou expiré.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) {
      setError("Veuillez spécifier votre adresse email pour renvoyer le code.");
      setIsEditingEmail(true);
      return;
    }
    setResending(true);
    setResent(false);
    setError("");
    try {
      await authService.resendVerification(cleanEmail);
      setResent(true);
      setCode(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      setError("Impossible de renvoyer l'email. Veuillez réessayer.");
    } finally {
      setResending(false);
    }
  };

  if (verified && role === "company") {
    return (
      <div className="space-y-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto border-2 border-white shadow-md">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Compte en attente de validation administrative
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Email validé avec succès ! 🎉
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Votre compte entreprise a été enregistré et vos pièces légales (extrait RNE) ont été transmises à l'équipe administrative de MoversGo Tunisie.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-left space-y-2 text-xs text-slate-700">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Processus d'agrément en cours :</span>
          </p>
          <ul className="space-y-1.5 text-slate-600 pl-5 list-disc text-[11px] leading-relaxed">
            <li>Un email et une notification ont été expédiés à l'administrateur avec votre dossier RNE.</li>
            <li>L'administration vérifie l'authenticité de l'extrait RNE (&lt; 3 mois) et votre matricule fiscal.</li>
            <li>Dès validation, votre compte sera immédiatement activé et vous recevrez un email officiel de confirmation.</li>
          </ul>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
          🔒 L'accès au tableau de bord reste temporairement verrouillé jusqu'à la validation de votre dossier par l'administrateur.
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate("/company/pending-approval")}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-[#800020] text-white text-xs font-bold border-2 border-white transition-all shadow-md flex items-center justify-center gap-2 group"
          >
            <span>Suivre l'état de mon dossier</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border-2 border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#800020] border-2 border-white text-white flex items-center justify-center mx-auto shadow-lg shadow-[#800020]/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Email vérifié avec succès ! 🎉</h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Votre compte est désormais actif. Redirection automatique vers votre espace...
          </p>
        </div>
        <div className="w-5 h-5 border-2 border-[#800020] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#800020] border-2 border-white text-white flex items-center justify-center mx-auto shadow-lg shadow-[#800020]/20">
        <MailCheck className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block">
          Authentification
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Vérifiez votre boîte mail</h2>
        {email && !isEditingEmail ? (
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-xs text-slate-600 leading-relaxed">
              Un code de vérification à 6 chiffres a été envoyé à :
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
              <span className="font-bold text-xs text-slate-900 font-mono">{email}</span>
              <button
                type="button"
                onClick={() => setIsEditingEmail(true)}
                className="text-slate-400 hover:text-[#800020] transition-colors"
                title="Modifier l'email"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-xs mx-auto text-left space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Adresse email du compte :</label>
            <div className="flex items-center gap-1.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre-email@exemple.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
              />
              {email && (
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(false)}
                  className="text-xs font-bold text-slate-700 hover:text-[#800020] px-3 py-2 bg-slate-100 rounded-xl"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col gap-2 text-left">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#800020] flex-shrink-0" />
            <span>{error}</span>
          </div>
          {error.includes("Aucun compte") && (
            <Link
              to={role === "company" ? "/register/company" : "/register/client"}
              className="font-bold underline text-[#800020] hover:text-[#660019] inline-block mt-0.5"
            >
              Créer mon compte maintenant →
            </Link>
          )}
        </div>
      )}

      {resent && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 text-left">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>Un nouveau code a été envoyé à {email}.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 6-digit OTP input */}
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-slate-200 focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/20 focus:outline-none transition-colors bg-white text-slate-900"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || code.join("").length < 6}
          className="w-full py-3.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-sm border-2 border-white transition-all shadow-md shadow-[#800020]/20 flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-0.5"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Vérifier mon email</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <button
        onClick={handleResend}
        disabled={resending}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#800020] disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
        <span>{resending ? "Envoi en cours..." : "Renvoyer le code"}</span>
      </button>
    </div>
  );
}
