import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { requestService } from "../../services/api/requestService";
import { quoteService } from "../../services/api/quoteService";
import { APP_CONFIG } from "../../config/appConfig";
import {
  ChevronLeft,
  Save,
  AlertCircle,
  Lock,
  Home,
  MapPin,
  Calendar,
  Truck,
  Package,
  Layers,
  Scale,
  CheckCircle2,
  Eye,
  Info
} from "lucide-react";

export function ClientRequestEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    departure: {
      street: "",
      city: "",
      governorate: "Tunis",
      postalCode: "",
      housingType: "Appartement S+2",
      floor: 0,
      hasElevator: false,
      surface: "",
    },
    arrival: {
      street: "",
      city: "",
      governorate: "Sousse",
      postalCode: "",
      housingType: "Appartement S+2",
      floor: 0,
      hasElevator: false,
    },
    preferredDate: "",
    flexibleDates: false,
    estimatedVolume: 20,
    estimatedBoxes: 20,
    fragileItems: false,
    fragileItemsDescription: "",
    heavyItems: false,
    additionalServices: {
      packing: false,
      furnitureDisassembly: false,
      truckLift: false,
      storage: false,
    },
    comments: "",
  });

  const housingOptions = [
    "Appartement S+1",
    "Appartement S+2",
    "Appartement S+3",
    "Appartement S+4+",
    "Villa / Maison",
    "Studio",
    "Bureau / Local commercial",
  ];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        let reqData = null;
        try {
          const res = await requestService.getRequestById(id);
          const raw = res?.request || res?.movingRequest || res?.data?.request || res?.data?.movingRequest || res?.data || res;
          reqData = raw?.request || raw;
        } catch (e) {
          console.error("Erreur getRequestById:", e);
        }

        let quoteList = [];
        try {
          const resQuotes = await quoteService.getClientQuotes({ movingRequestId: id, limit: 100 });
          quoteList = resQuotes?.data || (Array.isArray(resQuotes) ? resQuotes : []);
        } catch (e) {
          console.error("Erreur getClientQuotes:", e);
        }

        setRequest(reqData);
        setQuotes(quoteList || []);

        if (reqData) {
          const dep = reqData.departureAddress || reqData.departure || {};
          const arr = reqData.arrivalAddress || reqData.arrival || {};
          const srv = reqData.additionalServices || {};

          setFormData({
            title: reqData.title || "",
            departure: {
              street: dep.street || dep.address || "",
              city: dep.city || "",
              governorate: dep.governorate || "Tunis",
              postalCode: dep.postalCode || "",
              housingType: reqData.departureHousingType || dep.housingType || "Appartement S+2",
              floor: reqData.departureFloor ?? dep.floor ?? 0,
              hasElevator: !!(reqData.departureElevator ?? dep.hasElevator ?? dep.elevator),
              surface: reqData.departureSurface ?? dep.surface ?? "",
            },
            arrival: {
              street: arr.street || arr.address || "",
              city: arr.city || "",
              governorate: arr.governorate || "Sousse",
              postalCode: arr.postalCode || "",
              housingType: reqData.arrivalHousingType || arr.housingType || "Appartement S+2",
              floor: reqData.arrivalFloor ?? arr.floor ?? 0,
              hasElevator: !!(reqData.arrivalElevator ?? arr.hasElevator ?? arr.elevator),
            },
            preferredDate: reqData.preferredDate ? String(reqData.preferredDate).split("T")[0] : "",
            flexibleDates: !!reqData.flexibleDates,
            estimatedVolume: reqData.estimatedVolume || reqData.inventory?.estimatedVolume || 20,
            estimatedBoxes: reqData.estimatedBoxes || reqData.inventory?.boxesCount || 0,
            fragileItems: !!(reqData.fragileItems || reqData.inventory?.fragileItems),
            fragileItemsDescription: reqData.fragileItemsDescription || reqData.inventory?.fragileItems || "",
            heavyItems: !!reqData.heavyItems,
            additionalServices: {
              packing: !!srv.packing,
              furnitureDisassembly: !!(srv.furnitureDisassembly || srv.furnitureAssembly),
              truckLift: !!srv.truckLift,
              storage: !!srv.storage,
            },
            comments: reqData.comments || "",
          });
        }
      } catch (err) {
        console.error("Erreur chargement:", err);
        setError("Impossible de charger les informations de cette demande.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const quotesCount = quotes.length || (request?.quotesCount || 0);
  const isLocked = quotesCount > 0 || (request && request.status !== "pending");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) {
      setError("Cette publication est verrouillée et ne peut plus être modifiée car des devis ont déjà été émis.");
      return;
    }

    if (!formData.departure.city.trim() || !formData.arrival.city.trim()) {
      setError("Veuillez renseigner les villes de départ et d'arrivée.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        title: formData.title.trim() || undefined,
        departureAddress: {
          street: formData.departure.street.trim(),
          city: formData.departure.city.trim(),
          governorate: formData.departure.governorate,
          postalCode: formData.departure.postalCode.trim(),
        },
        departureHousingType: formData.departure.housingType,
        departureFloor: parseInt(formData.departure.floor, 10) || 0,
        departureElevator: !!formData.departure.hasElevator,
        departureSurface: formData.departure.surface ? parseFloat(formData.departure.surface) : undefined,

        arrivalAddress: {
          street: formData.arrival.street.trim(),
          city: formData.arrival.city.trim(),
          governorate: formData.arrival.governorate,
          postalCode: formData.arrival.postalCode.trim(),
        },
        arrivalHousingType: formData.arrival.housingType,
        arrivalFloor: parseInt(formData.arrival.floor, 10) || 0,
        arrivalElevator: !!formData.arrival.hasElevator,

        estimatedVolume: parseFloat(formData.estimatedVolume) || 0,
        estimatedBoxes: parseInt(formData.estimatedBoxes, 10) || 0,
        fragileItems: !!formData.fragileItems,
        fragileItemsDescription: formData.fragileItemsDescription.trim(),
        heavyItems: !!formData.heavyItems,
        preferredDate: formData.preferredDate ? new Date(formData.preferredDate) : undefined,
        flexibleDates: !!formData.flexibleDates,
        additionalServices: {
          packing: !!formData.additionalServices.packing,
          unpacking: !!formData.additionalServices.packing,
          furnitureAssembly: !!formData.additionalServices.furnitureDisassembly,
          furnitureDisassembly: !!formData.additionalServices.furnitureDisassembly,
          truckLift: !!formData.additionalServices.truckLift,
          storage: !!formData.additionalServices.storage,
        },
        comments: formData.comments.trim(),
      };

      await requestService.updateRequest(id, payload);
      navigate(`/client/requests/${id}`, { state: { updatedSuccess: true } });
    } catch (err) {
      console.error("Erreur updateRequest:", err);
      const msg = err.response?.data?.message || err.message || "Erreur lors de la mise à jour de la demande.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Demande introuvable</p>
        <Link to="/client/requests" className="text-xs font-bold text-brand-600 hover:underline">
          Retour à mes demandes
        </Link>
      </div>
    );
  }

  // LOCKED STATE: quotes exist or status is not pending
  if (isLocked) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-1">
          <Link
            to={`/client/requests/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour aux détails de la demande</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Modification impossible</h1>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-subtle space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-slate-900">
              Cette publication est verrouillée
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Votre demande a déjà reçu{" "}
              <strong className="text-brand-700">{quotesCount} devis</strong> de la part
              d'entreprises de déménagement partenaires.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pour assurer l'équité, la fiabilité des devis émis et la conformité contractuelle, les paramètres de volume, adresses, étages et dates ne peuvent plus être modifiés une fois que des devis ont été déposés.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-900 text-xs text-left flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Besoin de modifier des éléments essentiels ?</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Vous pouvez échanger directement par messagerie avec les déménageurs ayant soumis une offre pour ajuster les détails, ou créer une nouvelle demande si votre projet a totalement changé.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/client/compare?requestId=${id}`}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-brand flex items-center justify-center gap-2"
            >
              <Scale className="w-4 h-4" />
              <span>Consulter et comparer les {quotesCount} devis</span>
            </Link>
            <Link
              to={`/client/requests/${id}`}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Voir la demande</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // EDITABLE FORM STATE
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to={`/client/requests/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Annuler et retourner au détail</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Modifier ma publication
          </h1>
          <p className="text-xs text-slate-500">
            Aucun devis n'a encore été déposé pour ce projet. Vous pouvez ajuster librement tous les détails.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Layers className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Intitulé de la publication
            </h2>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Titre / Description brève
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Déménagement Tunis vers Sousse - Appartement S+2"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Departure & Arrival Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Departure Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 text-brand-700">
              <Home className="w-4 h-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Coordonnées de Départ
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Gouvernorat *
                </label>
                <select
                  required
                  value={formData.departure.governorate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departure: { ...formData.departure, governorate: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  {APP_CONFIG.governorates.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ville / Délégation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ennasr 2, La Marsa, Ariane Ville..."
                  value={formData.departure.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departure: { ...formData.departure, city: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rue & Numéro
                </label>
                <input
                  type="text"
                  placeholder="Ex: Avenue Hédi Nouira, Résidence Les Fleurs"
                  value={formData.departure.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departure: { ...formData.departure, street: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Code postal
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2037"
                    value={formData.departure.postalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departure: { ...formData.departure, postalCode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Surface (m²)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 95"
                    value={formData.departure.surface}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departure: { ...formData.departure, surface: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Type de logement
                </label>
                <select
                  value={formData.departure.housingType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departure: { ...formData.departure, housingType: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  {housingOptions.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Étage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.departure.floor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departure: {
                          ...formData.departure,
                          floor: parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.departure.hasElevator}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departure: {
                            ...formData.departure,
                            hasElevator: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="font-semibold text-slate-700">Avec ascenseur</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Arrival Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-subtle space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <MapPin className="w-4 h-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Coordonnées d'Arrivée
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Gouvernorat *
                </label>
                <select
                  required
                  value={formData.arrival.governorate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      arrival: { ...formData.arrival, governorate: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  {APP_CONFIG.governorates.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ville / Délégation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sahloul, Kantaoui, Sousse Ville..."
                  value={formData.arrival.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      arrival: { ...formData.arrival, city: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rue & Numéro
                </label>
                <input
                  type="text"
                  placeholder="Ex: Boulevard 14 Janvier, Sahloul 4"
                  value={formData.arrival.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      arrival: { ...formData.arrival, street: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Code postal
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 4054"
                    value={formData.arrival.postalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        arrival: { ...formData.arrival, postalCode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Type de logement
                  </label>
                  <select
                    value={formData.arrival.housingType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        arrival: { ...formData.arrival, housingType: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    {housingOptions.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Étage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.arrival.floor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        arrival: {
                          ...formData.arrival,
                          floor: parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.arrival.hasElevator}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          arrival: {
                            ...formData.arrival,
                            hasElevator: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="font-semibold text-slate-700">Avec ascenseur</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule & Volume Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-subtle space-y-5">
          <div className="flex items-center gap-2 text-slate-900">
            <Calendar className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Planning & Estimation du Volume
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Date souhaitée
              </label>
              <input
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.flexibleDates}
                  onChange={(e) => setFormData({ ...formData, flexibleDates: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-slate-600 font-medium">Dates flexibles (+/- 3 jours)</span>
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Volume estimé (m³)
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={formData.estimatedVolume}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedVolume: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Généralement 15-30 m³ pour un S+2
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cartons prévus (nombre)
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={formData.estimatedBoxes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimatedBoxes: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Cartons standard déménagement
              </span>
            </div>
          </div>

          {/* Fragile & Heavy Items */}
          <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-100">
                <input
                  type="checkbox"
                  checked={formData.fragileItems}
                  onChange={(e) => setFormData({ ...formData, fragileItems: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Objets fragiles</span>
                  <span className="text-[11px] text-slate-500">
                    Vaisselle précieuse, miroirs, lustres, tableaux...
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-100">
                <input
                  type="checkbox"
                  checked={formData.heavyItems}
                  onChange={(e) => setFormData({ ...formData, heavyItems: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 mt-0.5"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Objets lourds / piano</span>
                  <span className="text-[11px] text-slate-500">
                    Piano, coffre-fort, marbre, équipement de musculation...
                  </span>
                </div>
              </label>
            </div>

            {formData.fragileItems && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description des objets fragiles
                </label>
                <input
                  type="text"
                  placeholder="Ex: Lustres en cristal et vaisselle tunisienne délicate"
                  value={formData.fragileItemsDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, fragileItemsDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Additional Services */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Truck className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Prestations et Services Souhaités
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <label className="p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 bg-white cursor-pointer flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">Emballage</span>
                <input
                  type="checkbox"
                  checked={formData.additionalServices.packing}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additionalServices: {
                        ...formData.additionalServices,
                        packing: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
              </div>
              <span className="text-[11px] text-slate-500">Protection sous papier bulles et cartons</span>
            </label>

            <label className="p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 bg-white cursor-pointer flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">Démontage</span>
                <input
                  type="checkbox"
                  checked={formData.additionalServices.furnitureDisassembly}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additionalServices: {
                        ...formData.additionalServices,
                        furnitureDisassembly: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
              </div>
              <span className="text-[11px] text-slate-500">Démontage et remontage des meubles</span>
            </label>

            <label className="p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 bg-white cursor-pointer flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">Monte-charge</span>
                <input
                  type="checkbox"
                  checked={formData.additionalServices.truckLift}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additionalServices: {
                        ...formData.additionalServices,
                        truckLift: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
              </div>
              <span className="text-[11px] text-slate-500">Élévateur extérieur pour façades / balcons</span>
            </label>

            <label className="p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 bg-white cursor-pointer flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">Garde-meubles</span>
                <input
                  type="checkbox"
                  checked={formData.additionalServices.storage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      additionalServices: {
                        ...formData.additionalServices,
                        storage: e.target.checked,
                      },
                    })
                  }
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
              </div>
              <span className="text-[11px] text-slate-500">Stockage temporaire sécurisé</span>
            </label>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-subtle space-y-4">
          <label className="block text-xs font-semibold text-slate-700">
            Remarques et consignes particulières pour les déménageurs
          </label>
          <textarea
            rows={3}
            placeholder="Ex: Accès difficile pour gros camion, rue étroite, préférence pour passage le matin..."
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to={`/client/requests/${id}`}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-brand flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Enregistrement en cours..." : "Enregistrer les modifications"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
