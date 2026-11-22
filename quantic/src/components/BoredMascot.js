"use client";

import { useState } from "react";

export default function BoredMascot({ onRandomPick, spotsCount = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mascotMood, setMascotMood] = useState("sleepy"); // "sleepy", "awake", "excited"

  const handlePoke = () => {
    setMascotMood("excited");
    if (onRandomPick) {
      onRandomPick();
    }
    setTimeout(() => {
      setMascotMood("sleepy");
    }, 2000);
  };

  return (
    <div className="bored-mascot-fab-container">
      {isOpen && (
        <div className="bored-mascot-bubble">
          <div className="bubble-header">
            <span className="bubble-tag">👁️ L&apos;œil Anti-Ennui</span>
            <button className="bubble-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <p className="bubble-text">
            Tu traînes ici sans savoir quoi faire ? 
            {spotsCount > 0 && <strong> Il y a {spotsCount} spots parisiens à explorer !</strong>}
          </p>
          <button className="bubble-action-btn" onClick={handlePoke}>
            🎲 Téléporte-moi vers un spot au hasard !
          </button>
        </div>
      )}

      <button
        type="button"
        className={`bored-mascot-fab mood-${mascotMood}`}
        onClick={() => {
          setIsOpen(!isOpen);
          handlePoke();
        }}
        title="L'œil Bored.com - Clique pour un spot aléatoire !"
      >
        <div className="mascot-face">
          {mascotMood === "excited" ? (
            <span className="face-eyes">( ◕‿◕ )</span>
          ) : mascotMood === "awake" ? (
            <span className="face-eyes">( •_• )</span>
          ) : (
            <span className="face-eyes">(-.-)</span>
          )}
          <span className="mascot-label">bored.</span>
        </div>
        <span className="mascot-pulse-ring"></span>
      </button>
    </div>
  );
}
