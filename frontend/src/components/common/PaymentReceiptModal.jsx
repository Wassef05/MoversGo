import React, { useRef, useState } from "react";
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building2,
  Calendar,
  CreditCard,
  Banknote,
  MapPin,
  User,
  FileText,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate, getLogoUrl } from "../../utils/cn";
import { toast } from "sonner";

export default function PaymentReceiptModal({ isOpen, onClose, booking }) {
  const [downloadingImage, setDownloadingImage] = useState(false);
  const printableAreaRef = useRef(null);

  if (!isOpen || !booking) return null;

  const b = booking;
  const company = b.company || {};
  const client = b.client || {};
  const movingReq = b.movingRequest || {};
  const depCity =
    movingReq.departureAddress?.city ||
    movingReq.departureAddress?.governorate ||
    "Départ";
  const arrCity =
    movingReq.arrivalAddress?.city ||
    movingReq.arrivalAddress?.governorate ||
    "Arrivée";

  const totalAmount = b.totalAmount || b.quote?.totalPrice || 0;
  const depositAmount = b.depositAmount || 0;
  const remainingAmount =
    b.remainingAmount != null
      ? b.remainingAmount
      : Math.max(0, totalAmount - depositAmount);

  // Exact deposit percentage calculation
  const depositPercent =
    b.depositPercent ||
    b.quote?.depositPercent ||
    (totalAmount > 0
      ? Math.round((depositAmount / totalAmount) * 100)
      : 30);

  const receiptNumber = `REC-${String(b._id).slice(-8).toUpperCase()}`;
  const paymentDate = b.depositPaidAt || b.updatedAt || b.createdAt;
  const paymentMethodLabel =
    b.requestedPaymentMode === "espece"
      ? "Espèces à l'enlèvement (Garanti par Séquestre)"
      : "Carte Bancaire / Virement en Ligne (Séquestre Bloqué)";

  // ── High-Resolution Canvas PNG Generator ─────────────────────────────────
  const handleDownloadImage = () => {
    setDownloadingImage(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        toast.error("Impossible d'initialiser le moteur d'image.");
        setDownloadingImage(false);
        return;
      }

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top Header Gradient Banner
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 180);
      grad.addColorStop(0, "#800020"); // MoversGo Bordeaux
      grad.addColorStop(1, "#4a0013");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, 180);

      // Gold Accent Line
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(0, 175, canvas.width, 5);

      // Header Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("MoversGo • Séquestre Garanti", 50, 65);

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("RÉCÉPISSÉ OFFICIEL DE SÉQUESTRE & PAIEMENT D'ACOMPTE", 50, 105);

      ctx.font = "14px sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillText("Document de transparence financière garantissant les droits du client", 50, 135);

      // Badge Séquestre in Header
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.roundRect(canvas.width - 240, 45, 190, 40, 20);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("✓ SÉQUESTRE ACTIF", canvas.width - 215, 70);

      // Receipt Meta Box
      ctx.fillStyle = "#f8fafc";
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(50, 210, canvas.width - 100, 95, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.fillText("NUMÉRO DE RÉCÉPISSÉ", 70, 245);
      ctx.fillText("DATE DU VERSEMENT", 380, 245);
      ctx.fillText("RÉFÉRENCE RÉSERVATION", 690, 245);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 16px monospace";
      ctx.fillText(receiptNumber, 70, 275);
      ctx.font = "bold 15px sans-serif";
      ctx.fillText(formatDate(paymentDate), 380, 275);
      ctx.font = "bold 15px monospace";
      ctx.fillText(`#${String(b._id).slice(-8).toUpperCase()}`, 690, 275);

      // Parties Section
      // Client Box
      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.roundRect(50, 330, 430, 130, 12);
      ctx.fill();

      ctx.fillStyle = "#800020";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("DONNEUR D'ORDRE (CLIENT)", 70, 360);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 16px sans-serif";
      const cName = `${client.firstName || ""} ${client.lastName || ""}`.trim() || "Client MoversGo";
      ctx.fillText(cName, 70, 390);

      ctx.fillStyle = "#475569";
      ctx.font = "13px sans-serif";
      ctx.fillText(`Email : ${client.email || "Non renseigné"}`, 70, 415);
      ctx.fillText(`Tél : ${client.phone || "Non renseigné"}`, 70, 435);

      // Company Box
      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.roundRect(520, 330, 430, 130, 12);
      ctx.fill();

      ctx.fillStyle = "#800020";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("PRESTATAIRE AGRÉÉ (DÉMÉNAGEUR)", 540, 360);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(company.companyName || "Déménageur Partenaire", 540, 390);

      ctx.fillStyle = "#475569";
      ctx.font = "13px sans-serif";
      ctx.fillText(`Trajet : ${depCity} ➔ ${arrCity}`, 540, 415);
      ctx.fillText(`Date prévue : ${formatDate(b.scheduledDate)}`, 540, 435);

      // Financial Details Table Header
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(50, 490, canvas.width - 100, 45, [10, 10, 0, 0]);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("DESCRIPTION DU RÈGLEMENT", 70, 518);
      ctx.fillText("POURCENTAGE", 540, 518);
      ctx.fillText("MONTANT TTC", 780, 518);

      // Financial Rows
      // Row 1: Total
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(50, 535, canvas.width - 100, 55);
      ctx.strokeStyle = "#e2e8f0";
      ctx.strokeRect(50, 535, canvas.width - 100, 55);

      ctx.fillStyle = "#334155";
      ctx.font = "14px sans-serif";
      ctx.fillText("Montant Total convenu du déménagement", 70, 568);
      ctx.fillText("100%", 540, 568);
      ctx.font = "bold 15px sans-serif";
      ctx.fillStyle = "#0f172a";
      ctx.fillText(`${formatCurrency(totalAmount)} TND`, 780, 568);

      // Row 2: Deposit (Highlighted)
      ctx.fillStyle = "#f0fdf4"; // soft green
      ctx.fillRect(50, 590, canvas.width - 100, 75);
      ctx.strokeStyle = "#86efac";
      ctx.strokeRect(50, 590, canvas.width - 100, 75);

      ctx.fillStyle = "#166534";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("Acompte Consigné en Compte Séquestre (Payé)", 70, 625);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#15803d";
      ctx.fillText(`Règlement sécurisé - ${paymentMethodLabel}`, 70, 648);

      ctx.fillStyle = "#800020";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`${depositPercent}%`, 540, 635);

      ctx.fillStyle = "#15803d";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(`${formatCurrency(depositAmount)} TND`, 780, 635);

      // Row 3: Remaining Balance
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(50, 665, canvas.width - 100, 55);
      ctx.strokeStyle = "#e2e8f0";
      ctx.strokeRect(50, 665, canvas.width - 100, 55);

      ctx.fillStyle = "#475569";
      ctx.font = "14px sans-serif";
      ctx.fillText("Solde restant à régler sur place après prestation", 70, 698);
      ctx.fillText(`${100 - depositPercent}%`, 540, 698);
      ctx.font = "bold 15px sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText(`${formatCurrency(remainingAmount)} TND`, 780, 698);

      // Security & Escrow Guarantee Box
      ctx.fillStyle = "#fdf2f4";
      ctx.strokeStyle = "#fbcfe8";
      ctx.beginPath();
      ctx.roundRect(50, 750, canvas.width - 100, 140, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#800020";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("🛡️ CLAUSE OFFICIELLE DE SÉQUESTRE & PROTECTION DES DROITS", 75, 785);

      ctx.fillStyle = "#475569";
      ctx.font = "12px sans-serif";
      const clauseText1 = "MoversGo certifie que la somme d'acompte ci-dessus est séquestrée sur un compte bancaire bloqué et dédié.";
      const clauseText2 = "Ces fonds demeurent la propriété du client et ne sont débloqués et transférés au déménageur qu'après";
      const clauseText3 = "constat d'intervention conforme et livraison finale réussie à destination.";
      ctx.fillText(clauseText1, 75, 815);
      ctx.fillText(clauseText2, 75, 835);
      ctx.fillText(clauseText3, 75, 855);

      // Official Stamp & Digital Seal
      ctx.strokeStyle = "#16a34a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(canvas.width - 340, 930, 270, 120, 16);
      ctx.stroke();

      ctx.fillStyle = "#16a34a";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("SÉQUESTRE SÉCURISÉ", canvas.width - 280, 960);
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("MoversGo Escrow Guarantee", canvas.width - 290, 980);
      ctx.font = "bold 10px monospace";
      ctx.fillText(`ID-SÉQ: ${String(b._id).toUpperCase()}`, canvas.width - 325, 1010);
      ctx.fillText(`DATE: ${new Date(paymentDate).toISOString().slice(0, 10)}`, canvas.width - 325, 1030);

      // Signature text on left
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("Attestation émise électroniquement par MoversGo Tunisie", 70, 970);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("Service Vérification Financière & Séquestre Clientèle", 70, 995);
      ctx.fillText("Conforme aux conditions générales d'utilisation MoversGo", 70, 1015);

      // Footer
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px sans-serif";
      ctx.fillText("MoversGo SAS • Plateforme Nationale Certifiée de Déménagement • Tous droits réservés.", 50, 1300);

      // Export to Image & Download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Recu-Sequestre-MoversGo-${receiptNumber}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Fiche de reçu téléchargée en image PNG avec succès !");
    } catch (err) {
      console.error("Erreur génération image reçu:", err);
      toast.error("Erreur lors de la génération de l'image.");
    } finally {
      setDownloadingImage(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">
              Fiche de Reçu & Séquestre Officielle MoversGo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={downloadingImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-brand-600" />
              <span>{downloadingImage ? "Génération..." : "Enregistrer Image (PNG)"}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition shadow-xs cursor-pointer border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Imprimer</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div ref={printableAreaRef} className="p-6 sm:p-8 space-y-6 text-slate-900">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-brand-700 via-brand-800 to-brand-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Garantie Séquestre MoversGo
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-1">
                  Récépissé de Paiement d'Acompte
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  Preuve officielle de versement protégée sous compte séquestre
                </p>
              </div>

              <div className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>FONDS SÉQUESTRÉS & VALIDÉS</span>
              </div>
            </div>
          </div>

          {/* Reference Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                N° de Récépissé
              </span>
              <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                {receiptNumber}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                Date du versement
              </span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {formatDate(paymentDate)}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                Réf. Réservation
              </span>
              <p className="font-mono font-bold text-brand-700 text-sm mt-0.5">
                #{String(b._id).slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Parties involved */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Client */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
              <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider block mb-2">
                Donneur d'ordre (Client)
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {client.firstName ? `${client.firstName} ${client.lastName || ""}` : "Client Particulier"}
              </p>
              <p className="text-slate-500 mt-1">Email : {client.email || "—"}</p>
              <p className="text-slate-500">Tél : {client.phone || "—"}</p>
            </div>

            {/* Company */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
              <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider block mb-2">
                Prestataire Agréé (Déménageur)
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {company.companyName || "Entreprise de Déménagement"}
              </p>
              <p className="text-slate-500 mt-1">
                Trajet : {depCity} ➔ {arrCity}
              </p>
              <p className="text-slate-500">
                Date prévue : {formatDate(b.scheduledDate)}
              </p>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
            <div className="p-3.5 bg-slate-100/70 font-bold text-slate-700 flex justify-between">
              <span>Désignation de la transaction</span>
              <div className="flex gap-12 sm:gap-24">
                <span>Taux</span>
                <span>Montant TTC</span>
              </div>
            </div>

            {/* Total */}
            <div className="p-3.5 flex justify-between items-center text-slate-700">
              <span>Montant Total convenu pour le déménagement</span>
              <div className="flex gap-12 sm:gap-24 items-center">
                <span className="text-slate-500">100%</span>
                <span className="font-semibold">{formatCurrency(totalAmount)} TND</span>
              </div>
            </div>

            {/* Deposit */}
            <div className="p-4 bg-emerald-50/70 flex justify-between items-center text-emerald-900 font-bold border-l-4 border-l-emerald-600">
              <div>
                <span className="text-sm">Acompte Réglé & Consigné sous Séquestre</span>
                <p className="text-[11px] text-emerald-700 font-normal mt-0.5">
                  Règlement vérifié par la plateforme ({paymentMethodLabel})
                </p>
              </div>
              <div className="flex gap-12 sm:gap-24 items-center">
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-xs">
                  {depositPercent}%
                </span>
                <span className="text-lg text-emerald-700 font-extrabold">
                  {formatCurrency(depositAmount)} TND
                </span>
              </div>
            </div>

            {/* Remaining */}
            <div className="p-3.5 flex justify-between items-center text-slate-600">
              <span>Solde restant à régler au déchargement</span>
              <div className="flex gap-12 sm:gap-24 items-center">
                <span className="text-slate-400">{100 - depositPercent}%</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(remainingAmount)} TND
                </span>
              </div>
            </div>
          </div>

          {/* Escrow Guarantee Clause */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-amber-950 font-bold">
                Protection et Garantie des Droits du Client :
              </strong>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Conformément aux conditions MoversGo, cet acompte de{" "}
                <strong>{depositPercent}%</strong> ({formatCurrency(depositAmount)} TND)
                est conservé sur le compte séquestre technique de la plateforme. Il ne sera
                débloqué au profit du transporteur qu'une fois le déménagement exécuté et
                validé par vos soins.
              </p>
            </div>
          </div>

          {/* Seal / Stamp Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="text-[11px] text-slate-400">
              <p>Émis électroniquement par <strong>MoversGo</strong></p>
              <p>Plateforme Certifiée de Déménagement en Tunisie</p>
            </div>

            <div className="p-3 border-2 border-emerald-600/70 rounded-xl text-center rotate-[-2deg] bg-emerald-50/50">
              <span className="text-[11px] font-black tracking-widest text-emerald-700 uppercase block">
                ★ SÉQUESTRE VALIDÉ ★
              </span>
              <span className="text-[9px] text-emerald-800 font-mono block">
                MOVERSGO ESCROW VERIFIED
              </span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-xs transition"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={downloadingImage}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-brand transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Enregistrer comme Image (.png)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
