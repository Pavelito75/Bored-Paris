"use client";

export default function FilterArrondissement({ data, value, onChange }) {
  function generateOptions() {
    var lieux = [];

    for (var i = 0; i < data.length; i++) {
      var lieu = data[i].arrondissement || data[i].commune;
      if (lieu && lieux.indexOf(lieu) === -1) {
        lieux.push(lieu);
      }
    }

    lieux.sort(function(a, b) {
      return a.localeCompare(b, "fr", { numeric: true });
    });

    var options = [];
    if (lieux.length > 0) {
      for (var j = 0; j < lieux.length; j++) {
        options.push(
          <option key={lieux[j]} value={lieux[j]}>
            {lieux[j]}
          </option>
        );
      }
    }
    return options;
  }

  return (
    <div className="bored-select-container">
      <label className="bored-select-label">
        <span className="label-icon">📍</span>
        <span>Arrondissement :</span>
      </label>
      <div className="bored-select-wrapper">
        <select className="bored-select" value={value} onChange={onChange}>
          <option value="">Tous les quartiers</option>
          {generateOptions()}
        </select>
        <span className="bored-select-arrow">▼</span>
      </div>
    </div>
  );
}
