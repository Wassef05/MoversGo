import React, { useState } from "react";
import { formatCurrency } from "../../utils/cn";
import { bookingService } from "../../services/api/bookingService";
import { toast } from "sonner";
import {
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  X,
  Sparkles,
  AlertCircle,
  Building2,
  Calendar,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Zap,
  FileText,
  Printer,
} from "lucide-react";

export function VirtualPaymentModal({ isOpen, onClose, booking, onSuccess }) {
  if (!isOpen || !booking) return null;

  const totalAmount = booking.totalAmount || booking.quote?.totalPrice || 0;
  const depositPercent = (() => {
    if (booking.quote?.depositPercent && Number(booking.quote.depositPercent) > 0) {
      return Number(booking.quote.depositPercent);
    }
    if (booking.quote?.depositPercentage && Number(booking.quote.depositPercentage) > 0) {
      return Number(booking.quote.depositPercentage);
    }
    if (booking.quote?.pricing?.depositPercentage && Number(booking.quote.pricing.depositPercentage) > 0) {
      return Number(booking.quote.pricing.depositPercentage);
    }
    const rawDep = booking.depositAmount || booking.quote?.depositAmount || 0;
    if (totalAmount > 0 && rawDep > 0) {
      const computed = Math.round((rawDep / totalAmount) * 100);
      if (computed > 0) return computed;
    }
    if (booking.depositPercent && Number(booking.depositPercent) > 0) {
      return Number(booking.depositPercent);
    }
    return 30;
  })();
  const depositAmount =
    booking.depositAmount ||
    booking.quote?.depositAmount ||
    Math.round(totalAmount * (depositPercent / 100));
  const companyName =
    booking.company?.companyName || booking.companyName || "Entreprise de déménagement";
  const clientName =
    booking.client?.firstName
      ? `${booking.client.firstName} ${booking.client.lastName || ""}`.trim()
      : "Client MoversGo";

  const [cardNumber, setCardNumber] = useState("5359 8812 3456 9010");
  const [cardHolder, setCardHolder] = useState(clientName.toUpperCase());
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("789");

  const [processingStep, setProcessingStep] = useState("idle"); // 'idle' | 'authorizing' | '3dsecure' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState("");
  const [receiptRef, setReceiptRef] = useState("");

  const handleAutofillDemoCard = () => {
    setCardNumber("5359 4120 7890 9010");
    setCardHolder(clientName.toUpperCase() || "MOHAMED BEN SALEM");
    setCardExpiry("08/29");
    setCardCvv("452");
    toast.info("Coordonnées de la carte de test chargée !", {
      description: "Carte bancaire virtuelle tunisienne CIB/Visa prête pour la simulation.",
    });
  };

  const formatCardInput = (val) => {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    const groups = raw.match(/.{1,4}/g);
    return groups ? groups.join(" ") : raw;
  };

  const handleCardNumberChange = (e) => {
    setCardNumber(formatCardInput(e.target.value));
  };

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + "/" + raw.slice(2, 4);
    }
    setCardExpiry(raw);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanCard = cardNumber.replace(/\s/g, "");
    if (cleanCard.length < 16) {
      setErrorMsg("Veuillez saisir un numéro de carte valide à 16 chiffres.");
      return;
    }
    if (cardExpiry.length < 5) {
      setErrorMsg("Veuillez saisir une date d'expiration valide (MM/AA).");
      return;
    }
    if (cardCvv.length < 3) {
      setErrorMsg("Veuillez saisir un code cryptogramme CVV valide (3 chiffres).");
      return;
    }

    // Step 1: Processing
    setProcessingStep("authorizing");

    // Simulate 3D Secure verification after 900ms
    setTimeout(async () => {
      setProcessingStep("3dsecure");

      try {
        const last4 = cleanCard.slice(-4);
        const res = await bookingService.payDeposit(booking._id || booking.id, {
          cardLast4: last4,
          cardHolder: cardHolder.trim(),
        });

        const txRef =
          res?.paymentReference ||
          `TX-MF-${Date.now().toString().slice(-6)}-${last4}`;
        setReceiptRef(txRef);

        setTimeout(() => {
          setProcessingStep("success");
          toast.success("Acompte consigné avec succès sur compte séquestre ! 🎉", {
            description: `Montant : ${formatCurrency(depositAmount)} • Réf : ${txRef}`,
          });
          // Do NOT call onSuccess here — wait for user to click a button
        }, 1100);
      } catch (err) {
        setProcessingStep("error");
        setErrorMsg(
          err.response?.data?.message ||
          err.message ||
          "Échec du traitement du paiement virtuel."
        );
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-brand">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Règlement de l'Acompte en Ligne
                </h3>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Simulateur Sécurisé
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Paiement consigné sur compte séquestre MoversGo Tunisie
              </p>
            </div>
          </div>

          {processingStep !== "authorizing" && processingStep !== "3dsecure" && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {processingStep === "success" ? (
            /* SUCCESS VIEW */
            <div className="py-6 text-center space-y-5">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-sm animate-in zoom-in-75">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xl font-extrabold text-slate-900">
                  Paiement de l'acompte consigné avec succès !
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Votre acompte de <strong>{formatCurrency(depositAmount)}</strong> a été
                  sécurisé sur le compte séquestre MoversGo. Un reçu officiel de paiement vous a été envoyé par email.
                </p>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs text-left max-w-md mx-auto mt-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>📄</span>
                    <span>Prochaine étape : Signature de la facture par l'entreprise</span>
                  </p>
                  <p className="text-[11px] text-blue-800 mt-1 leading-normal">
                    L'entreprise <strong>{companyName}</strong> a été immédiatement notifiée en temps réel. Dès qu'elle aura apposé sa signature numérique officielle sur la facture, vous recevrez une alerte pour la consulter et signer votre bon de décharge.
                  </p>
                </div>
              </div>

              {/* Receipt Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500">Référence transaction :</span>
                  <strong className="font-mono text-slate-900">{receiptRef}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Montant acompte débité :</span>
                  <strong className="text-emerald-700 text-sm font-bold">
                    {formatCurrency(depositAmount)}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Bénéficiaire :</span>
                  <span className="font-semibold text-slate-800">{companyName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Moyen de paiement :</span>
                  <span className="font-semibold text-slate-800">
                    Carte Virtuelle •••• {cardNumber.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Reçu envoyé par email :</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span>Envoyé avec succès ✅</span>
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSuccess) onSuccess({ openInvoice: true, autoPrint: false });
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Consulter le statut de la facture</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSuccess) onSuccess({});
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : processingStep === "authorizing" || processingStep === "3dsecure" ? (
            /* PROCESSING LOADING ANIMATION */
            <div className="py-12 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-brand-600 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-bold text-slate-900">
                  {processingStep === "authorizing"
                    ? "Connexion au réseau bancaire national (SMT)..."
                    : "Validation 3D-Secure & consignation séquestre..."}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Simulation en cours d'autorisation bancaire sécurisée pour un montant de{" "}
                  <strong>{formatCurrency(depositAmount)}</strong>.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protocole SSL 256-Bit • Carte Bancaire Tunisie</span>
              </div>
            </div>
          ) : (
            /* FORM & CARD SIMULATOR VIEW */
            <>
              {/* Payment Summary Box */}
              <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">
                    Acompte de confirmation à consigner ({depositPercent}%)
                  </span>
                  <p className="text-xs text-slate-700 mt-0.5">
                    Déménageur : <strong>{companyName}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-brand-600">
                    {formatCurrency(depositAmount)}
                  </span>
                  <span className="block text-[10px] text-brand-800 font-semibold">TTC</span>
                </div>
              </div>

              {/* INTERACTIVE 3D VIRTUAL CARD PREVIEW */}
              <div className="relative w-full h-48 sm:h-52 rounded-2xl p-5 sm:p-6 text-white shadow-xl overflow-hidden bg-gradient-to-tr from-slate-950 via-slate-900 to-brand-950 border border-slate-800 flex flex-col justify-between">
                {/* Background decorative circles */}
                <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-brand-600/20 blur-2xl pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 w-44 h-44 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

                {/* Card Top Row: Chip, Contactless, Logo */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    {/* Gold EMV Chip */}
                    <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 border border-amber-500/40 shadow-inner flex flex-col justify-between p-1">
                      <div className="w-full h-px bg-amber-700/30" />
                      <div className="w-full h-px bg-amber-700/30" />
                      <div className="w-full h-px bg-amber-700/30" />
                    </div>
                    {/* Contactless Icon */}
                    <div className="text-slate-400 text-xs font-mono">
                      <span>))))</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-widest text-slate-300">
                      CIB
                    </span>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold text-white">
                      TUNISIE
                    </span>
                  </div>
                </div>

                {/* Card Middle: Card Number */}
                <div className="relative z-10 py-1">
                  <p className="font-mono text-base sm:text-xl font-bold tracking-[0.18em] text-white drop-shadow-sm">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </p>
                </div>

                {/* Card Bottom: Holder Name, Expiry & Visa Logo */}
                <div className="flex items-end justify-between relative z-10 text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-medium">
                      Titulaire
                    </span>
                    <p className="font-semibold text-white tracking-wider truncate max-w-[200px]">
                      {cardHolder || "NOM PRENOM"}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-medium">
                      Expire fin
                    </span>
                    <p className="font-mono font-semibold text-white">
                      {cardExpiry || "MM/AA"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-rose-500/80 -mr-2" />
                    <div className="w-6 h-6 rounded-full bg-amber-400/80" />
                  </div>
                </div>
              </div>

              {/* Demo 1-Click Autofill Button */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Test en environnement simulé</span>
                <button
                  type="button"
                  onClick={handleAutofillDemoCard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>Remplir avec la carte de test</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Payment Form Fields */}
              <form onSubmit={handleProcessPayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Numéro de carte bancaire *
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="5359 0000 0000 0000"
                      maxLength={19}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom inscrit sur la carte *
                  </label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    placeholder="Ex: MOHAMED BEN SALEM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 uppercase text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date d'expiration (MM/AA) *
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="12/28"
                        maxLength={5}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Code CVV / CVC (3 chiffres) *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                        placeholder="789"
                        maxLength={3}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Security Guarantee Notice */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Garantie Séquestre MoversGo :</strong> Le montant de l'acompte
                    reste consigné en toute sécurité sur notre compte séquestre. Il ne sera
                    transféré au déménageur qu'une fois votre livraison terminée avec succès.
                  </p>
                </div>

                {/* Submit Payment CTA */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-brand flex items-center justify-center gap-2 transition-all mt-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Confirmer & Consigner {formatCurrency(depositAmount)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

