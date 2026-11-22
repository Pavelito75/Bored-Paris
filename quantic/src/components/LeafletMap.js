"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import "leaflet/dist/leaflet.css";

// Helper to extract [lat, lon] from various OpenData Paris field formats
export function getCoordinates(item) {
  if (!item) return null;

  // 1. geo_point_2d: { lat, lon } or [lat, lon]
  if (item.geo_point_2d) {
    if (typeof item.geo_point_2d.lat === "number" && typeof item.geo_point_2d.lon === "number") {
      return [item.geo_point_2d.lat, item.geo_point_2d.lon];
    }
    if (Array.isArray(item.geo_point_2d) && item.geo_point_2d.length >= 2) {
      const lat = Number(item.geo_point_2d[0]);
      const lon = Number(item.geo_point_2d[1]);
      if (!isNaN(lat) && !isNaN(lon)) return [lat, lon];
    }
  }

  // 2. coordonnees_geographiques: { lat, lon } or [lat, lon]
  if (item.coordonnees_geographiques) {
    if (typeof item.coordonnees_geographiques.lat === "number" && typeof item.coordonnees_geographiques.lon === "number") {
      return [item.coordonnees_geographiques.lat, item.coordonnees_geographiques.lon];
    }
    if (Array.isArray(item.coordonnees_geographiques) && item.coordonnees_geographiques.length >= 2) {
      const lat = Number(item.coordonnees_geographiques[0]);
      const lon = Number(item.coordonnees_geographiques[1]);
      if (!isNaN(lat) && !isNaN(lon)) return [lat, lon];
    }
  }

  // 3. geom GeoJSON format: { geometry: { coordinates: [lon, lat] } }
  if (item.geom?.geometry?.coordinates && Array.isArray(item.geom.geometry.coordinates)) {
    const coords = item.geom.geometry.coordinates;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      return [coords[1], coords[0]]; // GeoJSON coordinates are [lon, lat]
    }
  }

  // 4. geom array: [lon, lat]
  if (item.geom?.coordinates && Array.isArray(item.geom.coordinates)) {
    const coords = item.geom.coordinates;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      return [coords[1], coords[0]];
    }
  }

  // 5. geometry GeoJSON: { coordinates: [lon, lat] }
  if (item.geometry?.coordinates && Array.isArray(item.geometry.coordinates)) {
    const coords = item.geometry.coordinates;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      return [coords[1], coords[0]];
    }
  }

  // 6. Direct lat / lon numbers
  if (typeof item.lat === "number" && typeof item.lon === "number") {
    return [item.lat, item.lon];
  }
  if (typeof item.latitude === "number" && typeof item.longitude === "number") {
    return [item.latitude, item.longitude];
  }

  return null;
}

// Get category metadata for marker styling
function getCategoryMeta(item) {
  const type = (item.type || item.type_objet || "").toLowerCase();
  const nom = (item.nom || item.name || item.voie || "").toLowerCase();
  const combined = `${type} ${nom}`;

  if (combined.includes("fontaine") || combined.includes("boire") || combined.includes("eau")) {
    return {
      name: "Fontaine",
      color: "#00f0ff", // Electric Cyan
      glow: "rgba(0, 240, 255, 0.45)",
      icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`
    };
  }

  if (combined.includes("vert") || combined.includes("parc") || combined.includes("jardin") || combined.includes("bois") || combined.includes("square") || combined.includes("promenade")) {
    return {
      name: "Espace Vert",
      color: "#00ff88", // Neon Emerald
      glow: "rgba(0, 255, 136, 0.45)",
      icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2L6 8h3v6H7v4h10v-4h-2V8h3l-6-6zm-1 18h2v2h-2v-2z"/></svg>`
    };
  }

  if (combined.includes("sport") || combined.includes("piscine") || combined.includes("jeu") || combined.includes("loisir") || combined.includes("terrain") || combined.includes("stade")) {
    return {
      name: "Sport & Loisirs",
      color: "#ffe600", // Arcade Yellow
      glow: "rgba(255, 230, 0, 0.45)",
      icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
    };
  }

  if (combined.includes("musée") || combined.includes("culture") || combined.includes("bibliothèque") || combined.includes("theatre") || combined.includes("spectacle")) {
    return {
      name: "Culture",
      color: "#b057ff", // Neon Purple
      glow: "rgba(176, 87, 255, 0.45)",
      icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 3L2 9v2h20V9L12 3zm-7 8v7h3v-7H5zm5 0v7h4v-7h-4zm6 0v7h3v-7h-3zm-14 9v2h20v-2H2z"/></svg>`
    };
  }

  return {
    name: item.type || "Spot Paris",
    color: "#ff3366", // Bored Red/Coral
    glow: "rgba(255, 51, 102, 0.45)",
    icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>`
  };
}

export default function LeafletMap({
  data = [],
  userLocation = null,
  selectedSpot = null,
  onSelectSpot = () => {},
  className = ""
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const markersMapRef = useRef(new Map());

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapTheme, setMapTheme] = useState("dark"); // "dark" (CartoDB Dark Matter) or "light" (OSM / Positron)
  const [totalPinned, setTotalPinned] = useState(0);

  // Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    let L;
    try {
      L = require("leaflet");
    } catch (e) {
      console.error("Leaflet failed to load:", e);
      return;
    }

    // Default center: Paris City Center
    const parisCenter = [48.8566, 2.3522];
    const initialCenter = userLocation ? [userLocation.latitude, userLocation.longitude] : parisCenter;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // Custom positioned zoom control
    L.control.zoom({ position: "topright" }).addTo(map);

    // Attribution
    L.control.attribution({
      position: "bottomright",
      prefix: '<span>© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style="color: #00f0ff;">OpenStreetMap</a> contributors • <a href="https://bored.com" target="_blank" rel="noreferrer" style="color: #ff3366; font-weight: bold;">bored.</a></span>'
    }).addTo(map);

    // 100% Free OpenStreetMap Tile Layer - NO API key required!
    const osmTileLayer = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        className: mapTheme === "dark" ? "bored-osm-dark-tiles" : "bored-osm-light-tiles"
      }
    );

    osmTileLayer.addTo(map);
    map._currentTileLayer = osmTileLayer;

    // Feature group for markers
    const markersLayer = L.featureGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;
    setMapLoaded(true);

    // Force map to adapt to its container size
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Tile Layer styling when mapTheme changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map._currentTileLayer) return;

    const container = map._currentTileLayer.getContainer();
    if (container) {
      if (mapTheme === "dark") {
        container.classList.add("bored-osm-dark-tiles");
        container.classList.remove("bored-osm-light-tiles");
      } else {
        container.classList.remove("bored-osm-dark-tiles");
        container.classList.add("bored-osm-light-tiles");
      }
    }
  }, [mapTheme]);

  // Update Markers when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer || !mapLoaded) return;

    let L;
    try {
      L = require("leaflet");
    } catch (e) {
      return;
    }

    markersLayer.clearLayers();
    markersMapRef.current.clear();

    const bounds = L.latLngBounds();
    let validCount = 0;

    data.forEach((item, index) => {
      const coords = getCoordinates(item);
      if (!coords) return;

      const [lat, lon] = coords;
      if (isNaN(lat) || isNaN(lon)) return;

      validCount++;
      bounds.extend([lat, lon]);

      const meta = getCategoryMeta(item);
      const isSelected = selectedSpot && (
        (item.identifiant && item.identifiant === selectedSpot.identifiant) ||
        (item.gid && item.gid === selectedSpot.gid) ||
        (item.nom && item.nom === selectedSpot.nom)
      );

      // Bored.com Arcade Neon Pin (custom DivIcon)
      const pinHtml = `
        <div class="bored-pin-wrapper ${isSelected ? 'selected' : ''}" style="--pin-color: ${meta.color}; --pin-glow: ${meta.glow};">
          <div class="bored-pin-head">
            <span class="bored-pin-icon">${meta.icon}</span>
          </div>
          <div class="bored-pin-pulse"></div>
          <div class="bored-pin-tip"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "bored-leaflet-div-icon",
        html: pinHtml,
        iconSize: [32, 42],
        iconAnchor: [16, 40],
        popupAnchor: [0, -38]
      });

      const marker = L.marker([lat, lon], { icon: customIcon });

      // Build rich Bored.com style popup
      const nom = item.nom || item.name || item.voie || "Lieu sans nom";
      const typeLabel = item.type || meta.name;
      const adresse = [item.adresse, item.no_voirie_pair, item.no_voirie_impair, item.commune || item.arrondissement].filter(Boolean).join(" ") || "Paris";
      const isGratuit = String(item.payant || "").toLowerCase() === "non" || !item.payant;
      const horaires = item.horaires_periode || item.statut_ouverture || "Accès libre / Horaires non communiqués";
      const googleMapsQuery = encodeURIComponent(`${nom} ${adresse}`);
      const gmapsLink = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`;
      const searchLink = `https://www.google.com/search?q=${encodeURIComponent(nom + " Paris")}`;

      const distanceBadge = item._sortDistance && item._sortDistance < 99999 ? `
        <span class="bored-popup-distance">
          ⚡ ${item._sortDistance.toFixed(2)} km de vous
        </span>
      ` : "";

      const popupHtml = `
        <div class="bored-map-popup">
          <div class="bored-popup-header">
            <span class="bored-popup-category" style="background: ${meta.glow}; color: ${meta.color}; border: 1px solid ${meta.color};">
              ${typeLabel}
            </span>
            <span class="bored-popup-badge ${isGratuit ? 'free' : 'paid'}">
              ${isGratuit ? 'GRATUIT' : 'PAYANT'}
            </span>
          </div>
          <h3 class="bored-popup-title">${nom}</h3>
          <p class="bored-popup-address">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
            ${adresse}
          </p>
          <p class="bored-popup-hours">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2V7h2zm0-8h-2V6h2z"/></svg>
            ${horaires}
          </p>
          ${distanceBadge}
          <div class="bored-popup-actions">
            <a href="${gmapsLink}" target="_blank" rel="noopener noreferrer" class="bored-popup-btn gmaps-btn">
              🗺️ Itinéraire
            </a>
            <a href="${searchLink}" target="_blank" rel="noopener noreferrer" class="bored-popup-btn info-btn">
              🔍 Infos
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: "bored-custom-leaflet-popup",
        maxWidth: 320,
        minWidth: 260
      });

      marker.on("click", () => {
        onSelectSpot(item);
      });

      marker.addTo(markersLayer);

      const itemKey = item.identifiant || item.gid || `${lat}-${lon}-${index}`;
      markersMapRef.current.set(itemKey, marker);
    });

    setTotalPinned(validCount);

    // Auto-fit bounds if we have points and user is not focusing a specific spot
    if (validCount > 0 && !selectedSpot) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mapLoaded, selectedSpot]);

  // Handle User Geolocation Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    let L;
    try {
      L = require("leaflet");
    } catch (e) {
      return;
    }

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userLocation && userLocation.latitude && userLocation.longitude) {
      const userIcon = L.divIcon({
        className: "bored-user-pin",
        html: `
          <div class="bored-radar-wrapper">
            <div class="bored-radar-circle"></div>
            <div class="bored-radar-circle-2"></div>
            <div class="bored-radar-dot"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
        zIndexOffset: 1000
      });

      userMarker.bindPopup(`
        <div class="bored-map-popup user-popup">
          <div class="bored-popup-header">
            <span class="bored-popup-category" style="background: rgba(0, 240, 255, 0.2); color: #00f0ff;">
              📍 Votre position
            </span>
          </div>
          <h3 class="bored-popup-title">Vous êtes ici !</h3>
          <p class="bored-popup-address">Les résultats sont classés par distance par rapport à cette position.</p>
        </div>
      `, {
        className: "bored-custom-leaflet-popup"
      });

      userMarker.addTo(map);
      userMarkerRef.current = userMarker;
    }
  }, [userLocation, mapLoaded]);

  // Fly to selected spot
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedSpot || !mapLoaded) return;

    const coords = getCoordinates(selectedSpot);
    if (!coords) return;

    map.flyTo(coords, 16, {
      animate: true,
      duration: 1.2
    });

    // Find and open marker popup
    const itemKey = selectedSpot.identifiant || selectedSpot.gid;
    if (itemKey && markersMapRef.current.has(itemKey)) {
      const marker = markersMapRef.current.get(itemKey);
      setTimeout(() => {
        marker.openPopup();
      }, 700);
    }
  }, [selectedSpot, mapLoaded]);

  // Controls
  const handleRecenter = useCallback(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    if (markersLayer.getLayers().length > 0) {
      map.fitBounds(markersLayer.getBounds(), {
        padding: [50, 50],
        maxZoom: 15,
        animate: true
      });
    } else {
      map.setView([48.8566, 2.3522], 13);
    }
  }, []);

  const handleCenterOnUser = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    map.flyTo([userLocation.latitude, userLocation.longitude], 15, { animate: true });
    if (userMarkerRef.current) {
      userMarkerRef.current.openPopup();
    }
  }, [userLocation]);

  return (
    <div className={`bored-map-card ${className}`}>
      {/* Map Header Toolbar */}
      <div className="bored-map-toolbar">
        <div className="bored-map-stats">
          <span className="bored-map-badge">
            <span className="bored-badge-glow"></span>
            📍 {totalPinned} points épinglés
          </span>
          <span className="bored-map-subtitle">
            Carte interactive Leaflet • Paris & environs
          </span>
        </div>

        <div className="bored-map-controls">
          <button
            type="button"
            className="bored-ctrl-btn"
            onClick={handleRecenter}
            title="Recadrer sur tous les points"
          >
            🎯 Recadrer
          </button>

          {userLocation && (
            <button
              type="button"
              className="bored-ctrl-btn user-btn"
              onClick={handleCenterOnUser}
              title="Centrer sur ma position"
            >
              📍 Ma position
            </button>
          )}

          <button
            type="button"
            className="bored-ctrl-btn theme-toggle"
            onClick={() => setMapTheme(mapTheme === "dark" ? "light" : "dark")}
            title="Changer le style de carte"
          >
            {mapTheme === "dark" ? "☀️ Clair" : "🌙 Sombre"}
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="bored-leaflet-container" ref={mapContainerRef}>
        {!mapLoaded && (
          <div className="bored-map-loader">
            <div className="bored-spinner"></div>
            <span>Chargement de la carte Leaflet...</span>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="bored-map-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#00f0ff", boxShadow: "0 0 8px #00f0ff" }}></span>
          <span>Fontaines</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#00ff88", boxShadow: "0 0 8px #00ff88" }}></span>
          <span>Espaces Verts</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#ffe600", boxShadow: "0 0 8px #ffe600" }}></span>
          <span>Sports & Loisirs</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#b057ff", boxShadow: "0 0 8px #b057ff" }}></span>
          <span>Culture & Musées</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: "#ff3366", boxShadow: "0 0 8px #ff3366" }}></span>
          <span>Autres Lieux</span>
        </div>
      </div>
    </div>
  );
}
