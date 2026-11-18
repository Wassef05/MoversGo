import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/api/authService";
import { APP_CONFIG, getCoordinatesForGovernorate, getCurrentGpsLocation } from "../../config/appConfig";
import {
  ArrowRight,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Navigation,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X,
  Sparkles,
} from "lucide-react";

export function RegisterClientPage() {
  const { register, setCurrentUserDirectly } = useAuth();
  const navigate = useNavigate();

  // "idle" | "verifying" | "verified"
  const [googleStep, setGoogleStep] = useState("idle");
  const [googleData, setGoogleData] = useState(null);
  const [googleCode, setGoogleCode] = useState(["", "", "", "", "", ""]);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [codeSuccessMsg, setCodeSuccessMsg] = useState("");

  // Modal for Google browser account detection if GIS client ID is not configured
  const [showBrowserDetectModal, setShowBrowserDetectModal] = useState(false);
  const [browserEmail, setBrowserEmail] = useState("");
  const [browserFirstName, setBrowserFirstName] = useState("");
  const [browserLastName, setBrowserLastName] = useState("");

  const codeInputsRef = useRef([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    governorate: "Tunis",
    city: "",
    street: "",
    latitude: 36.8065,
    longitude: 10.1815,
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsDetected, setGpsDetected] = useState(false);
  const [gpsMessage, setGpsMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (googleStep === "verifying") {
      codeInputsRef.current[0]?.focus();
    }
  }, [googleStep]);

  const handleGovernorateChange = (gov) => {
    const coords = getCoordinatesForGovernorate(gov);
    setFormData((prev) => ({
      ...prev,
      governorate: gov,
      ...(!gpsDetected && coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
    }));
  };

  const handleDetectGps = async () => {
    setDetectingGps(true);
    setGpsMessage("");
    setError("");
    try {
      const pos = await getCurrentGpsLocation();
      setFormData((prev) => ({
        ...prev,
        latitude: pos.latitude,
        longitude: pos.longitude,
      }));
      setGpsDetected(true);
      setGpsMessage(`Position GPS détectée avec précision (${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)})`);
    } catch (err) {
      setGpsMessage(err.message || "Impossible de récupérer la position GPS.");
    } finally {
      setDetectingGps(false);
    }
  };

  // ── Step 1: Detect Google account from browser ──
  const handleGoogleSignupClick = () => {
    setError("");
    const clientId = localStorage.getItem("moveflow_google_client_id") || import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (clientId && window.google?.accounts?.oauth2) {
      try {
        setLoading(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email profile",
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              try {
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await res.json();
                await initiateGoogleSignupFlow({
                  email: profile.email,
                  firstName: profile.given_name || profile.name?.split(" ")[0] || "Client",
                  lastName: profile.family_name || profile.name?.split(" ").slice(1).join(" ") || "",
                  googleId: profile.sub,
                  profileImage: profile.picture || null,
                });
              } catch (err) {
                setError(err.response?.data?.message || err.message || "Erreur de détection Google.");
              } finally {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (e) {
        console.warn("GIS token client error:", e);
      }
    }

    // Direct browser Google detection modal
    setShowBrowserDetectModal(true);
  };

  const initiateGoogleSignupFlow = async (detectedUser) => {
    setLoading(true);
    setError("");
    try {
      const res = await authService.googleInit(detectedUser);

      if (res?.data?.alreadyRegistered && res?.data?.isEmailVerified) {
        // If already registered and verified, redirect to login or dashboard
        if (setCurrentUserDirectly && res.data.user) {
          setCurrentUserDirectly(res.data.user);
        }
        navigate("/client/dashboard", { replace: true });
        return;
      }

      setGoogleData(detectedUser);
      setFormData((prev) => ({
        ...prev,
        email: detectedUser.email,
        firstName: detectedUser.firstName,
        lastName: detectedUser.lastName,
      }));
      setGoogleStep("verifying");
      setCodeSuccessMsg(
        `Code de confirmation envoyé avec succès à ${detectedUser.email}`
      );
      setShowBrowserDetectModal(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Impossible d'initier l'inscription Google."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBrowserModalSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = browserEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Veuillez saisir votre adresse email Google.");
      return;
    }

    let fName = browserFirstName.trim();
    let lName = browserLastName.trim();
    if (!fName) {
      const namePart = cleanEmail.split("@")[0];
      const parts = namePart.split(/[._-]/);
      fName = parts[0]?.charAt(0).toUpperCase() + parts[0]?.slice(1) || "Client";
      lName = parts[1] ? parts[1]?.charAt(0).toUpperCase() + parts[1]?.slice(1) : "";
    }

    initiateGoogleSignupFlow({
      email: cleanEmail,
      firstName: fName,
      lastName: lName,
      googleId: `google_${Date.now()}`,
    });
  };

  // ── Step 2: Verify the 6-digit code on the page ──
  const handleCodeChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...googleCode];
    newCode[index] = digit;
    setGoogleCode(newCode);
    setError("");

    if (digit && index < 5) {
      codeInputsRef.current[index + 1]?.focus();
    }

    // Auto-verify when 6th digit entered
    if (digit && index === 5 && newCode.every((d) => d !== "")) {
      verifyGoogleCodeDirectly(newCode.join(""));
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !googleCode[index] && index > 0) {
      codeInputsRef.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split("");
      setGoogleCode(digits);
      e.preventDefault();
      verifyGoogleCodeDirectly(pasted);
    }
  };

  const verifyGoogleCodeDirectly = async (fullCode) => {
    if (!fullCode || fullCode.length < 6) {
      setError("Veuillez saisir le code à 6 chiffres reçu par email.");
      return;
    }

    setVerifyingCode(true);
    setError("");
    try {
      await authService.googleVerifyCode(googleData.email, fullCode);
      setGoogleStep("verified");
      setCodeSuccessMsg("Email Google vérifié avec succès ! Renseignez maintenant votre localisation.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Code de vérification invalide ou expiré."
      );
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (!googleData?.email) return;
    setResendingCode(true);
    setError("");
    setCodeSuccessMsg("");
    try {
      await authService.googleInit(googleData);
      setCodeSuccessMsg(`Un nouveau code a été envoyé à ${googleData.email}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erreur lors de l'envoi du code.");
    } finally {
      setResendingCode(false);
    }
  };

  // ── Step 3: Complete registration (Localisation & Coordonnées) ──
  const handleGoogleCompleteSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.acceptTerms) {
      setError("Veuillez accepter les conditions générales d'utilisation.");
      return;
    }

    if (!formData.phone || formData.phone.length < 8) {
      setError("Veuillez indiquer un numéro de téléphone mobile valide.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.googleComplete({
        email: googleData.email,
        firstName: formData.firstName || googleData.firstName,
        lastName: formData.lastName || googleData.lastName,
        phone: formData.phone.trim(),
        governorate: formData.governorate,
        city: formData.city.trim() || formData.governorate,
        street: formData.street.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        password: formData.password || undefined,
      });

      if (res?.data?.user) {
        if (setCurrentUserDirectly) {
          setCurrentUserDirectly(res.data.user);
        }
      }

      navigate("/client/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erreur lors de la finalisation.");
    } finally {
      setLoading(false);
    }
  };

  // Standard non-Google registration handler
  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!formData.acceptTerms) {
      setError("Veuillez accepter les conditions générales d'utilisation.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = formData.email.trim();
      try {
        localStorage.setItem("moveflow_tn_registered_email", cleanEmail);
      } catch { }

      await register({
        role: "client",
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: cleanEmail,
        phone: formData.phone.trim(),
        governorate: formData.governorate,
        city: formData.city.trim() || formData.governorate,
        street: formData.street.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        password: formData.password,
      });

      navigate("/verify-email", { state: { email: cleanEmail, role: "client" } });
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block mb-1">
          Espace Particuliers
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Inscription Particulier</h2>
        <p className="text-xs text-slate-500">
          {googleStep === "verifying"
            ? "Vérification directe de votre compte Google"
            : googleStep === "verified"
            ? "Complétez votre localisation & coordonnées pour vos devis"
            : "Gratuit et sans engagement pour comparer vos devis de déménagement"}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-[#800020] flex-shrink-0" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      {codeSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="leading-snug">{codeSuccessMsg}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          FLOW 1: IDLE STATE (Prominent Google button or classic registration)
      ───────────────────────────────────────────────────────────────────────────── */}
      {googleStep === "idle" && (
        <>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/70 via-white to-slate-50 border-2 border-[#800020]/20 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900">
              <Sparkles className="w-4 h-4 text-[#800020]" />
              <span>Inscription rapide en 1 clic</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Détecte automatiquement votre compte Google du navigateur (nom, prénom et email) avec vérification immédiate.
            </p>

            <button
              type="button"
              onClick={handleGoogleSignupClick}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-60"
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
              <span>S'inscrire avec Google</span>
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span className="bg-white px-3">ou inscription classique par email</span>
            </div>
          </div>

          {/* Standard Form */}
          <form onSubmit={handleStandardSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Yassine"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Ben Salem"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="yassine.bensalem@email.tn"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone mobile *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+216 98 123 456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
                />
              </div>
            </div>

            {/* Localisation Client */}
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#800020]" />
                  <span>Localisation & Coordonnées</span>
                </span>
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={detectingGps}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white border-2 border-white text-[11px] font-bold transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  <Navigation className={`w-3 h-3 ${detectingGps ? "animate-spin" : ""}`} />
                  <span>{detectingGps ? "Détection..." : "📍 Détecter mon GPS"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Gouvernorat *</label>
                  <select
                    required
                    value={formData.governorate}
                    onChange={(e) => handleGovernorateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                  >
                    {APP_CONFIG.governorates.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Ville / Quartier</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ex: Ennasr 2, La Marsa"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Rue / Adresse</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Ex: Avenue Hédi Nouira, Résidence Les Palmiers"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                />
              </div>

              {/* GPS Coordinates Feedback */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${gpsDetected ? "bg-emerald-500" : "bg-amber-400"}`} />
                  GPS : {formData.latitude.toFixed(4)}°, {formData.longitude.toFixed(4)}°
                </span>
                <a
                  href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#800020] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Vérifier</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              {gpsMessage && (
                <p className={`text-[11px] ${gpsDetected ? "text-emerald-700 font-semibold" : "text-amber-700"}`}>
                  {gpsMessage}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirmer *</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                required
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-[#800020] focus:ring-[#800020]"
              />
              <label htmlFor="terms" className="text-xs text-slate-500 leading-tight">
                J'accepte les <Link to="/legal/terms" className="underline font-bold text-slate-700 hover:text-[#800020]">Conditions Générales</Link> et certifie l'exactitude de mes coordonnées.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-sm border-2 border-white transition-all shadow-md shadow-[#800020]/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 hover:-translate-y-0.5 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Créer mon compte particulier</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          FLOW 2: GOOGLE DIRECT VERIFICATION STEP ("le client tape les code de verification")
      ───────────────────────────────────────────────────────────────────────────── */}
      {googleStep === "verifying" && (
        <div className="p-5 rounded-2xl bg-white border-2 border-[#800020] shadow-md space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-[#800020] flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5 text-[#800020]" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#800020]">
                  Étape 1/2 • Validation Google
                </p>
                <h3 className="text-sm font-bold text-slate-900">
                  {googleData?.firstName} {googleData?.lastName}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setGoogleStep("idle");
                setError("");
              }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700"
            >
              Modifier
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-600 leading-relaxed">
              Un code de vérification à 6 chiffres a été envoyé à :
            </p>
            <p className="text-xs font-mono font-bold text-slate-900 bg-slate-50 py-1 px-2.5 rounded-lg border border-slate-200 inline-block">
              {googleData?.email}
            </p>
          </div>

          {/* 6 Digit Input Boxes */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Saisissez votre code à 6 chiffres :
            </label>
            <div className="flex justify-between gap-2 max-w-xs mx-auto" onPaste={handleCodePaste}>
              {googleCode.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (codeInputsRef.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(idx, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                  className="w-11 h-13 text-center text-xl font-bold font-mono rounded-xl border-2 border-slate-300 focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/20 bg-slate-50 focus:bg-white transition-all outline-none"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendingCode}
              className="text-xs font-semibold text-[#800020] hover:underline flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resendingCode ? "animate-spin" : ""}`} />
              <span>{resendingCode ? "Envoi..." : "Renvoyer le code"}</span>
            </button>

            <button
              type="button"
              onClick={() => verifyGoogleCodeDirectly(googleCode.join(""))}
              disabled={verifyingCode || googleCode.some((d) => !d)}
              className="px-5 py-2.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white text-xs font-bold border-2 border-white transition-all shadow-md shadow-[#800020]/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {verifyingCode ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Vérifier le code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          FLOW 3: VERIFIED GOOGLE IDENTITY -> COMPLETE LOCALISATION & COORDONNÉES
      ───────────────────────────────────────────────────────────────────────────── */}
      {googleStep === "verified" && (
        <form onSubmit={handleGoogleCompleteSubmit} className="space-y-4 animate-in fade-in duration-200">
          {/* Verified Google Badge */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-300 inline-block">
                  Compte Google Vérifié
                </span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {formData.firstName || googleData?.firstName} {formData.lastName || googleData?.lastName}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">{googleData?.email}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
              Étape 2/2
            </span>
          </div>

          {/* Coordonnées */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Numéro de téléphone mobile *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+216 98 123 456"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all font-medium"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Nécessaire pour recevoir les notifications de devis des déménageurs partenaires.
            </p>
          </div>

          {/* Localisation & Coordonnées (Tunisie) */}
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#800020]" />
                <span>Localisation & Coordonnées</span>
              </span>
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={detectingGps}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white border-2 border-white text-[11px] font-bold transition-all disabled:opacity-50 shadow-sm cursor-pointer"
              >
                <Navigation className={`w-3 h-3 ${detectingGps ? "animate-spin" : ""}`} />
                <span>{detectingGps ? "Détection..." : "📍 Détecter mon GPS"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Gouvernorat *</label>
                <select
                  required
                  value={formData.governorate}
                  onChange={(e) => handleGovernorateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                >
                  {APP_CONFIG.governorates.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Ville / Délégation *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ex: La Marsa, Menzah..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Rue / Adresse</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Ex: Avenue Habib Bourguiba"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
              />
            </div>

            {/* GPS Feedback */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 font-mono">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${gpsDetected ? "bg-emerald-500" : "bg-amber-400"}`} />
                GPS : {formData.latitude.toFixed(4)}°, {formData.longitude.toFixed(4)}°
              </span>
              <a
                href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#800020] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Vérifier</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            {gpsMessage && (
              <p className={`text-[11px] ${gpsDetected ? "text-emerald-700 font-semibold" : "text-amber-700"}`}>
                {gpsMessage}
              </p>
            )}
          </div>

          {/* Optional Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mot de passe de secours (Optionnel)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="•••••••• (Optionnel : vous pouvez vous connecter directement avec Google)"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="terms-google"
              required
              checked={formData.acceptTerms}
              onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
              className="mt-0.5 rounded border-slate-300 text-[#800020] focus:ring-[#800020]"
            />
            <label htmlFor="terms-google" className="text-xs text-slate-500 leading-tight">
              J'accepte les <Link to="/legal/terms" className="underline font-bold text-slate-700 hover:text-[#800020]">Conditions Générales</Link> et certifie l'exactitude de mes coordonnées.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-sm border-2 border-white transition-all shadow-md shadow-[#800020]/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 hover:-translate-y-0.5 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Finaliser mon inscription & Accéder à mon espace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          Modal for Browser Google Account Detection / Confirmation
      ───────────────────────────────────────────────────────────────────────────── */}
      {showBrowserDetectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowBrowserDetectModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2 mb-4">
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
                Compte Google du navigateur
              </h3>
              <p className="text-xs text-slate-500">
                Confirmez votre adresse email Google pour détecter automatiquement votre nom et prénom :
              </p>
            </div>

            <form onSubmit={handleBrowserModalSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Google personnel (Gmail) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="votre.compte@gmail.com"
                  value={browserEmail}
                  onChange={(e) => setBrowserEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Prénom (détecté)
                  </label>
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={browserFirstName}
                    onChange={(e) => setBrowserFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nom (détecté)
                  </label>
                  <input
                    type="text"
                    placeholder="Nom"
                    value={browserLastName}
                    onChange={(e) => setBrowserLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020] bg-white"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-200/60 text-[11px] text-slate-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#800020] flex-shrink-0" />
                <span>
                  Un code de vérification à 6 chiffres sera immédiatement envoyé pour validation.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-xs transition-all shadow-md shadow-[#800020]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Envoyer le code de vérification</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer Links */}
      <div className="text-center pt-2 space-y-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Vous avez déjà un compte ?{" "}
          <Link to="/login?role=client" className="font-bold text-[#800020] hover:underline">
            Se connecter
          </Link>
        </p>
        <p className="text-xs text-slate-500">
          Vous êtes un déménageur pro ?{" "}
          <Link to="/register/company" className="font-bold text-[#800020] hover:underline">
            Inscription Entreprise
          </Link>
        </p>
      </div>
    </div>
  );
}
