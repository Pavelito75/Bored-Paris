"use client";

import { useState } from "react";

export default function GeolocationButton({ onLocationUpdate }) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationSuccess, setLocationSuccess] = useState(false);

  function getUserLocation() {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      setLocationError("");
      setLocationSuccess(false);

      navigator.geolocation.getCurrentPosition(
        function (position) {
          var location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          onLocationUpdate(location);
          setLocationSuccess(true);
          setIsGettingLocation(false);
        },
        function (error) {
          var errorMessage = "";
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Permission refusée";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage = "Position indisponible";
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "Délai dépassé";
          } else {
            errorMessage = "Erreur de géolocalisation";
          }
          setLocationError(errorMessage);
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationError("Géolocalisation non supportée.");
    }
  }

  return (
    <div className="geolocation-container">
      <button
        type="button"
        className={`bored-geo-btn ${locationSuccess ? "is-active" : ""}`}
        onClick={getUserLocation}
        disabled={isGettingLocation}
        title="Trier les résultats par proximité"
      >
        <span className={`geo-radar-icon ${isGettingLocation ? "scanning" : ""}`}>
          🎯
        </span>
        <span>
          {isGettingLocation
            ? "Recherche GPS..."
            : locationSuccess
            ? "Position activée ✓"
            : "Autour de moi"}
        </span>
      </button>

      {locationError && (
        <span className="bored-geo-status error">⚠️ {locationError}</span>
      )}
    </div>
  );
}
