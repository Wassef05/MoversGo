import React, { useState } from "react";
import { Link } from "react-router-dom";
import { APP_CONFIG } from "../../config/appConfig";
import { contactService } from "../../services/api/contactService";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Headphones,
  Check,
  Building2,
  Loader2,
} from "lucide-react";

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    governorate: "Tunis",
    subject: "question_particulier",
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactService.submitContactMessage(formData);
      setSubmitted(true);
      toast.success("Message transmis avec succès à nos coordinateurs !");
    } catch (err) {
      toast.error(err?.message || err?.response?.data?.message || "Erreur lors de l'envoi de votre message. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      governorate: "Tunis",
      subject: "question_particulier",
      message: "",
    });
    setSubmitted(false);
  };

  return (
    <div className="relative min-h-screen bg-slate-50/70 py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#800020] selection:text-white">
      {/* Subtle architectural background texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #800020 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-7xl mx-auto space-y-12 z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#800020] text-white border-2 border-white shadow-md text-xs font-mono font-bold uppercase tracking-wider">
            <Headphones className="w-3.5 h-3.5" />
            <span>Support Déménagement Tunisie • 7j/7</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Une question ? Parlons de votre projet
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Nos coordinateurs logistiques basés à Tunis vous assistent en direct pour vos devis, inventaires et mises en relation sur l'ensemble des 24 gouvernorats.
          </p>
        </div>

        {/* Main Grid: Info Console + Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Info Card Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-7 sm:p-8 border-2 border-slate-200/90 shadow-sm space-y-7 relative overflow-hidden">
              <div className="space-y-2 border-b border-slate-100 pb-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    Siège Social MoversGo
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    En direct
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight pt-1">
                  Coordination & Assistance
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Notre équipe centrale est à votre écoute pour auditer vos besoins de transport, monte-meuble et emballage.
                </p>
              </div>

              {/* Contact Channels */}
              <div className="space-y-3.5 text-xs">
                {/* Address */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-[#800020] transition-all">
                  <div className="w-11 h-11 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Bureau Principal</p>
                    <p className="text-slate-900 font-bold text-sm mt-0.5">{APP_CONFIG.contact.address}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Grand Tunis • GPS : 36.8065° N, 10.1815° E</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-[#800020] transition-all">
                  <div className="w-11 h-11 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Ligne Directe & Fixe</p>
                    <a
                      href={`tel:${APP_CONFIG.contact.phone}`}
                      className="text-slate-900 font-bold text-sm mt-0.5 block hover:text-[#800020] transition-colors"
                    >
                      {APP_CONFIG.contact.phone} / {APP_CONFIG.contact.mobilePhone}
                    </a>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Appel non surtaxé (Tunisie)</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-[#800020] transition-all">
                  <div className="w-11 h-11 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Courriel Officiel</p>
                    <a
                      href={`mailto:${APP_CONFIG.contact.email}`}
                      className="text-slate-900 font-bold text-sm mt-0.5 block hover:text-[#800020] transition-colors"
                    >
                      {APP_CONFIG.contact.email}
                    </a>
                    <p className="text-[11px] text-slate-500 mt-0.5">Réponse sous 2 heures ouvrées</p>
                  </div>
                </div>

                {/* Working hours */}
                <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-[#800020] transition-all">
                  <div className="w-11 h-11 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Horaires d'Assistance</p>
                    <p className="text-slate-900 font-bold text-sm mt-0.5">{APP_CONFIG.contact.workingHours}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Permanence d'astreinte les week-ends</p>
                  </div>
                </div>
              </div>

              {/* Photo showcase card */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200/90 shadow-sm group">
                <img
                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80"
                  alt="Centre logistique MoversGo Tunisie"
                  className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                  <div>
                    <p className="text-xs font-bold">Plateforme de Régulation Tunisie</p>
                    <p className="text-[10px] text-slate-300 font-mono">Audits & vérification des transporteurs</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#800020] text-white border-2 border-white text-[10px] font-mono font-bold shadow-sm">
                    24 Régions
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-7 sm:p-10 border-2 border-slate-200/90 shadow-sm relative">
            {submitted ? (
              <div className="py-16 text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-[#800020] border-2 border-white text-white flex items-center justify-center mx-auto shadow-xl shadow-[#800020]/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    Message transmis avec succès !
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Merci <strong className="text-slate-900">{formData.name}</strong>, notre équipe d'assistance logistique prend en charge votre demande et vous répondra sous 2 heures à l'adresse <span className="font-semibold text-[#800020]">{formData.email}</span>.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-[#800020] max-w-md mx-auto flex items-center gap-2 text-left">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 text-[#800020]" />
                  <span>Un coordinateur vous joindra également par téléphone au <strong>{formData.phone}</strong> si nécessaire.</span>
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-[#800020] text-white text-xs font-bold border-2 border-white transition-colors shadow-md"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1 border-b border-slate-100 pb-4">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#800020]">
                    Formulaire de Contact
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Écrivez-nous votre message
                  </h2>
                  <p className="text-xs text-slate-500">
                    Renseignez vos coordonnées pour recevoir une estimation ou un conseil logistique sans engagement.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nom complet <span className="text-[#800020]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Yassine Ben Salem"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-slate-50/60 hover:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Adresse Email <span className="text-[#800020]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="yassine@exemple.tn"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-slate-50/60 hover:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Téléphone mobile <span className="text-[#800020]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+216 98 123 456"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-slate-50/60 hover:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Gouvernorat de référence
                    </label>
                    <select
                      value={formData.governorate}
                      onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-slate-50/60 hover:bg-white transition-all"
                    >
                      {APP_CONFIG.governorates.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Objet de votre demande
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-slate-50/60 hover:bg-white transition-all"
                  >
                    <option value="question_particulier">Je suis particulier (devis, date, monte-charge)</option>
                    <option value="partenariat_transporteur">Je suis transporteur / déménageur (agrément MoversGo)</option>
                    <option value="reclamation">Suivi d'un déménagement en cours ou réclamation</option>
                    <option value="autre">Autre question ou partenariat institutionnel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Votre message détaillé <span className="text-[#800020]">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Précisez votre demande : villes de départ et d'arrivée, étages avec ou sans ascenseur, type de meubles volumineux, date souhaitée..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-slate-50/60 hover:bg-white transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Vos données sont strictement protégées et ne sont jamais revendues à des tiers.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-[#800020] hover:bg-[#660019] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm border-2 border-white shadow-xl shadow-[#800020]/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmission en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Envoyer mon message au coordinateur</span>
                      <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* 3 Trust pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200/90 flex items-start gap-4 shadow-sm hover:border-[#800020] transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Réponse Express sous 2h</h4>
              <p className="text-xs text-slate-500 mt-1">Nos équipes traitent chaque demande rapidement pour que votre planning ne prenne aucun retard.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200/90 flex items-start gap-4 shadow-sm hover:border-[#800020] transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Transporteurs 100% Vérifiés</h4>
              <p className="text-xs text-slate-500 mt-1">Registre National des Entreprises (RNE) et agrément Ministère du Transport systématiquement validés.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-slate-200/90 flex items-start gap-4 shadow-sm hover:border-[#800020] transition-colors">
            <div className="w-12 h-12 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Couverture 24 Gouvernorats</h4>
              <p className="text-xs text-slate-500 mt-1">Du Grand Tunis jusqu'à Tataouine, Tozeur ou Bizerte, trouvez un déménageur local compétitif.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
