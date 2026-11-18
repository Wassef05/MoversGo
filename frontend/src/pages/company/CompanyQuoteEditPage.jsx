import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { dataService } from "../../services/mock/dataService";
import { ChevronLeft, Save } from "lucide-react";
import { toast } from "sonner";

export function CompanyQuoteEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const q = await dataService.getQuoteById(id);
      setQuote(q);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleSave = (e) => {
    e.preventDefault();
    toast.success("Devis mis à jour avec succès !");
    navigate(`/company/quotes/${id}`);
  };

  if (loading || !quote) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const quoteId = quote._id || quote.id;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <Link
          to={`/company/quotes/${quoteId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Annuler et retourner au devis</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Modifier le devis #{String(quoteId).slice(-6)}</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Durée estimée</label>
          <input
            type="text"
            value={quote.estimatedDuration || ""}
            onChange={(e) => setQuote({ ...quote, estimatedDuration: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Message client</label>
          <textarea
            rows={4}
            value={quote.companyNotes || ""}
            onChange={(e) => setQuote({ ...quote, companyNotes: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Link
            to={`/company/quotes/${quoteId}`}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </Link>
          <button
            type="submit"
            className="px-6 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-brand flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </form>
    </div>
  );
}

