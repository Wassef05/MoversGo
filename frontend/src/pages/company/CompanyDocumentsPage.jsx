import React, { useState } from "react";
import { FileCheck, Upload, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function CompanyDocumentsPage() {
  const [documents, setDocuments] = useState([
    {
      id: "doc_1",
      name: "Extrait RNE (Registre National des Entreprises)",
      validity: "Valide - Matricule Fiscal 1584920/A/M/000",
      status: "verified",
      fileName: "extrait_rne_carthage_movers_2026.pdf"
    },
    {
      id: "doc_2",
      name: "Agrément Ministère du Transport (Tunisie)",
      validity: "Agrément Fret Routier n° MOT-TN-2022-8812 (Valide)",
      status: "verified",
      fileName: "agrement_ministere_transport_tunisie.pdf"
    },
    {
      id: "doc_3",
      name: "Attestation Assurance Marchandises STAR Assurances Pro",
      validity: "Garantie 200 000 DT / sinistre (À renouveler le 31/12/2026)",
      status: "verified",
      fileName: "police_assurance_marchandises_star.pdf"
    },
    {
      id: "doc_4",
      name: "Pièce d'identité du gérant légal (CIN)",
      validity: "Karim Bouazizi (CIN n° 08849120)",
      status: "verified",
      fileName: "cin_gerant_recto_verso.pdf"
    }
  ]);

  const handleSimulateUpload = (docId) => {
    toast.success("Document téléversé avec succès !", {
      description: "Le document a été transmis à l'équipe conformité pour vérification."
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dossier Légal & Conformité Transport</h1>
        <p className="text-xs text-slate-500">
          Maintenez vos justificatifs à jour pour conserver votre label "Déménageur Certifié MoversGo"
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">Votre compte entreprise est 100% conforme</p>
            <p className="text-emerald-700 mt-0.5">Tous vos documents obligatoires ont été validés par l'équipe juridique MoversGo.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Documents d'activité obligatoires</h2>

        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-sm">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                  <p className="text-xs text-slate-500">{doc.validity}</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{doc.fileName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validé</span>
                </span>
                <button
                  onClick={() => handleSimulateUpload(doc.id)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-xs font-semibold text-slate-700 transition-colors"
                >
                  Remplacer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

