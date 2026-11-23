import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Printer,
  X,
  FileCheck2,
  Building2,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Truck,
  ArrowRight,
  AlertCircle,
  Phone,
  Mail,
  Lock,
  PenTool,
  RotateCcw,
  Check,
  Sparkles,
  Eye,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatDate, getLogoUrl } from "../../utils/cn";
import { bookingService } from "../../services/api/bookingService";
import { useAuth } from "../../contexts/AuthContext";
import { calculateCommission } from "../../utils/commission";
import { toast } from "sonner";

/**
 * InvoiceModal
 * Official final moving invoice & road transport delivery bill (Facture Finale de Déménagement & Bon de Livraison)
 * Includes reliable printing without blank pages, and company digital signature module.
 */
export default function InvoiceModal({
  isOpen,
  onClose,
  bookingId,
  initialInvoice = null,
  autoPrint = false,
}) {
  const { currentUser } = useAuth();
  const [invoice, setInvoice] = useState(initialInvoice);
  const [invoiceStatus, setInvoiceStatus] = useState(initialInvoice?.status || null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [loading, setLoading] = useState(!initialInvoice && !!bookingId);
  const [error, setError] = useState(null);

  // Digital signature pad state for Company
  const [isSigning, setIsSigning] = useState(false);
  const [signerName, setSignerName] = useState(
    currentUser?.firstName && currentUser?.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : "Représentant Entreprise"
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [submittingSign, setSubmittingSign] = useState(false);
  const canvasRef = useRef(null);

  // Digital signature pad state for Client (Décharge)
  const [isClientSigning, setIsClientSigning] = useState(false);
  const [clientSignerName, setClientSignerName] = useState(
    currentUser?.firstName && currentUser?.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : "Client"
  );
  const [isClientDrawing, setIsClientDrawing] = useState(false);
  const [hasClientDrawn, setHasClientDrawn] = useState(false);
  const [submittingClientSign, setSubmittingClientSign] = useState(false);
  const [dischargeConfirmed, setDischargeConfirmed] = useState(true);
  const clientCanvasRef = useRef(null);

  const userRole = currentUser?.role;
  const isAdmin = userRole === "admin";
  const isCompanyUser = userRole === "company";
  const isClientUser = userRole === "client";

  const fetchInvoiceData = useCallback(() => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    setStatusMessage(null);

    bookingService
      .getInvoice(bookingId)
      .then((data) => {
        // If data is or contains a real invoice document:
        const realInvoice =
          data?.invoice && typeof data.invoice === "object" && data.invoice._id
            ? data.invoice
            : data && typeof data === "object" && data._id && data.invoiceNumber
              ? data
              : null;

        if (realInvoice) {
          setInvoice(realInvoice);
          setInvoiceStatus(
            realInvoice.status ||
            (realInvoice.isSignedByCompany ? "available" : "awaiting_company_signature")
          );
        } else if (data?.status === "awaiting_company_signature" || data?.invoice === null) {
          setInvoice(null);
          setInvoiceStatus("awaiting_company_signature");
          setStatusMessage(
            data?.message || "La facture officielle sera consultable dès que l'entreprise l'aura signée."
          );
        } else if (data && typeof data === "object" && data.invoiceNumber) {
          setInvoice(data);
          setInvoiceStatus(
            data.status || (data.isSignedByCompany ? "available" : "awaiting_company_signature")
          );
        } else {
          setInvoice(null);
        }
      })
      .catch((err) => {
        console.error("Erreur chargement facture:", err);
        const msg =
          err.response?.data?.message ||
          "La facture finale sera débloquée et affichée dès que l'acompte aura été réglé par le client et validé.";
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [bookingId]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialInvoice) {
      setInvoice(initialInvoice);
      setInvoiceStatus(initialInvoice.status || (initialInvoice.isSignedByCompany ? "available" : "awaiting_company_signature"));
      setLoading(false);
      return;
    }

    fetchInvoiceData();
  }, [isOpen, initialInvoice, fetchInvoiceData]);

  // Update default client signer name if client snapshot is loaded
  useEffect(() => {
    if (invoice?.clientSnapshot?.fullName) {
      setClientSignerName(invoice.clientSnapshot.fullName);
    }
  }, [invoice]);

  // Auto-print support when triggered by a print button
  useEffect(() => {
    if (isOpen && autoPrint && invoice && !loading && !error) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, invoice, loading, error]);

  // Canvas setup when company signing opens
  useEffect(() => {
    if (isSigning && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [isSigning]);

  // Canvas setup when client signing opens
  useEffect(() => {
    if (isClientSigning && clientCanvasRef.current) {
      const canvas = clientCanvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#1e3a8a"; // Deep navy ink for client discharge
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [isClientSigning]);

  if (!isOpen) return null;

  // Reliable print: direct window.print() or styled dedicated print popup
  const handlePrint = () => {
    if (!invoice) return;
    const printArea = document.getElementById("official-invoice-print-area");
    if (!printArea) {
      window.print();
      return;
    }

    try {
      const printWindow = window.open("", "_blank", "width=920,height=1100");
      if (!printWindow) {
        window.print();
        return;
      }

      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((node) => node.outerHTML)
        .join("\n");

      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <title>Facture_${invoice.invoiceNumber || "MoversGo"}</title>
            ${styles}
            <style>
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              html, body {
                background: white !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 14px !important;
                font-family: Inter, system-ui, -apple-system, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * {
                visibility: visible !important;
              }
              .no-print {
                display: none !important;
              }
            </style>
          </head>
          <body>
            <div class="max-w-4xl mx-auto p-4 bg-white">
              ${printArea.innerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 400);
              };
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.warn("Print window error, fallback to direct print:", err);
      window.print();
    }
  };

  // ── Company Signature Drawing Handlers ──
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const generateCursiveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "italic 32px 'Brush Script MT', 'Great Vibes', cursive, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(signerName || "MoversGo Pro", 30, 75);

    ctx.beginPath();
    ctx.strokeStyle = "#047857";
    ctx.lineWidth = 2;
    ctx.moveTo(25, 90);
    ctx.lineTo(260, 85);
    ctx.stroke();

    setHasDrawn(true);
  };

  // ── Client Signature Drawing Handlers (Décharge) ──
  const startClientDrawing = (e) => {
    const canvas = clientCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsClientDrawing(true);
    setHasClientDrawn(true);
  };

  const drawClient = (e) => {
    if (!isClientDrawing) return;
    const canvas = clientCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopClientDrawing = () => {
    setIsClientDrawing(false);
  };

  const clearClientCanvas = () => {
    const canvas = clientCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasClientDrawn(false);
  };

  const generateClientCursiveSignature = () => {
    const canvas = clientCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "italic 32px 'Brush Script MT', 'Great Vibes', cursive, sans-serif";
    ctx.fillStyle = "#1e3a8a";
    ctx.fillText(clientSignerName || "Client MoversGo", 30, 75);

    ctx.beginPath();
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.moveTo(25, 90);
    ctx.lineTo(260, 85);
    ctx.stroke();

    setHasClientDrawn(true);
  };

  // Submit company digital signature to backend
  const handleSaveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      toast.warning("Veuillez tracer votre signature ou en générer une.");
      return;
    }

    const signatureImage = canvas.toDataURL("image/png");
    const targetBookingId = bookingId || invoice?.booking?._id || invoice?.booking;

    if (!targetBookingId) {
      toast.error("ID de réservation introuvable.");
      return;
    }

    setSubmittingSign(true);
    try {
      const updatedInvoice = await bookingService.signInvoice(targetBookingId, {
        signatureImage,
        signerName: signerName.trim(),
        stampText: "Certifié Conforme & Signé Numériquement",
      });

      setInvoice(updatedInvoice);
      setIsSigning(false);
      toast.success("Facture signée numériquement et transmise au client ! 🚀", {
        description: "Le client peut désormais consulter la facture officielle et signer la décharge.",
      });
    } catch (err) {
      console.error("Signature save error:", err);
      toast.error(err?.response?.data?.message || "Erreur lors de l'enregistrement de la signature.");
    } finally {
      setSubmittingSign(false);
    }
  };

  // Submit client digital signature (Décharge) to backend
  const handleSaveClientSignature = async () => {
    const canvas = clientCanvasRef.current;
    if (!canvas || !hasClientDrawn) {
      toast.warning("Veuillez tracer votre signature ou en générer une.");
      return;
    }

    if (!dischargeConfirmed) {
      toast.warning("Veuillez confirmer la réception sans réserve avant de valider.");
      return;
    }

    const signatureImage = canvas.toDataURL("image/png");
    const targetBookingId = bookingId || invoice?.booking?._id || invoice?.booking;

    if (!targetBookingId) {
      toast.error("ID de réservation introuvable.");
      return;
    }

    setSubmittingClientSign(true);
    try {
      const updatedInvoice = await bookingService.signClientInvoice(targetBookingId, {
        signatureImage,
        signerName: clientSignerName.trim(),
        dischargeText: "Bon pour décharge et réception sans réserve de la facture et des prestations de déménagement",
      });

      setInvoice(updatedInvoice);
      setIsClientSigning(false);
      toast.success("Décharge enregistrée avec succès ! 🎉", {
        description: "La facture finale est désormais validée par les deux parties avec pleine valeur légale.",
      });
    } catch (err) {
      console.error("Client signature error:", err);
      toast.error(err?.response?.data?.message || "Erreur lors de l'enregistrement de la décharge.");
    } finally {
      setSubmittingClientSign(false);
    }
  };

  const comp = invoice?.companySnapshot || {};
  const client = invoice?.clientSnapshot || {};
  const logoUrl = getLogoUrl(comp?.logo);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden;
          }
          #official-invoice-print-area, #official-invoice-print-area * {
            visibility: visible !important;
          }
          #official-invoice-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 10px 15px !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 999999 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto print:border-none print:shadow-none print:rounded-none">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Facture Finale de Déménagement
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${invoice?.isFullySigned
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : invoice?.companySignatureImage
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}>
                  {invoice?.isFullySigned
                    ? "Double Signature Numérique • 100% Conforme"
                    : invoice?.companySignatureImage
                      ? "Signée par Entreprise • En attente Décharge Client"
                      : "Acompte Validé • En attente Signature Transporteur"}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Document légal officiel valant bon de transport et de livraison routière
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {invoice && (
              <>
                {/* Company Sign Action Button - Only visible for company/admin */}
                {isCompanyUser && !isSigning && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsClientSigning(false);
                      setIsSigning(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                    title="Signer numériquement la facture"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{invoice.companySignatureImage ? "Modifier Signature Entreprise" : "✍️ Signer Facture"}</span>
                  </button>
                )}

                {/* Client Sign / Modify Action Button (Décharge) - Only visible for client when company has signed */}
                {isClientUser && invoice.isSignedByCompany && !isClientSigning && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSigning(false);
                      setIsClientSigning(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                    title="Signer ou modifier la décharge numérique"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{invoice.isSignedByClient ? "Modifier Décharge" : "✍️ Signer Décharge"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-150 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer / PDF</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Digital Signature Drawer / Pad for Company - STRICTLY for Company */}
        {isCompanyUser && isSigning && (
          <div className="no-print p-5 bg-gradient-to-r from-indigo-50 to-emerald-50 border-b border-indigo-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <PenTool className="w-4 h-4 text-indigo-600" />
                <span>Signature Numérique Officielle de l'Entreprise</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSigning(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Fermer
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom du signataire (Gérant / Responsable d'exploitation) :
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Ex: Mohamed Ben Ali"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />

                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-600">Tracez votre signature :</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Effacer
                      </button>
                      <button
                        type="button"
                        onClick={generateCursiveSignature}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Générer automatiquement
                      </button>
                    </div>
                  </div>

                  <canvas
                    ref={canvasRef}
                    width={340}
                    height={110}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-28 bg-white rounded-xl border-2 border-dashed border-indigo-300 cursor-crosshair touch-none shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-white/80 rounded-xl border border-indigo-100 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Valeur probante & Horodatage
                  </p>
                  <p>
                    En signant, vous attestez l'exactitude des prestations mentionnées et autorisez l'exécution du transport conformément aux conditions générales.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveSignature}
                    disabled={submittingSign || !hasDrawn}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{submittingSign ? "Enregistrement..." : "Valider et Apposer la Signature"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSigning(false)}
                    className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Digital Signature Drawer / Pad for Client (Bon de Décharge) - STRICTLY for Client */}
        {isClientUser && isClientSigning && (
          <div className="no-print p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <PenTool className="w-4 h-4 text-blue-600" />
                <span>Bon de Livraison & Décharge Numérique du Client</span>
              </div>
              <button
                type="button"
                onClick={() => setIsClientSigning(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Fermer
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom & Prénom du client réceptionnaire :
                </label>
                <input
                  type="text"
                  value={clientSignerName}
                  onChange={(e) => setClientSignerName(e.target.value)}
                  placeholder="Ex: Rihem Lazaar"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-600">Tracez votre signature client :</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={clearClientCanvas}
                        className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Effacer
                      </button>
                      <button
                        type="button"
                        onClick={generateClientCursiveSignature}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Générer signature cursive
                      </button>
                    </div>
                  </div>

                  <canvas
                    ref={clientCanvasRef}
                    width={340}
                    height={110}
                    onMouseDown={startClientDrawing}
                    onMouseMove={drawClient}
                    onMouseUp={stopClientDrawing}
                    onMouseLeave={stopClientDrawing}
                    onTouchStart={startClientDrawing}
                    onTouchMove={drawClient}
                    onTouchEnd={stopClientDrawing}
                    className="w-full h-28 bg-white rounded-xl border-2 border-dashed border-blue-300 cursor-crosshair touch-none shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-2.5 p-3 bg-white/90 rounded-xl border border-blue-200 cursor-pointer text-xs text-slate-700 hover:bg-white transition">
                  <input
                    type="checkbox"
                    checked={dischargeConfirmed}
                    onChange={(e) => setDischargeConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-blue-950">Attestation de décharge & réception</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Je confirme avoir pris livraison de mes biens déménagés en bon état, sans réserve, et validé le règlement des montants prévus.
                    </p>
                  </div>
                </label>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveClientSignature}
                    disabled={submittingClientSign || !hasClientDrawn || !dischargeConfirmed}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{submittingClientSign ? "Enregistrement..." : "Confirmer et Signer la Décharge"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsClientSigning(false)}
                    className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 sm:p-10 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-2">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-700">
                Génération de la facture finale avec cachet officiel...
              </p>
            </div>
          ) : (!isCompanyUser && (invoiceStatus === "awaiting_company_signature" || (!invoice && statusMessage))) ? (
            /* AWAITING COMPANY SIGNATURE VIEW FOR CLIENT */
            <div className="py-16 text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border-2 border-amber-200 flex items-center justify-center mx-auto shadow-sm">
                <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                  <span>⏳ Acompte consigné • En attente de signature entreprise</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Facture en attente de validation par le transporteur
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Votre acompte est bien consigné et sécurisé sur le compte séquestre MoversGo. L'entreprise de déménagement a été notifiée en temps réel et doit apposer sa signature numérique officielle pour certifier ce bon de transport.
                </p>
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 text-xs text-left space-y-1 mt-2">
                  <p className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Transparence contractuelle bilatérale :
                  </p>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Dès que le transporteur aura signé la facture, vous recevrez une alerte en direct pour la consulter et apposer votre signature de décharge en toute sécurité.
                  </p>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={fetchInvoiceData}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Vérifier si signée</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : error ? (
            <div className="py-16 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Facture non disponible
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Compris, fermer
              </button>
            </div>
          ) : invoice ? (
            <div id="official-invoice-print-area" className="space-y-6 text-slate-800 bg-white">
              {/* Top Workflow Status Banners */}
              {isAdmin && (
                <div className="no-print p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5 text-xs">
                    <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 font-bold">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="font-extrabold text-white">Supervision Haute Direction • Consultation Facture & Contrat Signé</span>
                      <span className="text-[11px] text-slate-300 block mt-0.5">
                        Mode lecture seule réservé à l'administrateur. Seules l'entreprise de déménagement et le client sont autorisés à apposer ou modifier leurs signatures numériques.
                      </span>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-200 text-[10px] font-extrabold border border-slate-700 uppercase tracking-wider">
                    Consultation Seule
                  </span>
                </div>
              )}

              {isCompanyUser && !invoice.isSignedByCompany && (
                <div className="no-print p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <PenTool className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Action Requise : Signez cette facture pour le client</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        L'acompte du client est consigné. Veuillez apposer votre signature numérique officielle ci-dessous pour certifier ce bon de transport et débloquer la consultation pour le client.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSigning(true)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>✍️ Signer maintenant</span>
                  </button>
                </div>
              )}

              {isClientUser && invoice.isSignedByCompany && !invoice.isSignedByClient && (
                <div className="no-print p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Facture certifiée par l'entreprise • Décharge prête à être signée</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        L'entreprise de déménagement a certifié et signé ce document. Veuillez apposer votre signature sur le bon de décharge ci-dessous pour valider la facture bilatérale.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsClientSigning(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>✍️ Signer ma décharge</span>
                  </button>
                </div>
              )}

              {(invoice.isFullySigned || (invoice.isSignedByCompany && invoice.isSignedByClient)) && (
                <div className="no-print p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 text-xs">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-emerald-950">Facture Finale 100% Signée par les Deux Parties</span>
                      <span className="text-[11px] text-emerald-700 block mt-0.5">
                        Double signature certifiée (Entreprise & Client) avec horodatage officiel et conformité légale complète.
                      </span>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 uppercase tracking-wider">
                    Échange Bilatéral Conforme
                  </span>
                </div>
              )}

              {/* Header: Company Letterhead + Invoice Number & Date */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-200">
                {/* Company branding */}
                <div className="flex items-start gap-4">
                  {logoUrl ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img
                        src={logoUrl}
                        alt={comp.companyName || "Logo Entreprise"}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 flex-shrink-0">
                      <Building2 className="w-8 h-8 text-slate-500" />
                      <span className="text-[10px] font-bold uppercase mt-1">Logo</span>
                    </div>
                  )}

                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {comp.companyName || "Société de Déménagement"}
                    </h1>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mt-0.5">
                      Transporteur Routier Professionnel Agréé MoversGo TN
                    </p>
                    <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                      {comp.legalIdentifier && (
                        <p>
                          <span className="font-semibold text-slate-700">Matricule Fiscal / RNE :</span>{" "}
                          <span className="font-mono font-bold text-slate-900">{comp.legalIdentifier}</span>
                        </p>
                      )}
                      {comp.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{comp.phone}</span>
                        </p>
                      )}
                      {comp.email && (
                        <p className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{comp.email}</span>
                        </p>
                      )}
                      {comp.address?.city && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {[comp.address.street, comp.address.city, comp.address.governorate]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Invoice Meta Box */}
                <div className="sm:text-right bg-slate-50 rounded-2xl p-4 border border-slate-200 min-w-[240px]">
                  <div className="inline-block px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
                    Facture Finale Officielle
                  </div>
                  <div className="text-lg font-black text-slate-900 font-mono tracking-tight">
                    {invoice.invoiceNumber}
                  </div>
                  <div className="text-xs text-slate-500 mt-2 space-y-1">
                    <p>
                      <span className="font-medium text-slate-700">Date d'émission :</span>{" "}
                      {formatDate(invoice.issuedDate || invoice.createdAt)}
                    </p>
                    <p>
                      <span className="font-medium text-slate-700">Date d'intervention :</span>{" "}
                      <strong>{formatDate(invoice.movingDate)} ({invoice.movingTime || "08:00"})</strong>
                    </p>
                    <p>
                      <span className="font-medium text-slate-700">Réf. Contrat :</span>{" "}
                      <span className="font-mono font-bold text-slate-800">
                        {String(invoice.booking).slice(-8).toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Client & Coordinates (Departure and Arrival) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Coordinates */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Destinataire / Client
                  </h3>
                  <p className="text-base font-extrabold text-slate-900">{client.fullName || "Client"}</p>
                  <div className="text-xs text-slate-600 mt-2 space-y-1.5">
                    {client.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold">{client.phone}</span>
                      </p>
                    )}
                    {client.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-brand-600" />
                        <span>{client.email}</span>
                      </p>
                    )}
                    {invoice.estimatedVolume ? (
                      <p className="font-medium text-slate-700 pt-1">
                        📦 Volume estimé : <strong className="text-slate-900">{invoice.estimatedVolume} m³</strong>
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Route & Manutention Coordinates */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    Trajet & Coordonnées d'Accès
                  </h3>

                  <div className="space-y-3.5 text-xs">
                    {/* Départ */}
                    <div className="flex items-start gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-extrabold text-[10px] shrink-0 mt-0.5">
                        DÉPART
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">
                          {client.departureAddress?.street ? `${client.departureAddress.street}, ` : ""}
                          {client.departureAddress?.city} ({client.departureAddress?.governorate})
                        </p>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          Étage : <strong>{client.departureAddress?.floor ?? 0}</strong> •{" "}
                          {client.departureAddress?.hasElevator ? "Avec ascenseur" : "Sans ascenseur"} •{" "}
                          {client.departureAddress?.housingType || "Logement"}
                        </p>
                      </div>
                    </div>

                    {/* Arrivée */}
                    <div className="flex items-start gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px] shrink-0 mt-0.5">
                        ARRIVÉE
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">
                          {client.arrivalAddress?.street ? `${client.arrivalAddress.street}, ` : ""}
                          {client.arrivalAddress?.city} ({client.arrivalAddress?.governorate})
                        </p>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          Étage : <strong>{client.arrivalAddress?.floor ?? 0}</strong> •{" "}
                          {client.arrivalAddress?.hasElevator ? "Avec ascenseur" : "Sans ascenseur"} •{" "}
                          {client.arrivalAddress?.housingType || "Logement"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Designation of all services & line items */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="bg-slate-100/90 px-5 py-3 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700 flex justify-between">
                  <span>Désignation Complète des Prestations et Services</span>
                  <span>Montant (TTC)</span>
                </div>
                <div className="divide-y divide-slate-100 bg-white">
                  {invoice.lineItems && invoice.lineItems.length > 0 ? (
                    invoice.lineItems.map((item, idx) => (
                      <div key={idx} className="px-5 py-3.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-800">{item.description}</span>
                        <span className="font-bold text-slate-900 font-mono">{formatCurrency(item.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-3.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-800">
                        Prestation complète de déménagement, manutention et transport routier
                      </span>
                      <span className="font-bold text-slate-900 font-mono">{formatCurrency(invoice.totalTTC)}</span>
                    </div>
                  )}
                </div>

                {/* Prestations non comprises */}
                {invoice.excludedServices && invoice.excludedServices.length > 0 && (
                  <div className="px-5 py-3 bg-amber-50/80 border-t border-amber-200/60 text-xs text-amber-900">
                    <span className="font-bold">⚠️ Prestations non comprises : </span>
                    {invoice.excludedServices.join(" • ")}
                  </div>
                )}
              </div>

              {/* Financial Recap & Highlighted Remaining Balance */}
              {(() => {
                const finCommission = calculateCommission({
                  totalPrice: invoice.totalTTC,
                  depositAmount: invoice.depositPaidTTC,
                });
                const commFee =
                  invoice.depositCommissionAmount != null && invoice.depositCommissionAmount > 0
                    ? invoice.depositCommissionAmount
                    : finCommission.platformFee;
                const netDeposit =
                  invoice.depositNetToCompany != null && invoice.depositNetToCompany > 0
                    ? invoice.depositNetToCompany
                    : finCommission.netToCompanyDeposit;
                const commPctTTC =
                  invoice.depositCommissionRate != null && invoice.depositCommissionRate > 0
                    ? Math.round(invoice.depositCommissionRate * 1000) / 10
                    : finCommission.commissionPercentOnTTC;
                const netPctTTC = Math.max(0, finCommission.depositPercent - commPctTTC);
                const totalNetCompany =
                  netDeposit + (invoice.remainingBalanceTTC || finCommission.remainingAmount);
                const showCommissionBreakdown = isCompanyUser || isAdmin;

                return (
                  <div
                    className={`flex flex-col sm:flex-row gap-6 pt-2 ${
                      showCommissionBreakdown ? "justify-between items-start" : "justify-end"
                    }`}
                  >
                    {/* BORDEREAU DE TRANSPARENCE POUR ENTREPRISE & ADMIN */}
                    {showCommissionBreakdown && (
                      <div className="w-full sm:flex-1 bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/90 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Transparence Financière MoversGo ({finCommission.depositPercent}% Acompte)
                          </span>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                            2% TTC / 10% acompte
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Acompte consigné sous séquestre :</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {formatCurrency(invoice.depositPaidTTC || finCommission.depositAmount)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-brand-700">
                            <span>• Commission plateforme MoversGo ({commPctTTC}% TTC) :</span>
                            <span className="font-bold font-mono">
                              -{formatCurrency(commFee)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-emerald-800 font-medium">
                            <span>• Net perçu sur acompte ({netPctTTC}% TTC) :</span>
                            <span className="font-bold font-mono text-emerald-800">
                              +{formatCurrency(netDeposit)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-slate-600">
                            <span>• Solde restant à la livraison (100% entreprise) :</span>
                            <span className="font-bold font-mono text-slate-900">
                              +{formatCurrency(invoice.remainingBalanceTTC || finCommission.remainingAmount)}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                            <span className="font-extrabold text-slate-900">Total Net Perçu par le Transporteur :</span>
                            <span className="text-sm font-black text-emerald-700 font-mono">
                              {formatCurrency(totalNetCompany)}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 italic pt-1">
                          * Note interne de transparence réservée au transporteur et à la haute direction MoversGo.
                        </p>
                      </div>
                    )}

                    {/* RECAPITULATIF TTC CLIENT & RESTE SUR PLACE */}
                    <div className="w-full sm:w-96 space-y-3 bg-slate-50 rounded-2xl p-5 border border-slate-200">
                      {/* Total TTC */}
                      <div className="flex justify-between items-center text-sm text-slate-700">
                        <span>Montant Total Prestation (TTC) :</span>
                        <span className="font-black text-slate-900 text-base font-mono">
                          {formatCurrency(invoice.totalTTC)}
                        </span>
                      </div>

                      {/* Acompte Versé */}
                      <div className="flex justify-between items-center text-sm text-emerald-800 font-medium">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Acompte TTC Payé / Consigné :
                        </span>
                        <span className="font-bold text-emerald-800 font-mono">
                          - {formatCurrency(invoice.depositPaidTTC || 0)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-300" />

                      {/* Reste TTC à payer sur place */}
                      <div className="p-4 bg-amber-100/90 rounded-2xl border-2 border-amber-400">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-xs font-black uppercase tracking-wider text-amber-950">
                              Reste TTC à Payer sur Place
                            </div>
                            <div className="text-[11px] text-amber-800 font-semibold mt-0.5">
                              À régler au chauffeur à la livraison
                            </div>
                          </div>
                          <div className="text-2xl font-black text-amber-950 font-mono tracking-tight">
                            {formatCurrency(invoice.remainingBalanceTTC)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Official Stamp & Signatures */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t-2 border-slate-200">
                {/* Cachet et signature entreprise */}
                <div className="border border-emerald-200 rounded-2xl p-4 bg-emerald-50/40 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Cachet Électronique & Signature Entreprise
                    </div>

                    <div className="border border-dashed border-emerald-300 rounded-xl p-3 bg-white/90 text-center my-2">
                      <p className="font-serif italic font-extrabold text-emerald-950 text-sm">
                        {comp.companyName || "Entreprise de Déménagement"}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                        {invoice.companyStampText || "Certifié Conforme pour Transport Routier MoversGo"}
                      </p>

                      {/* Render Drawn / Uploaded Digital Signature Image */}
                      {invoice.companySignatureImage ? (
                        <div className="my-2.5 py-1 px-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex flex-col items-center justify-center">
                          <img
                            src={invoice.companySignatureImage}
                            alt="Signature Officielle Entreprise"
                            className="max-h-16 max-w-[220px] object-contain"
                          />
                          {invoice.companySignerName && (
                            <p className="text-[11px] font-bold text-slate-800 mt-1">
                              Signé par : <span className="text-emerald-900">{invoice.companySignerName}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="my-2 py-1 px-3 bg-slate-50 rounded-lg text-[10px] text-slate-500 italic">
                          Signature électronique certifiée
                        </div>
                      )}

                      <p className="text-[10px] font-mono text-slate-500 mt-1">
                        Réf. Validation : {invoice.signatureHash || "SIG-APPROVED-TN"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Validé numériquement le {formatDate(invoice.signedAt || invoice.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Company Quick Sign trigger button - STRICTLY for Company */}
                  {isCompanyUser ? (
                    !isSigning && (
                      <button
                        type="button"
                        onClick={() => setIsSigning(true)}
                        className="no-print w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>{invoice.companySignatureImage ? "Modifier ma signature d'entreprise" : "✍️ Signer numériquement cette facture"}</span>
                      </button>
                    )
                  ) : (
                    /* In client's space: strictly certified notice - NO green button to edit */
                    <div className="mt-2 text-center py-2 px-3 bg-emerald-100/90 rounded-xl border border-emerald-300 text-emerald-900 text-[11px] font-bold flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Signature Transporteur Certifiée & Conforme</span>
                    </div>
                  )}
                </div>

                {/* Bon de livraison et décharge client */}
                {invoice.isSignedByClient ? (
                  <div className="border border-blue-200 rounded-2xl p-4 bg-blue-50/40 relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold text-xs uppercase tracking-wider">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        Bon de Livraison & Décharge Client (Signé)
                      </div>

                      <div className="border border-dashed border-blue-300 rounded-xl p-3 bg-white/90 text-center my-2">
                        <p className="font-serif italic font-extrabold text-blue-950 text-sm">
                          {invoice.clientSignerName || client.fullName || "Client MoversGo"}
                        </p>
                        <p className="text-[11px] text-blue-700 font-bold mt-0.5">
                          {invoice.clientDischargeText || "Bon pour décharge & réception conforme sans réserve"}
                        </p>

                        {/* Render Client Digital Signature Image */}
                        {invoice.clientSignatureImage ? (
                          <div className="my-2.5 py-1 px-3 bg-blue-50/50 rounded-xl border border-blue-200 flex flex-col items-center justify-center">
                            <img
                              src={invoice.clientSignatureImage}
                              alt="Signature Client Décharge"
                              className="max-h-16 max-w-[220px] object-contain"
                            />
                            <p className="text-[11px] font-bold text-slate-800 mt-1">
                              Émargé par : <span className="text-blue-900">{invoice.clientSignerName || client.fullName}</span>
                            </p>
                          </div>
                        ) : (
                          <div className="my-2 py-1 px-3 bg-slate-50 rounded-lg text-[10px] text-slate-500 italic">
                            Signature décharge enregistrée
                          </div>
                        )}

                        <p className="text-[10px] font-mono text-slate-500 mt-1">
                          Réf. Décharge : SIG-CLIENT-{invoice._id ? String(invoice._id).slice(-6).toUpperCase() : "OK"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Émargé numériquement le {formatDate(invoice.clientSignedAt || invoice.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] text-emerald-800 bg-emerald-100/90 font-bold p-2 rounded-xl text-center border border-emerald-300">
                        ✓ Décharge & Facture finale 100% validées bilatéralement
                      </div>

                      {/* Client can modify their signature in their space */}
                      {isClientUser && !isClientSigning && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSigning(false);
                            setIsClientSigning(true);
                          }}
                          className="no-print w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>Modifier ma décharge numérique</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                          <PenTool className="w-4 h-4 text-blue-600" />
                          Bon de Livraison & Décharge Client
                        </div>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                          En attente signature
                        </span>
                      </div>

                      <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-white text-center my-2 flex flex-col justify-between min-h-[110px]">
                        <p className="text-[11px] text-slate-600 font-medium">
                          Attestation de livraison et réception sans réserve des biens déménagés :
                        </p>
                        <p className="text-xs text-slate-400 italic py-1">
                          {client.fullName
                            ? `Destinataire : ${client.fullName}`
                            : "À émarger numériquement par le client"}
                        </p>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Date : {formatDate(new Date())} &bull; MoversGo Digital
                        </div>
                      </div>
                    </div>

                    {/* Client trigger button or company notice */}
                    {isClientUser ? (
                      invoice.isSignedByCompany ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSigning(false);
                            setIsClientSigning(true);
                          }}
                          className="no-print w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>✍️ Signer ma décharge numérique</span>
                        </button>
                      ) : (
                        <p className="text-[11px] text-amber-700 text-center font-semibold mt-2">
                          ⏳ En attente de la signature préalable du transporteur
                        </p>
                      )
                    ) : (
                      <p className="text-[10px] text-slate-400 text-center italic mt-2">
                        Le client apposera sa décharge numérique lors de la livraison définitive
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Legal Footer Note */}
              <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100">
                Document officiel MoversGo TN conforme aux règles régissant le transport routier de marchandises en Tunisie.
                Pour toute réclamation, contactez le support MoversGo sous 48h.
              </div>
            </div>
          ) : (
            <div className="py-16 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center mx-auto">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Facture en cours de chargement
              </h3>
              <p className="text-xs text-slate-600">
                {statusMessage || "Les informations de la facture officielle sont en cours de synchronisation. Veuillez patienter ou actualiser."}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={fetchInvoiceData}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Actualiser</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { InvoiceModal };
