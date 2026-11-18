import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Navigation,
  Crosshair,
  Check,
  Sparkles,
  AlertCircle,
  FileText,
  RotateCcw,
} from "lucide-react";

// Standard Tunisian Governorates as configured in the platform
const TUNISIAN_GOVERNORATES = [
  "Tunis",
  "Ariana",
  "Ben Arous",
  "Manouba",
  "Nabeul (Hammamet)",
  "Sousse",
  "Monastir",
  "Sfax",
  "Bizerte",
  "Mahdia",
  "Gabès",
  "Médenine (Djerba)",
  "Kairouan",
  "Gafsa",
  "Béja",
  "Jendouba",
  "Kasserine",
  "Sidi Bouzid",
  "Siliana",
  "Kef",
  "Tozeur",
  "Kebili",
  "Tataouine",
  "Zaghouan",
];

// Reference centroid coordinates for Tunisian governorates
const GOVERNORATE_COORDS = {
  "Tunis": [36.8065, 10.1815],
  "Ariana": [36.8665, 10.1956],
  "Ben Arous": [36.7531, 10.2228],
  "Manouba": [36.8080, 10.0982],
  "Nabeul (Hammamet)": [36.4561, 10.7376],
  "Nabeul": [36.4561, 10.7376],
  "Zaghouan": [36.4029, 10.1429],
  "Bizerte": [37.2744, 9.8739],
  "Béja": [36.7256, 9.1844],
  "Jendouba": [36.5011, 8.7802],
  "Le Kef": [36.1822, 8.7049],
  "Kef": [36.1822, 8.7049],
  "Siliana": [36.0849, 9.3708],
  "Sousse": [35.8256, 10.6369],
  "Monastir": [35.7779, 10.8262],
  "Mahdia": [35.5047, 11.0622],
  "Sfax": [34.7406, 10.7603],
  "Kairouan": [35.6781, 10.0963],
  "Kasserine": [35.1676, 8.8365],
  "Sidi Bouzid": [35.0382, 9.4849],
  "Gabès": [33.8815, 10.1017],
  "Médenine (Djerba)": [33.3549, 10.4959],
  "Médenine": [33.3549, 10.4959],
  "Tataouine": [32.9297, 10.4518],
  "Gafsa": [34.4250, 8.7842],
  "Tozeur": [33.9197, 8.1335],
  "Kebili": [33.7044, 8.9715],
  "Kébili": [33.7044, 8.9715],
};

function normalizeString(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/gouvernorat|delegation|de|l'|d'|ville|commune|municipalite/gi, "")
    .trim();
}

function matchTunisianGovernorate(state, county, city) {
  const normState = normalizeString(state);
  const normCounty = normalizeString(county);
  const normCity = normalizeString(city);
  const combined = `${normState} ${normCounty} ${normCity}`;

  if (combined.includes("hammamet") || combined.includes("nabeul")) return "Nabeul (Hammamet)";
  if (combined.includes("djerba") || combined.includes("medenine")) return "Médenine (Djerba)";
  if (combined.includes("ben arous")) return "Ben Arous";
  if (combined.includes("sidi bouzid")) return "Sidi Bouzid";
  if (combined.includes("le kef") || combined.includes("kef")) return "Kef";
  if (combined.includes("kebili")) return "Kebili";
  if (combined.includes("beja")) return "Béja";
  if (combined.includes("gabes")) return "Gabès";

  for (const gov of TUNISIAN_GOVERNORATES) {
    const normGov = normalizeString(gov);
    if (combined.includes(normGov)) {
      return gov;
    }
  }
  return null;
}

// Find closest Tunisian governorate by geographic distance as ultimate reliable fallback
function findClosestGovernorate(lat, lng) {
  let closestGov = "Tunis";
  let minDistance = Infinity;
  for (const [gov, coords] of Object.entries(GOVERNORATE_COORDS)) {
    const dLat = coords[0] - lat;
    const dLng = coords[1] - lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < minDistance) {
      minDistance = dist;
      closestGov = gov;
    }
  }
  if (closestGov === "Nabeul") return "Nabeul (Hammamet)";
  if (closestGov === "Médenine") return "Médenine (Djerba)";
  if (closestGov === "Le Kef") return "Kef";
  if (closestGov === "Kébili") return "Kebili";
  return closestGov;
}

export function LocationMapPicker({
  latitude,
  longitude,
  governorate,
  cityName,
  onLocationChange,
  label = "Position exacte de départ",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const skipNextGovEffectRef = useRef(false);
  const lastGovRef = useRef(governorate);

  const [currentLat, setCurrentLat] = useState(
    latitude || (governorate ? GOVERNORATE_COORDS[governorate]?.[0] : 36.8065) || 36.8065
  );
  const [currentLng, setCurrentLng] = useState(
    longitude || (governorate ? GOVERNORATE_COORDS[governorate]?.[1] : 10.1815) || 10.1815
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [lastDetectedAddress, setLastDetectedAddress] = useState(null);
  const [geoError, setGeoError] = useState("");

  // Create custom burgundy pin icon for departure location
  const createDepartureIcon = () => {
    return L.divIcon({
      className: "custom-departure-picker-pin",
      html: `
        <div style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translate(-50%, -100%);
        ">
          <div style="
            background: #800020;
            color: white;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 9999px;
            border: 2px solid white;
            box-shadow: 0 4px 14px rgba(128, 0, 32, 0.45);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          ">
            <span>📍</span>
            <span>Départ exact</span>
          </div>
          <div style="
            width: 14px;
            height: 14px;
            background: #800020;
            border: 2px solid white;
            border-radius: 50%;
            margin-top: -3px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>
        </div>
      `,
      iconSize: [0, 0],
    });
  };

  // Reverse geocoding helper (Nominatim OpenStreetMap)
  const reverseGeocodeAndAutoFill = useCallback(
    async (lat, lng, shouldAutoFill = true) => {
      setIsGeocoding(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=fr`,
          {
            headers: {
              "User-Agent": "MoversGo-Tunisia-App/1.0",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;

            // 1. Detect Governorate with robust matching and geographic fallback
            const detectedGov =
              matchTunisianGovernorate(addr.state, addr.county, addr.city) ||
              findClosestGovernorate(lat, lng) ||
              governorate ||
              "Tunis";

            // 2. Detect City / Delegation
            let rawCity =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.municipality ||
              addr.suburb ||
              addr.county ||
              addr.state_district ||
              "";

            // Clean delegation prefix
            const cleanCity = rawCity
              .replace(/^Délégation\s+/i, "")
              .replace(/^Municipalité\s+de\s+/i, "")
              .replace(/^Commune\s+de\s+/i, "")
              .trim();

            // 3. Detect Street address
            const road =
              addr.road ||
              addr.pedestrian ||
              addr.neighbourhood ||
              addr.residential ||
              addr.commercial ||
              addr.suburb ||
              "";

            const streetParts = [];
            if (addr.house_number) streetParts.push(addr.house_number);
            if (road) streetParts.push(road);
            if (addr.suburb && addr.suburb !== road) streetParts.push(addr.suburb);

            const streetAddress = streetParts.length > 0 ? streetParts.join(", ") : (data.name || "");
            const postalCode = addr.postcode ? String(addr.postcode).trim() : "";

            const detectedInfo = {
              latitude: lat,
              longitude: lng,
              address: streetAddress || `Zone ${cleanCity || detectedGov}`,
              city: cleanCity || detectedGov,
              governorate: detectedGov,
              postalCode,
              displayName: data.display_name,
            };

            setLastDetectedAddress(detectedInfo);

            if (shouldAutoFill && onLocationChange) {
              skipNextGovEffectRef.current = true;
              onLocationChange({
                ...detectedInfo,
                isAutoDetected: true,
              });
            }
          } else {
            // Fallback if data.address is empty
            const fallbackGov = findClosestGovernorate(lat, lng);
            const fallbackInfo = {
              latitude: lat,
              longitude: lng,
              address: (data && data.display_name) ? data.display_name.split(',')[0] : `Position GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              city: fallbackGov,
              governorate: fallbackGov,
              postalCode: "",
            };
            setLastDetectedAddress(fallbackInfo);
            if (shouldAutoFill && onLocationChange) {
              skipNextGovEffectRef.current = true;
              onLocationChange({
                ...fallbackInfo,
                isAutoDetected: true,
              });
            }
          }
        } else {
          // If response not ok
          const fallbackGov = findClosestGovernorate(lat, lng);
          const fallbackInfo = {
            latitude: lat,
            longitude: lng,
            address: `Position GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            city: fallbackGov,
            governorate: fallbackGov,
            postalCode: "",
          };
          setLastDetectedAddress(fallbackInfo);
          if (shouldAutoFill && onLocationChange) {
            skipNextGovEffectRef.current = true;
            onLocationChange({
              ...fallbackInfo,
              isAutoDetected: true,
            });
          }
        }
      } catch (err) {
        console.warn("Reverse geocode warning:", err.message);
        const fallbackGov = findClosestGovernorate(lat, lng);
        const fallbackInfo = {
          latitude: lat,
          longitude: lng,
          address: `Position GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          city: fallbackGov,
          governorate: fallbackGov,
          postalCode: "",
        };
        setLastDetectedAddress(fallbackInfo);
        if (shouldAutoFill && onLocationChange) {
          skipNextGovEffectRef.current = true;
          onLocationChange({
            ...fallbackInfo,
            isAutoDetected: true,
          });
        }
      } finally {
        setIsGeocoding(false);
      }
    },
    [governorate, onLocationChange]
  );

  // Update marker position and notify parent
  const updatePosition = useCallback(
    (lat, lng, autoFill = true) => {
      const cleanLat = Math.round(lat * 1000000) / 1000000;
      const cleanLng = Math.round(lng * 1000000) / 1000000;

      setCurrentLat(cleanLat);
      setCurrentLng(cleanLng);
      setGeoError("");

      if (markerRef.current) {
        markerRef.current.setLatLng([cleanLat, cleanLng]);
      }

      if (onLocationChange) {
        onLocationChange({
          latitude: cleanLat,
          longitude: cleanLng,
          isAutoDetected: false,
        });
      }

      if (autoFill) {
        reverseGeocodeAndAutoFill(cleanLat, cleanLng, true);
      }
    },
    [onLocationChange, reverseGeocodeAndAutoFill]
  );

  // Initialize Map with OpenStreetMap Standard Tiles (No API key required)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = currentLat || 36.8065;
      const initialLng = currentLng || 10.1815;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Free OpenStreetMap Standard Tiles without API key
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add draggable departure marker
      const marker = L.marker([initialLat, initialLng], {
        icon: createDepartureIcon(),
        draggable: true,
      }).addTo(map);

      marker.on("dragend", (e) => {
        const newPos = e.target.getLatLng();
        updatePosition(newPos.lat, newPos.lng, true);
      });

      // Click on map to place pin and auto-fill address
      map.on("click", (e) => {
        updatePosition(e.latlng.lat, e.latlng.lng, true);
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
  }, []);

  // When governorate changes externally from dropdown, pan map smoothly
  useEffect(() => {
    if (!mapInstanceRef.current || !governorate) return;
    if (governorate === lastGovRef.current) return;
    lastGovRef.current = governorate;

    if (skipNextGovEffectRef.current) {
      skipNextGovEffectRef.current = false;
      return;
    }

    const coords = GOVERNORATE_COORDS[governorate];
    if (coords) {
      mapInstanceRef.current.setView(coords, 12, { animate: true });
      updatePosition(coords[0], coords[1], false);
    }
  }, [governorate]);

  // Handle HTML5 Geolocation (Button "Ma position actuelle")
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setIsLocating(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude: userLat, longitude: userLng } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([userLat, userLng], 16, { animate: true });
        }
        // Place pin and automatically auto-fill street, city, governorate
        updatePosition(userLat, userLng, true);
      },
      (err) => {
        setIsLocating(false);
        setGeoError(
          err.code === 1
            ? "Accès à votre position GPS refusé. Vous pouvez cliquer directement sur la carte pour choisir l'emplacement."
            : "Impossible de déterminer votre position. Veuillez cliquer sur la carte."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#800020]" />
          <span>{label} *</span>
          <span className="text-[11px] font-normal text-slate-500 hidden sm:inline">
            (Pointez votre logement pour renseigner automatiquement les champs)
          </span>
        </label>

        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-[#800020] hover:bg-[#660019] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60 hover:scale-[1.02]"
        >
          {isLocating ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-white" />
          )}
          <span>{isLocating ? "Détection GPS..." : "📍 Ma position actuelle (GPS)"}</span>
        </button>
      </div>

      {geoError && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Map Container */}
      <div className="relative w-full h-[320px] sm:h-[360px] rounded-2xl overflow-hidden border-2 border-slate-200 shadow-xs z-0">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating guidance helper */}
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-[11px] font-medium text-slate-700 flex items-center gap-1.5 pointer-events-none">
          <Crosshair className="w-3.5 h-3.5 text-[#800020]" />
          <span>Cliquez n'importe où sur la carte pour déplacer le point</span>
        </div>

        {/* Quick Region Pills */}
        <div className="absolute bottom-3 left-3 right-3 z-[1000] flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pointer-events-auto">
          {["Tunis", "Ariana", "Sousse", "Monastir", "Sfax", "Nabeul", "Bizerte"].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                const c = GOVERNORATE_COORDS[city];
                if (c && mapInstanceRef.current) {
                  mapInstanceRef.current.setView(c, 13, { animate: true });
                  updatePosition(c[0], c[1], true);
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm hover:bg-white text-slate-800 border border-slate-200 shadow-xs text-[11px] font-bold whitespace-nowrap transition-all hover:scale-105 cursor-pointer"
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time GPS & Auto-filled Address Confirmation */}
      <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#800020] text-white flex items-center justify-center flex-shrink-0">
            {isGeocoding ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 text-white" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-slate-900">Coordonnées GPS :</span>
              <span className="font-mono font-bold text-[#800020]">
                {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
              </span>
              {isGeocoding && (
                <span className="text-[10px] text-slate-400 italic">
                  (Détection de l'adresse en cours...)
                </span>
              )}
            </div>
            {lastDetectedAddress && (
              <p className="text-slate-600 font-medium text-[11px] mt-0.5 line-clamp-1">
                📍 {lastDetectedAddress.address} • {lastDetectedAddress.city} ({lastDetectedAddress.governorate})
              </p>
            )}
          </div>
        </div>

        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 whitespace-nowrap self-end sm:self-auto">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>Champs de départ remplis automatiquement</span>
        </div>
      </div>
    </div>
  );
}
