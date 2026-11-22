'use client';

import { useState } from "react";

export default function SearchBar({ onQueryChange, onRandomPick }) {
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onQueryChange) onQueryChange(val);
  };

  const handleClear = () => {
    setQuery("");
    if (onQueryChange) onQueryChange("");
  };

  return (
    <div className="bored-search-wrapper">
      <div className="bored-search-bar">
        <span className="search-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input
          className="search-bar-input"
          value={query}
          onChange={handleChange}
          placeholder="Je m'ennuie... cherche un parc, fontaine, sport, musée, rue..."
        />
        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={handleClear}
            title="Effacer la recherche"
          >
            ✕
          </button>
        )}
      </div>

      {onRandomPick && (
        <button
          type="button"
          className="bored-random-btn"
          onClick={onRandomPick}
          title="Tirer un spot au sort !"
        >
          <span className="dice-icon">🎲</span>
          <span className="btn-label">Surprise !</span>
        </button>
      )}
    </div>
  );
}
