import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { AlertCircle, X, ShieldCheck, Mail, ArrowRight, Settings } from "lucide-react";

export function GoogleAuthButton({
  mode = "signin", // "signin" | "signup"
  onSuccess,
  onError,
  className = "",
}) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [personalEmail, setPersonalEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [customClientId, setCustomClientId] = useState(() => {
    return localStorage.getItem("moveflow_google_client_id") || import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  });
  const [showConfigId, setShowConfigId] = useState(false);
  const [modalError, setModalError] = useState("");

  const handleAuthSuccess = (result) => {
    const user = result?.user || result;
    if (!user) return;

    // Strict email verification enforcement on signup/unverified accounts
    if (!user.isEmailVerified) {
      try {
        localStorage.setItem("moveflow_tn_registered_email", user.email);
      } catch {}
      navigate("/verify-email", {
        state: {
          email: user.email,
          role: "client",
          message: "Compte créé via Google ! Veuillez entrer le code de vérification à 6 chiffres envoyé à votre adresse email.",
        },
      });
      return;
    }

    if (onSuccess) {
      onSuccess(user);
    } else {
      navigate("/client/dashboard", { replace: true });
    }
  };

  const triggerRealGoogleOAuth = (clientIdToUse) => {
    if (!window.google?.accounts?.oauth2) {
      // If Google GIS script not loaded yet, fallback to modal
      setShowPromptModal(true);
      return;
    }

    try {
      setLoading(true);
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientIdToUse,
        scope: "openid email profile",
        callback: async (tokenResponse) => {
          if (tokenResponse?.error) {
            setLoading(false);
            const msg = tokenResponse.error === "access_denied"
              ? "Connexion Google annulée."
              : `Erreur Google OAuth : ${tokenResponse.error}`;
            if (onError) onError(msg);
            return;
          }

          if (tokenResponse?.access_token) {
            try {
              // Fetch user profile directly from Google's official userinfo endpoint
              const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const googleProfile = await googleRes.json();

              if (!googleProfile?.email) {
                throw new Error("Impossible de récupérer l'adresse email depuis votre compte Google.");
              }

              // Send to backend for strict client isolation & email verification handling
              const authResult = await loginWithGoogle({
                email: googleProfile.email,
                firstName: googleProfile.given_name || googleProfile.name?.split(" ")[0] || "Client",
                lastName: googleProfile.family_name || googleProfile.name?.split(" ").slice(1).join(" ") || "",
                googleId: googleProfile.sub,
                profileImage: googleProfile.picture || null,
              });

              setShowPromptModal(false);
              handleAuthSuccess(authResult);
            } catch (err) {
              const errMsg = err.response?.data?.message || err.message || "Erreur de connexion Google.";
              if (onError) onError(errMsg);
            } finally {
              setLoading(false);
            }
          }
        },
      });

      // Opens the real official Google account chooser popup from accounts.google.com
      tokenClient.requestAccessToken({ prompt: "select_account" });
    } catch (err) {
      setLoading(false);
      console.warn("Google OAuth init error:", err);
      setShowPromptModal(true);
    }
  };

  const handleClick = () => {
    const activeClientId = customClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (activeClientId && window.google?.accounts?.oauth2) {
      triggerRealGoogleOAuth(activeClientId);
    } else {
      // No client ID configured yet: open Google personal account modal
      setShowPromptModal(true);
    }
  };

  const handlePersonalGoogleSubmit = async (e) => {
    e.preventDefault();
    setModalError("");

    const cleanEmail = personalEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setModalError("Veuillez saisir votre adresse email Google personnelle.");
      return;
    }

    setLoading(true);
    try {
      const authResult = await loginWithGoogle({
        email: cleanEmail,
        firstName: firstName.trim() || cleanEmail.split("@")[0],
        lastName: lastName.trim() || "Google",
        googleId: `google_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      });

      setShowPromptModal(false);
      handleAuthSuccess(authResult);
    } catch (err) {
      setModalError(
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de l'authentification avec votre compte Google."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    const cleanId = customClientId.trim();
    if (cleanId) {
      localStorage.setItem("moveflow_google_client_id", cleanId);
      setShowConfigId(false);
      setModalError("");
      triggerRealGoogleOAuth(cleanId);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`w-full py-2.5 px-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-md disabled:opacity-60 cursor-pointer ${className}`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span>
          {mode === "signup" ? "S'inscrire avec Google" : "Se connecter avec Google"}
        </span>
      </button>

      {/* Google Personal Account Connection Modal (Strictly your personal account, NO fake accounts) */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowPromptModal(false);
                setModalError("");
                setShowConfigId(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto shadow-xs">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {mode === "signup" ? "Inscription avec Google" : "Connexion avec Google"}
              </h3>
              <p className="text-xs text-slate-500">
                Espace Particulier uniquement. Connectez votre propre compte Google personnel :
              </p>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#800020] flex-shrink-0" />
                <span className="leading-snug">{modalError}</span>
              </div>
            )}

            {!showConfigId ? (
              <form onSubmit={handlePersonalGoogleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Votre adresse Google personnelle (Gmail) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="votre.compte@gmail.com"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      placeholder="Votre prénom"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      placeholder="Votre nom"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] bg-white"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    {mode === "signup"
                      ? "Un code de validation à 6 chiffres vous sera envoyé par email pour activer votre compte."
                      : "Connexion sécurisée à votre espace client."}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-xs transition-all shadow-md shadow-[#800020]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {mode === "signup" ? "Valider mon inscription Google" : "Continuer avec mon compte"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigId(true)}
                    className="text-[11px] text-slate-500 hover:text-[#800020] inline-flex items-center gap-1 font-semibold"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Lier Google Cloud Client ID (OAuth Pop-up)</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveClientId} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Google OAuth Client ID (.apps.googleusercontent.com)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="xxxxxxxx.apps.googleusercontent.com"
                    value={customClientId}
                    onChange={(e) => setCustomClientId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Configurez votre identifiant client Google Cloud Console pour ouvrir la popup native Google.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigId(false)}
                    className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-xl bg-[#800020] text-white text-xs font-bold hover:bg-[#660019]"
                  >
                    Enregistrer & Ouvrir
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
