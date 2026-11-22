"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import SearchBar from "@/components/SearchBar";
import FilterCheckbox from "@/components/FilterCheckbox";
import FilterActivite from "@/components/FilterActivite";
import FilterArrondissement from "@/components/FilterArrondissement";
import GeolocationButton from "@/components/GeolocationButton";
import BoredMascot from "@/components/BoredMascot";
import { fetchParisSpots } from "@/lib/spotsApi";

// Dynamic import for LeafletMap with SSR disabled (Leaflet requires browser window)
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="bored-map-loader">
      <div className="bored-spinner"></div>
      <span>Initialisation de la carte Leaflet...</span>
    </div>
  )
});

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterGratuit, setFilterGratuit] = useState(false);
  const [filterOuvert, setFilterOuvert] = useState(false);
  const [filterActivite, setFilterActivite] = useState("");
  const [filterArrondissement, setFilterArrondissement] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [userLocation, setUserLocation] = useState(null);
  const [activeView, setActiveView] = useState("map"); // "map", "table", "split"
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [randomToast, setRandomToast] = useState(null);

  const searchTimeoutRef = useRef(null);
  const mapSectionRef = useRef(null);
  const tableSectionRef = useRef(null);

  // Fetch search data from API with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(function () {
      async function fetchData() {
        setLoading(true);
        try {
          const results = await fetchParisSpots(query);
          setData(results || []);
        } catch (e) {
          setData([]);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }, 350);

    return function () {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // Haversine distance formula in kilometers
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [];

    for (let i = 0; i < data.length; i++) {
      let item = data[i];
      let keepItem = true;

      if (filterGratuit && String(item.payant || "").toLowerCase() !== "non") {
        keepItem = false;
      }

      if (filterOuvert && String(item.statut_ouverture || "").toLowerCase() !== "ouvert") {
        keepItem = false;
      }

      if (filterActivite && item.type !== filterActivite) {
        keepItem = false;
      }

      const itemArrond = item.arrondissement || item.commune;
      if (filterArrondissement && itemArrond !== filterArrondissement) {
        keepItem = false;
      }

      if (keepItem) {
        result.push(item);
      }
    }

    if (userLocation) {
      for (let j = 0; j < result.length; j++) {
        const item = result[j];
        let lat, lon;

        if (item.geo_point_2d) {
          if (typeof item.geo_point_2d.lat === "number") {
            lat = item.geo_point_2d.lat;
            lon = item.geo_point_2d.lon;
          } else if (Array.isArray(item.geo_point_2d)) {
            lat = item.geo_point_2d[0];
            lon = item.geo_point_2d[1];
          }
        } else if (item.coordonnees_geographiques) {
          if (typeof item.coordonnees_geographiques.lat === "number") {
            lat = item.coordonnees_geographiques.lat;
            lon = item.coordonnees_geographiques.lon;
          } else if (Array.isArray(item.coordonnees_geographiques)) {
            lat = item.coordonnees_geographiques[0];
            lon = item.coordonnees_geographiques[1];
          }
        }

        if (lat && lon) {
          item._sortDistance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            lat,
            lon
          );
        } else {
          item._sortDistance = 999999;
        }
      }

      result.sort((a, b) => a._sortDistance - b._sortDistance);
    }

    return result;
  }, [data, filterGratuit, filterOuvert, filterActivite, filterArrondissement, userLocation]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, filterGratuit, filterOuvert, filterActivite, filterArrondissement, userLocation]);

  function handleResetFilters() {
    setFilterGratuit(false);
    setFilterOuvert(false);
    setFilterActivite("");
    setFilterArrondissement("");
    setCurrentPage(1);
    setUserLocation(null);
    setSelectedSpot(null);
  }

  // Bored.com "Surprise Me" Random Pick
  function handleRandomPick() {
    if (!filteredData || filteredData.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredData.length);
    const spot = filteredData[randomIndex];
    setSelectedSpot(spot);

    const nom = spot.nom || spot.name || spot.voie || "Spot secret";
    setRandomToast({
      title: "🎲 Spot Surprise Tiré au Sort !",
      nom,
      arrondissement: spot.arrondissement || spot.commune || "Paris",
      type: spot.type || "Activité"
    });

    // Automatically switch to map view if not visible, and scroll to it
    if (activeView === "table") {
      setActiveView("map");
    }

    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    setTimeout(() => {
      setRandomToast(null);
    }, 5000);
  }

  // Handle "Voir sur la carte" from table
  function handleFocusSpotOnMap(item) {
    setSelectedSpot(item);
    if (activeView === "table") {
      setActiveView("map");
    }
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="bored-app">
      {/* Background Retro Grid & Glow */}
      <div className="bored-bg-glow"></div>
      <div className="bored-bg-grid"></div>

      {/* Bored.com Top Brand Header */}
      <header className="bored-header">
        <div className="bored-header-inner">
          <div className="bored-brand">
            <div className="bored-logo-group">
              <span className="bored-logo-text">bored<span className="dot">.</span></span>
              <span className="bored-mascot-eye">(-.-)</span>
            </div>
            <span className="bored-tagline">PARIS ANTI-ENNUI DIRECTORY</span>
          </div>

          <div className="bored-header-actions">
            {/* View Switcher Pills */}
            <div className="bored-view-switch">
              <button
                type="button"
                className={`switch-tab ${activeView === "map" ? "active" : ""}`}
                onClick={() => setActiveView("map")}
              >
                <span className="tab-icon">🗺️</span>
                <span>Carte</span>
              </button>
              <button
                type="button"
                className={`switch-tab ${activeView === "table" ? "active" : ""}`}
                onClick={() => setActiveView("table")}
              >
                <span className="tab-icon">📋</span>
                <span>Tableau</span>
              </button>
              <button
                type="button"
                className={`switch-tab ${activeView === "split" ? "active" : ""}`}
                onClick={() => setActiveView("split")}
              >
                <span className="tab-icon">🔀</span>
                <span>Mixte</span>
              </button>
            </div>

            {/* Quick Surprise Button */}
            <button
              type="button"
              className="bored-hero-dice-btn"
              onClick={handleRandomPick}
              title="Tirer un spot au sort !"
            >
              🎲 Surprise Me
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="bored-main-container">
        {/* Hero Section */}
        <section className="bored-hero-section">
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            <span>+150 spots parisiens pour tuer le temps</span>
          </div>
          <h1 className="bored-hero-title">
            Ne reste pas à t&apos;ennuyer. <br className="hidden-mobile" />
            <span className="gradient-text">Trouve un spot insolite à Paris.</span>
          </h1>
          <p className="bored-hero-desc">
            Explore les parcs frais, fontaines à boire, musées, équipements sportifs et coins cachés de la capitale.
          </p>

          {/* Search Bar with bored.com styling */}
          <SearchBar onQueryChange={setQuery} onRandomPick={handleRandomPick} />
        </section>

        {/* Random Toast Banner */}
        {randomToast && (
          <div className="bored-random-toast">
            <div className="toast-content">
              <span className="toast-badge">{randomToast.title}</span>
              <strong className="toast-name">{randomToast.nom}</strong>
              <span className="toast-meta">
                📍 {randomToast.arrondissement} • {randomToast.type}
              </span>
            </div>
            <button
              className="toast-close"
              onClick={() => setRandomToast(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Filters Toolbar */}
        <section className="bored-filters-section">
          <div className="filters-top-row">
            <div className="filter-checkboxes">
              <FilterCheckbox
                checked={filterGratuit}
                onChange={(e) => setFilterGratuit(e.target.checked)}
                label="Gratuit uniquement"
                badge="100% Free"
              />
              <FilterCheckbox
                checked={filterOuvert}
                onChange={(e) => setFilterOuvert(e.target.checked)}
                label="Ouvert actuellement"
                badge="Open"
              />
            </div>

            <div className="filters-action-group">
              <GeolocationButton onLocationUpdate={setUserLocation} />
              <button
                type="button"
                className="bored-reset-btn"
                onClick={handleResetFilters}
              >
                ↺ Réinitialiser
              </button>
            </div>
          </div>

          <div className="filters-dropdowns-row">
            <FilterActivite
              data={data}
              value={filterActivite}
              onChange={(e) => setFilterActivite(e.target.value)}
            />
            <FilterArrondissement
              data={data}
              value={filterArrondissement}
              onChange={(e) => setFilterArrondissement(e.target.value)}
            />
          </div>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="bored-loading-card">
            <div className="bored-spinner"></div>
            <p className="loading-text">Recherche des meilleurs spots parisiens...</p>
          </div>
        )}

        {/* Results Container (Map, Table, or Split) */}
        {!loading && (
          <div className="bored-content-layout">
            {/* 1. Leaflet Map Section */}
            {(activeView === "map" || activeView === "split") && (
              <div
                className={`bored-view-panel map-panel ${activeView === "split" ? "is-split" : "is-full"}`}
                ref={mapSectionRef}
              >
                <div className="panel-header">
                  <div className="panel-title-group">
                    <span className="panel-icon">🗺️</span>
                    <h2 className="panel-title">Carte Interactive Leaflet</h2>
                    <span className="panel-count-pill">{filteredData.length} spots</span>
                  </div>
                  <span className="panel-hint">Clique sur une épingle pour voir les infos et l&apos;itinéraire</span>
                </div>

                <LeafletMap
                  data={filteredData}
                  userLocation={userLocation}
                  selectedSpot={selectedSpot}
                  onSelectSpot={(item) => setSelectedSpot(item)}
                />
              </div>
            )}

            {/* 2. Table Section */}
            {(activeView === "table" || activeView === "split") && (
              <div
                className={`bored-view-panel table-panel ${activeView === "split" ? "is-split" : "is-full"}`}
                ref={tableSectionRef}
              >
                <div className="panel-header">
                  <div className="panel-title-group">
                    <span className="panel-icon">📋</span>
                    <h2 className="panel-title">Annuaire des Spots</h2>
                    <span className="panel-count-pill">{filteredData.length} résultats</span>
                  </div>
                  <div className="panel-actions">
                    <button
                      type="button"
                      className="bored-subtle-btn"
                      onClick={() => setActiveView("map")}
                      title="Afficher la carte Leaflet"
                    >
                      🗺️ Voir en plein écran carte
                    </button>
                  </div>
                </div>

                <div className="bored-table-wrapper">
                  <table className="bored-table">
                    <thead>
                      <tr>
                        <th>LIEU</th>
                        <th>ACTIVITÉ</th>
                        <th>ACCÈS</th>
                        <th>ADRESSE</th>
                        <th>QUARTIER</th>
                        <th>HORAIRES</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.length > 0 ? (
                        paginatedData.map((item, idx) => {
                          const nom = item.nom || item.name || item.voie || "Lieu sans nom";
                          const isGratuit = String(item.payant || "").toLowerCase() === "non" || !item.payant;
                          const activite = item.type || item.type_objet || "Fontaine";
                          const arrondissement = item.arrondissement || item.commune || "Paris";
                          const adresseText = [item.adresse, item.no_voirie_pair, item.no_voirie_impair, item.commune].filter(Boolean).join(" ") || "Paris";
                          const horaires = item.horaires_periode || item.statut_ouverture || "Libre";
                          const isSelected = selectedSpot && (selectedSpot.identifiant === item.identifiant || selectedSpot.gid === item.gid);

                          return (
                            <tr
                              key={item.identifiant || item.gid || idx}
                              className={`bored-row ${isSelected ? "selected-row" : ""}`}
                            >
                              <td className="cell-lieu">
                                <a
                                  href={`https://www.google.com/search?q=${encodeURIComponent(nom + " Paris")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="lieu-link"
                                >
                                  {nom}
                                </a>
                                {item._sortDistance && item._sortDistance < 99999 && (
                                  <span className="distance-pill">
                                    ⚡ {item._sortDistance.toFixed(2)} km
                                  </span>
                                )}
                              </td>

                              <td className="cell-activite">
                                <span className="category-pill">{activite}</span>
                              </td>

                              <td className="cell-payant">
                                <span className={`badge-payant ${isGratuit ? "free" : "paid"}`}>
                                  {isGratuit ? "GRATUIT" : "PAYANT"}
                                </span>
                              </td>

                              <td className="cell-adresse">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nom + " " + adresseText)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="adresse-link"
                                >
                                  {adresseText}
                                </a>
                              </td>

                              <td className="cell-arrond">
                                <span className="arrond-badge">{arrondissement}</span>
                              </td>

                              <td className="cell-horaires">{horaires}</td>

                              <td className="cell-actions">
                                <button
                                  type="button"
                                  className="bored-pin-action-btn"
                                  onClick={() => handleFocusSpotOnMap(item)}
                                  title="Localiser sur la carte Leaflet"
                                >
                                  📍 Carte
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="empty-state">
                            <div className="empty-content">
                              <span className="empty-icon">🏜️</span>
                              <p className="empty-text">Aucun spot ne correspond à vos filtres.</p>
                              <button
                                type="button"
                                className="bored-reset-btn inline"
                                onClick={handleResetFilters}
                              >
                                Réinitialiser les filtres
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredData.length > 0 && (
                  <div className="bored-pagination">
                    <div className="pagination-info">
                      Affichage de <strong>{startIndex + 1}</strong> à <strong>{Math.min(endIndex, filteredData.length)}</strong> sur <strong>{filteredData.length}</strong> spots
                    </div>

                    <div className="pagination-controls">
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        title="Première page"
                      >
                        «
                      </button>
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        title="Page précédente"
                      >
                        ‹
                      </button>

                      <span className="page-current">
                        Page <strong>{currentPage}</strong> / {totalPages}
                      </span>

                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        title="Page suivante"
                      >
                        ›
                      </button>
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        title="Dernière page"
                      >
                        »
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bored.com Mascot Floating Action Widget */}
      <BoredMascot
        onRandomPick={handleRandomPick}
        spotsCount={filteredData.length}
      />

      {/* Bored.com Arcade Footer */}
      <footer className="bored-footer">
        <div className="bored-footer-inner">
          <div className="footer-brand">
            <span className="bored-logo-small">bored<span className="dot">.</span></span>
            <p className="footer-tagline">Tuer l&apos;ennui à Paris • Données en Open Data de la Ville de Paris</p>
          </div>
          <div className="footer-links">
            <a href="https://opendata.paris.fr" target="_blank" rel="noopener noreferrer">
              OpenData Paris
            </a>
            <span className="divider">•</span>
            <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">
              Leaflet
            </a>
            <span className="divider">•</span>
            <span>Réalisé pour QuanticFactory</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
