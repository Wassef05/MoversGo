import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { requestService } from "../../services/api/requestService";
import { APP_CONFIG } from "../../config/appConfig";
import { formatCurrency } from "../../utils/cn";
import { LocationMapPicker } from "../../components/common/LocationMapPicker";
import {
  MapPin,
  Home,
  Package,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Truck,
  Plus,
  Minus,
  Trash2,
  Camera,
  UploadCloud,
  ImageIcon,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  FileText
} from "lucide-react";

export function ClientNewRequestPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qDept = searchParams.get("deptGov");
  const qArr = searchParams.get("arrGov");
  const qHousing = searchParams.get("housingType");

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Central Progressive Form State - Tunisia Context
  const [formData, setFormData] = useState({
    title: qDept && qArr ? `Déménagement ${qDept} ➔ ${qArr}` : "",
    departure: {
      address: "Avenue Hédi Nouira, Ennasr 2",
      city: qDept?.includes("Tunis") ? "Tunis" : qDept || "Tunis",
      governorate: qDept || "Ariana",
      postalCode: "2037",
      latitude: 36.8665,
      longitude: 10.1956,
      housingType: qHousing || "Appartement S+2",
      surface: 95,
      floor: 3,
      hasElevator: false,
      parkingAccess: "Résidence avec parking accessible",
    },
    inventory: {
      estimatedVolume: 24,
      boxesCount: 30,
      items: [
        { name: "Salon tunisien / canapé d'angle", category: "Salon", quantity: 1, volume: 3.0 },
        { name: "Table à manger + 6 chaises", category: "Salle à manger", quantity: 1, volume: 2.0 },
        { name: "Chambre à coucher adulte (Lit 180x200 + Armoire)", category: "Chambre", quantity: 1, volume: 3.5 },
        { name: "Chambre d'enfants / lits jumeaux", category: "Chambre", quantity: 1, volume: 2.0 },
        { name: "Réfrigérateur NoFrost combiné", category: "Cuisine", quantity: 1, volume: 1.2 },
        { name: "Machine à laver automatique", category: "Électroménager", quantity: 1, volume: 0.6 },
        { name: "Meuble TV + Écran 55-65 pouces", category: "Salon", quantity: 1, volume: 0.8 },
      ],
      fragileItems: "Services vaisselle tunisienne, lustres en cristal, miroirs dorés",
    },
    arrival: {
      address: "Boulevard 14 Janvier, Sahloul",
      city: qArr?.includes("Tunis") ? "Tunis" : qArr || "Sousse",
      governorate: qArr || "Sousse",
      postalCode: "4054",
      housingType: qHousing || "Appartement S+2",
      floor: 1,
      hasElevator: true,
      parkingAccess: "Accès direct par le boulevard",
    },
    options: {
      desiredDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      flexibility: "+/- 3 jours",
      packagingService: true,
      disassemblyService: true,
      furnitureLiftNeeded: true, // Monte-charge extérieur
      storageNeeded: false,
      comments: "Le monte-charge est impératif au départ à Ennasr (3ème étage sans ascenseur).",
    },
  });

  // State for Custom Furniture / Item adder
  const [customItem, setCustomItem] = useState({
    name: "",
    category: "Salon",
    volume: 1.0,
    quantity: 1,
  });

  // State for Move Photos
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  // Calculate dynamic volume in m³
  const calculatedVolume = (
    formData.inventory.items.reduce((acc, it) => acc + (it.volume || 1) * it.quantity, 0) +
    (formData.inventory.boxesCount * 0.1)
  ).toFixed(0);

  const steps = [
    { id: 1, title: "Départ", desc: "Origine en Tunisie" },
    { id: 2, title: "Inventaire", desc: "Mobilier & m³" },
    { id: 3, title: "Photos", desc: "Visuels du logement" },
    { id: 4, title: "Arrivée", desc: "Destination" },
    { id: 5, title: "Options", desc: "Dates & Monte-charge" },
    { id: 6, title: "Validation", desc: "Récapitulatif" },
  ];

  const handleItemQuantityChange = (index, delta) => {
    const updated = [...formData.inventory.items];
    const newQty = Math.max(0, updated[index].quantity + delta);
    updated[index].quantity = newQty;
    setFormData({
      ...formData,
      inventory: { ...formData.inventory, items: updated },
    });
  };

  const handleRemoveItem = (index) => {
    const updated = formData.inventory.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      inventory: { ...formData.inventory, items: updated },
    });
  };

  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!customItem.name.trim()) return;

    const newItem = {
      name: customItem.name.trim(),
      category: customItem.category || "Autre",
      volume: parseFloat(customItem.volume) || 1.0,
      quantity: Math.max(1, parseInt(customItem.quantity, 10) || 1),
    };

    setFormData({
      ...formData,
      inventory: {
        ...formData.inventory,
        items: [...formData.inventory.items, newItem],
      },
    });

    setCustomItem({
      name: "",
      category: "Salon",
      volume: 1.0,
      quantity: 1,
    });
  };

  // Photo handlers
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 10 - photoFiles.length;
    if (remaining <= 0) return;

    const selected = files.slice(0, remaining);
    const newPreviews = selected.map((file) => ({
      file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + " Mo",
      previewUrl: URL.createObjectURL(file),
    }));

    setPhotoFiles((prev) => [...prev, ...selected]);
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemovePhoto = (index) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      if (prev[index]?.previewUrl) {
        URL.revokeObjectURL(prev[index].previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleNext = () => {
    setError("");
    if (currentStep === 1) {
      if (!formData.departure.city || !formData.departure.address) {
        setError("Veuillez renseigner l'adresse et la ville de départ.");
        return;
      }
    } else if (currentStep === 4) {
      if (!formData.arrival.city || !formData.arrival.address) {
        setError("Veuillez renseigner l'adresse et la ville d'arrivée.");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(6, prev + 1));
  };

  const handlePrev = () => {
    setError("");
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const vol = parseInt(calculatedVolume, 10);
      const isInterCity = formData.departure.city !== formData.arrival.city;
      const budgetEstimate = `${Math.round(vol * (isInterCity ? 35 : 22) + (formData.options.furnitureLiftNeeded ? 150 : 0))} DT`;

      const payload = new FormData();
      payload.append(
        "departureAddress",
        JSON.stringify({
          street: formData.departure.address,
          city: formData.departure.city,
          governorate: formData.departure.governorate,
          postalCode: formData.departure.postalCode,
          latitude: formData.departure.latitude,
          longitude: formData.departure.longitude,
        })
      );
      payload.append("departureHousingType", formData.departure.housingType);
      payload.append("departureFloor", formData.departure.floor);
      payload.append("departureElevator", formData.departure.hasElevator);
      payload.append("departureSurface", formData.departure.surface);

      payload.append(
        "arrivalAddress",
        JSON.stringify({
          street: formData.arrival.address,
          city: formData.arrival.city,
          governorate: formData.arrival.governorate,
          postalCode: formData.arrival.postalCode,
        })
      );
      payload.append("arrivalHousingType", formData.arrival.housingType);
      payload.append("arrivalFloor", formData.arrival.floor);
      payload.append("arrivalElevator", formData.arrival.hasElevator);

      payload.append(
        "inventory",
        JSON.stringify({
          estimatedVolume: vol,
          boxesCount: formData.inventory.boxesCount,
          items: formData.inventory.items,
          fragileItems: formData.inventory.fragileItems,
        })
      );
      payload.append("furniture", JSON.stringify(formData.inventory.items));
      payload.append("estimatedVolume", vol);
      payload.append("estimatedBoxes", formData.inventory.boxesCount);
      payload.append("fragileItemsDescription", formData.inventory.fragileItems || "");

      payload.append("options", JSON.stringify(formData.options));
      payload.append("preferredDate", formData.options.desiredDate);
      payload.append("flexibleDates", formData.options.flexibility !== "Date fixe impérative");
      payload.append("comments", formData.options.comments || "");
      payload.append("estimatedBudget", budgetEstimate);

      payload.append(
        "additionalServices",
        JSON.stringify({
          packing: !!formData.options.packagingService,
          furnitureDisassembly: !!formData.options.disassemblyService,
          furnitureAssembly: !!formData.options.disassemblyService,
          truckLift: !!formData.options.furnitureLiftNeeded,
          storage: !!formData.options.storageNeeded,
        })
      );

      // Append all photos
      photoFiles.forEach((file) => {
        payload.append("photos", file);
      });

      const res = await requestService.createRequest(payload);
      const created = res?.data?.movingRequest || res?.data?.request || res?.data || res;
      const targetId = created?._id || created?.id;
      if (targetId) {
        navigate(`/client/requests/${targetId}`, { state: { publishedSuccess: true } });
      } else {
        navigate("/client/dashboard", { state: { publishedSuccess: true } });
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.response?.data?.message || err.message || "Erreur lors de la publication de la demande.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3.5 py-1 rounded-full border border-brand-200">
          Formulaire Guidé Tunisie
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Publier un projet de déménagement
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Obtenez des devis fermes en Dinars Tunisiens (DT) auprès des transporteurs certifiés de votre région
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-subtle">
        <div className="grid grid-cols-6 gap-2">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            return (
              <div key={step.id} className="flex flex-col items-center text-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${isCompleted
                      ? "bg-emerald-600 text-white shadow-sm"
                      : isCurrent
                        ? "bg-brand-600 text-white shadow-brand ring-4 ring-brand-100"
                        : "bg-slate-100 text-slate-400"
                    }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <p
                  className={`text-xs font-semibold mt-2 ${isCurrent ? "text-brand-600" : isCompleted ? "text-slate-800" : "text-slate-400"
                    }`}
                >
                  {step.title}
                </p>
                <p className="text-[10px] text-slate-400 hidden sm:block">{step.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-brand-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP CONTAINER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
        {/* ÉTAPE 1: DÉPART */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Étape 1 : Logement de départ en Tunisie</h2>
              <p className="text-xs text-slate-500">
                Localisez votre point de départ sur la carte pour renseigner automatiquement votre adresse et permettre aux déménageurs à proximité de vous proposer leurs meilleurs tarifs
              </p>
            </div>

            <div className="space-y-4">
              {/* MAP PICKER: Exact Departure Location in Tunisia */}
              <div className="pt-1 pb-2">
                <LocationMapPicker
                  latitude={formData.departure.latitude}
                  longitude={formData.departure.longitude}
                  governorate={formData.departure.governorate}
                  cityName={formData.departure.city}
                  onLocationChange={(locData) => {
                    const { latitude, longitude, address, city, governorate, postalCode, isAutoDetected } = locData;
                    setFormData((prev) => {
                      const updatedDeparture = {
                        ...prev.departure,
                        latitude,
                        longitude,
                      };
                      if (address) updatedDeparture.address = address;
                      if (city) updatedDeparture.city = city;
                      if (governorate) updatedDeparture.governorate = governorate;
                      if (postalCode) updatedDeparture.postalCode = postalCode;

                      return {
                        ...prev,
                        departure: updatedDeparture,
                      };
                    });

                    if (isAutoDetected) {
                      toast.success(
                        `Position et adresse détectées : ${address || city} (${governorate || "Tunisie"})`,
                        {
                          description: "Adresse, gouvernorat et ville renseignés automatiquement.",
                          duration: 4000,
                        }
                      );
                    }
                  }}
                  label="Emplacement exact du logement de départ sur la carte"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse complète de départ *
                </label>
                <input
                  type="text"
                  required
                  value={formData.departure.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departure: { ...formData.departure, address: e.target.value },
                    })
                  }
                  placeholder="Ex: Avenue Hédi Nouira, Ennasr 2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gouvernorat *</label>
                  <select
                    value={formData.departure.governorate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departure: { ...formData.departure, governorate: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    {APP_CONFIG.governorates.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ville / Délégation *</label>
                  <input
                    type="text"
                    required
                    value={formData.departure.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departure: { ...formData.departure, city: e.target.value },
                      })
                    }
                    placeholder="Ex: Tunis, Ariana, La Marsa..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Code postal</label>
                  <input
                    type="text"
                    value={formData.departure.postalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departure: { ...formData.departure, postalCode: e.target.value },
                      })
                    }
                    placeholder="2037"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type de bien</label>
                  <select
                    value={formData.departure.housingType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departure: { ...formData.departure, housingType: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="Studio / S+0">Studio / S+0</option>
                    <option value="Appartement S+1">Appartement S+1</option>
                    <option value="Appartement S+2">Appartement S+2</option>
                    <option value="Appartement S+3">Appartement S+3</option>
                    <option value="Appartement S+4">Appartement S+4</option>
                    <option value="Villa / Duplex">Villa / Duplex</option>
                    <option value="Bureaux / Local commercial">Bureaux d'entreprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Surface (en m²)</label>
                  <input
                    type="number"
                    value={formData.departure.surface}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departure: {
                          ...formData.departure,
                          surface: parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Étage</label>
                  <input
                    type="number"
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
                    placeholder="0 pour RDC"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="depElevator"
                  checked={formData.departure.hasElevator}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departure: { ...formData.departure, hasElevator: e.target.checked },
                    })
                  }
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <label htmlFor="depElevator" className="text-xs font-medium text-slate-700">
                  Ascenseur fonctionnel utilisable pour le mobilier
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 2: INVENTAIRE (MOBILIER + AJOUT MEUBLE PERSONNALISÉ) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Étape 2 : Mobilier & Volume estimé</h2>
                <p className="text-xs text-slate-500">Précisez les meubles pour calibrer le camion et le monte-charge</p>
              </div>

              <div className="bg-brand-50 border border-brand-200 text-brand-700 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto">
                <Truck className="w-4 h-4" />
                <span>Volume calculé : {calculatedVolume} m³</span>
              </div>
            </div>

            {/* List of items */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Mobilier sélectionné ({formData.inventory.items.length} éléments)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.inventory.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between group hover:border-slate-300 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {item.category} • ~{item.volume} m³ / unité
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleItemQuantityChange(idx, -1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleItemQuantityChange(idx, 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        title="Supprimer ce meuble"
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form to add custom item / meuble personnalisé */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-amber-700" />
                  <span>Ajouter un autre bien ou meuble personnalisé</span>
                </span>
                <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
                  Personnalisation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nom du meuble / bien spécifique *
                  </label>
                  <input
                    type="text"
                    value={customItem.name}
                    onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                    placeholder="Ex: Piano droit, Bibliothèque chêne, Tapis Persan..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={customItem.category}
                    onChange={(e) => setCustomItem({ ...customItem, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Salon">Salon</option>
                    <option value="Chambre">Chambre</option>
                    <option value="Salle à manger">Salle à manger</option>
                    <option value="Cuisine">Cuisine</option>
                    <option value="Bureau">Bureau</option>
                    <option value="Électroménager">Électroménager</option>
                    <option value="Jardin / Balcon">Jardin / Balcon</option>
                    <option value="Autre">Autre bien</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Volume approx. (m³)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={customItem.volume}
                    onChange={(e) =>
                      setCustomItem({
                        ...customItem,
                        volume: parseFloat(e.target.value) || 0.5,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-700">Quantité :</span>
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCustomItem({
                          ...customItem,
                          quantity: Math.max(1, customItem.quantity - 1),
                        })
                      }
                      className="text-slate-500 hover:text-slate-900 font-bold"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-slate-800">
                      {customItem.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomItem({ ...customItem, quantity: customItem.quantity + 1 })
                      }
                      className="text-slate-500 hover:text-slate-900 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomItem}
                  disabled={!customItem.name.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter ce meuble</span>
                </button>
              </div>
            </div>

            {/* Boxes and Fragile items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre estimé de cartons standard (55L)
                </label>
                <input
                  type="number"
                  value={formData.inventory.boxesCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inventory: {
                        ...formData.inventory,
                        boxesCount: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Objets fragiles ou de haute valeur
                </label>
                <input
                  type="text"
                  value={formData.inventory.fragileItems}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inventory: { ...formData.inventory, fragileItems: e.target.value },
                    })
                  }
                  placeholder="Ex: Lustre en cristal, salon brodé, écran plat..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 3: NOUVELLE ÉTAPE PHOTOS DU DÉMÉNAGEMENT */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span>Étape 3 : Photos & Visuels du déménagement</span>
                  <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                    Optionnel mais recommandé
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Ajoutez des photos de vos pièces (salon, chambres, cuisine) ou des meubles volumineux pour des devis plus précis
                </p>
              </div>

              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl flex items-center gap-1.5 self-start sm:self-auto">
                <Camera className="w-4 h-4 text-brand-600" />
                <span>{photoPreviews.length} / 10 photo(s)</span>
              </span>
            </div>

            {/* Upload Dropzone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-3xl p-6 sm:p-8 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                id="movingPhotos"
                multiple
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
                disabled={photoFiles.length >= 10}
              />
              <label
                htmlFor="movingPhotos"
                className="cursor-pointer flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center ring-8 ring-brand-50/50">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Cliquez ici pour sélectionner des photos ou glissez-déposez
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Formats acceptés : JPG, PNG, WEBP (Jusqu'à 10 photos, max 5 Mo chacune)
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-xs">
                  <Camera className="w-4 h-4 text-brand-600" />
                  <span>Choisir des photos</span>
                </span>
              </label>
            </div>

            {/* Previews Grid */}
            {photoPreviews.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Photos sélectionnées ({photoPreviews.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {photoPreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs aspect-square flex flex-col justify-end"
                    >
                      <img
                        src={preview.previewUrl}
                        alt={`Photo déménagement ${idx + 1}`}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-80" />

                      <div className="relative p-2.5 text-white flex items-center justify-between z-10">
                        <div className="min-w-0 pr-1">
                          <p className="text-[11px] font-bold truncate leading-tight">{preview.name}</p>
                          <p className="text-[9px] text-slate-300">{preview.size}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="w-7 h-7 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm transition-colors"
                          title="Supprimer la photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-950">Pourquoi ajouter des photos ?</p>
                <p className="text-blue-800 text-[11px] mt-0.5">
                  Les déménageurs professionnels utilisent vos photos pour évaluer les difficultés de passage dans la cage d'escalier, estimer précisément le besoin de monte-charge et vous faire une proposition tarifaire sans mauvaise surprise le jour J.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 4: ARRIVÉE */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Étape 4 : Logement d'arrivée en Tunisie</h2>
              <p className="text-xs text-slate-500">Lieu de déchargement et accès pour les déménageurs</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse complète d'arrivée *
                </label>
                <input
                  type="text"
                  required
                  value={formData.arrival.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      arrival: { ...formData.arrival, address: e.target.value },
                    })
                  }
                  placeholder="Ex: Boulevard 14 Janvier, Sahloul"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gouvernorat d'arrivée *</label>
                  <select
                    value={formData.arrival.governorate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        arrival: { ...formData.arrival, governorate: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    {APP_CONFIG.governorates.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ville d'arrivée *</label>
                  <input
                    type="text"
                    required
                    value={formData.arrival.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        arrival: { ...formData.arrival, city: e.target.value },
                      })
                    }
                    placeholder="Sousse, Hammamet, Sfax..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Code postal</label>
                  <input
                    type="text"
                    value={formData.arrival.postalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        arrival: { ...formData.arrival, postalCode: e.target.value },
                      })
                    }
                    placeholder="4054"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type de bien à l'arrivée</label>
                  <select
                    value={formData.arrival.housingType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        arrival: { ...formData.arrival, housingType: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="Appartement S+1">Appartement S+1</option>
                    <option value="Appartement S+2">Appartement S+2</option>
                    <option value="Appartement S+3">Appartement S+3</option>
                    <option value="Appartement S+4">Appartement S+4</option>
                    <option value="Villa / Duplex">Villa / Duplex</option>
                    <option value="Bureaux">Bureaux d'entreprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Étage d'arrivée</label>
                  <input
                    type="number"
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
                    placeholder="1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="arrElevator"
                  checked={formData.arrival.hasElevator}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      arrival: { ...formData.arrival, hasElevator: e.target.checked },
                    })
                  }
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <label htmlFor="arrElevator" className="text-xs font-medium text-slate-700">
                  Ascenseur disponible à l'arrivée
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 5: DATE & SERVICES SPÉCIFIQUES */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Étape 5 : Date & Services spécifiques</h2>
              <p className="text-xs text-slate-500">Planification et options de monte-charge</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date souhaitée *</label>
                <input
                  type="date"
                  value={formData.options.desiredDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      options: { ...formData.options, desiredDate: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Flexibilité</label>
                <select
                  value={formData.options.flexibility}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      options: { ...formData.options, flexibility: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="Date fixe impérative">Date fixe impérative</option>
                  <option value="+/- 2 jours">+/- 2 jours</option>
                  <option value="+/- 5 jours">+/- 5 jours (Plus économique)</option>
                  <option value="Dans le mois">Flexible dans le mois</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Prestations logistiques souhaitées
              </p>

              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.options.furnitureLiftNeeded}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        options: { ...formData.options, furnitureLiftNeeded: e.target.checked },
                      })
                    }
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Grue / Monte-charge extérieur sur voie (Recommandé pour étages 2 et +)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Évite tout dommage aux meubles et aux parties communes de l'immeuble.
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.options.packagingService}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        options: { ...formData.options, packagingService: e.target.checked },
                      })
                    }
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Emballage & Mise en carton par l'équipe</p>
                    <p className="text-[11px] text-slate-500">Protection soignée vaisselle, miroirs et bibelots</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.options.disassemblyService}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        options: { ...formData.options, disassemblyService: e.target.checked },
                      })
                    }
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Démontage et remontage des meubles</p>
                    <p className="text-[11px] text-slate-500">Pour armoires, lits, dressings et meubles complexes</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Consignes spécifiques</label>
              <textarea
                rows={3}
                value={formData.options.comments}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    options: { ...formData.options, comments: e.target.value },
                  })
                }
                placeholder="Ex: Rue étroite, présence de gardien, accès par la cour..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>
        )}

        {/* ÉTAPE 6: RÉCAPITULATIF & VALIDATION */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Étape 6 : Récapitulatif de votre projet</h2>
              <p className="text-xs text-slate-500">
                Vérifiez toutes vos informations avant diffusion auprès des transporteurs
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Départ</span>
                <p className="text-sm font-bold text-slate-900">{formData.departure.address}</p>
                <p className="text-xs text-slate-600">
                  {formData.departure.city} ({formData.departure.governorate})
                </p>
                <p className="text-xs text-slate-500">
                  {formData.departure.housingType} • Étage {formData.departure.floor} •{" "}
                  {formData.departure.hasElevator ? "Avec ascenseur" : "Sans ascenseur"}
                </p>
                {formData.departure.latitude && (
                  <p className="text-[10px] text-[#800020] font-mono font-bold bg-rose-50 px-2 py-0.5 rounded-md inline-block border border-rose-100">
                    📍 GPS : {formData.departure.latitude.toFixed(4)}, {formData.departure.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Arrivée</span>
                <p className="text-sm font-bold text-slate-900">{formData.arrival.address}</p>
                <p className="text-xs text-slate-600">
                  {formData.arrival.city} ({formData.arrival.governorate})
                </p>
                <p className="text-xs text-slate-500">
                  {formData.arrival.housingType} • Étage {formData.arrival.floor} •{" "}
                  {formData.arrival.hasElevator ? "Avec ascenseur" : "Sans ascenseur"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                  Volume & Mobilier
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold">
                  {calculatedVolume} m³ au total
                </span>
              </div>
              <p className="text-xs text-slate-700">
                Articles listés : {formData.inventory.items.length} types de biens • Cartons : ~{formData.inventory.boxesCount} • Monte-charge :{" "}
                {formData.options.furnitureLiftNeeded ? "Oui (Inclus)" : "Non"}
              </p>
              {photoPreviews.length > 0 && (
                <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{photoPreviews.length} photo(s) illustrative(s) jointe(s)</span>
                </p>
              )}
            </div>

            <div className="bg-brand-50 border border-brand-200 p-4 rounded-2xl flex items-center justify-between text-xs text-brand-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>
                  Diffusion gratuite et sécurisée auprès des déménageurs certifiés RNE sur toute la Tunisie.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Buttons Nav */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 flex items-center gap-2 shadow-brand shadow-sm"
            >
              <span>Suivant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-8 py-3 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 flex items-center gap-2 shadow-brand shadow-md disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Diffuser ma demande en Tunisie</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
