import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";

export function RecommendationMap({ mapData, selectedRequestId, onSelectRequest }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map instance centered on Tunisia
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [35.8256, 10.6369], // Default Sousse / Central Tunisia
        zoom: 8,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Official OpenStreetMap clean tiles (no API key required)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    const bounds = [];

    // 1. Company Headquarters Marker
    if (mapData?.company?.coordinates?.lat && mapData?.company?.coordinates?.lng) {
      const { lat, lng } = mapData.company.coordinates;
      bounds.push([lat, lng]);

      const companyIcon = L.divIcon({
        className: "custom-company-pin",
        html: `
          <div style="
            background: #800020;
            color: white;
            border: 2px solid white;
            border-radius: 9999px;
            padding: 4px 8px;
            box-shadow: 0 4px 12px rgba(128, 0, 32, 0.4);
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
          ">
            <span>🏢</span>
            <span>${mapData.company.name || "Votre entreprise"}</span>
          </div>
        `,
        iconSize: [140, 30],
        iconAnchor: [70, 15],
      });

      L.marker([lat, lng], { icon: companyIcon, zIndexOffset: 1000 })
        .addTo(layer)
        .bindPopup(
          `
          <div style="font-family: sans-serif; font-size: 12px; padding: 2px;">
            <strong style="color: #800020; font-size: 13px;">🏢 Siège de votre entreprise</strong><br/>
            <span>${mapData.company.name}</span><br/>
            <span style="color: #64748b;">${mapData.company.city || ""}, ${mapData.company.governorate || ""}</span>
          </div>
        `
        );
    }

    // 2. Opportunities Departure & Arrival Markers
    const markers = mapData?.markers || [];
    markers.forEach((m) => {
      if (!m.departure?.lat || !m.departure?.lng) return;

      const depCoord = [m.departure.lat, m.departure.lng];
      bounds.push(depCoord);

      // Color coding according to score
      let badgeBg = "#d97706"; // Amber (medium)
      let label = "Moyen";
      if (m.score >= 85) {
        badgeBg = "#059669"; // Emerald (excellent)
        label = "Excellent";
      } else if (m.score >= 70) {
        badgeBg = "#2563eb"; // Blue (good)
        label = "Bon";
      }

      const isSelected = selectedRequestId && String(selectedRequestId) === String(m.id);

      const markerIcon = L.divIcon({
        className: "custom-opportunity-pin",
        html: `
          <div style="
            background: ${badgeBg};
            color: white;
            border: ${isSelected ? "3px solid #800020" : "2px solid white"};
            border-radius: 9999px;
            padding: 3px 7px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            gap: 3px;
            font-size: 10px;
            font-weight: 800;
            transform: ${isSelected ? "scale(1.15)" : "scale(1)"};
            transition: transform 0.2s;
            cursor: pointer;
          ">
            <span>📦</span>
            <span>${m.score}%</span>
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12],
      });

      const departureMarker = L.marker(depCoord, { icon: markerIcon }).addTo(layer);

      // Route dashed line connecting departure to arrival
      if (m.arrival?.lat && m.arrival?.lng) {
        const arrCoord = [m.arrival.lat, m.arrival.lng];
        bounds.push(arrCoord);

        const routeLine = L.polyline([depCoord, arrCoord], {
          color: badgeBg,
          weight: isSelected ? 3 : 2,
          dashArray: "4, 6",
          opacity: 0.65,
        }).addTo(layer);

        // Small destination dot
        const arrivalIcon = L.divIcon({
          className: "custom-arrival-pin",
          html: `
            <div style="
              width: 10px;
              height: 10px;
              background: #0f172a;
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            "></div>
          `,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });
        L.marker(arrCoord, { icon: arrivalIcon }).addTo(layer);
      }

      // Popup Content
      const popupHtml = `
        <div style="font-family: sans-serif; font-size: 12px; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="background: ${badgeBg}; color: white; padding: 2px 6px; border-radius: 9999px; font-weight: 800; font-size: 10px;">
              ${m.score}% • ${label}
            </span>
            <span style="font-size: 11px; font-weight: bold; color: #800020;">
              ${m.distanceKm !== null ? `~${m.distanceKm} km` : ""}
            </span>
          </div>
          <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 4px;">
            ${m.title}
          </strong>
          <div style="color: #475569; font-size: 11px; line-height: 1.4; margin-bottom: 8px;">
            📍 <strong>Départ :</strong> ${m.departure.city} (${m.departure.governorate})<br/>
            🏁 <strong>Arrivée :</strong> ${m.arrival?.city || "Non spécifiée"}<br/>
            📦 <strong>Volume :</strong> ${m.volume ? `${m.volume} m³` : "Non estimé"}<br/>
            ${m.estimatedBudget ? `💰 <strong>Budget :</strong> ${m.estimatedBudget}` : ""}
          </div>
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <a href="/company/requests/${m.id}" style="
              flex: 1;
              text-align: center;
              background: #f1f5f9;
              color: #0f172a;
              font-weight: 700;
              font-size: 11px;
              padding: 6px 10px;
              border-radius: 8px;
              text-decoration: none;
              border: 1px solid #cbd5e1;
            ">Voir détails</a>
            <a href="/company/quotes/new/${m.id}" style="
              flex: 1.2;
              text-align: center;
              background: #800020;
              color: white;
              font-weight: 700;
              font-size: 11px;
              padding: 6px 10px;
              border-radius: 8px;
              text-decoration: none;
            ">Proposer devis</a>
          </div>
        </div>
      `;

      departureMarker.bindPopup(popupHtml);

      departureMarker.on("click", () => {
        if (onSelectRequest) onSelectRequest(m.id);
      });
    });

    // Fit map bounds to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }

    // Invalidate map size after render
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [mapData, selectedRequestId, onSelectRequest]);

  return (
    <div className="relative w-full h-[540px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-2xl border border-slate-200/90 shadow-md text-xs space-y-1.5 pointer-events-auto">
        <div className="font-bold text-slate-800 text-[11px] mb-1">Légende de la carte</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#800020] border border-white inline-block"></span>
          <span className="text-slate-600">Siège de votre entreprise</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#059669] border border-white inline-block"></span>
          <span className="text-slate-600">Excellente affinité (≥ 85%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#2563eb] border border-white inline-block"></span>
          <span className="text-slate-600">Bonne affinité (70 - 84%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#d97706] border border-white inline-block"></span>
          <span className="text-slate-600">Affinité modérée (50 - 69%)</span>
        </div>
      </div>
    </div>
  );
}
